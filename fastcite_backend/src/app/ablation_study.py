"""
Ablation Study Framework for RAG System

This module provides a comprehensive framework for testing different components
of the RAG pipeline to understand their individual contributions.

Components being tested:
1. Retrieval methods (vector-only, keyword-only, hybrid with different weights)
2. Context selection strategies (LLM-based, score-based, no selection)
3. Number of contexts (top_k variations)
4. Relevance filtering (with/without score thresholds)
"""

import json
import time
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
import numpy as np

from app.helpers import (
    search_similar_in_book,
    search_keywords_in_book,
    hybrid_search_in_book,
    QDRANT_CLIENT,
    COLLECTION_NAME
)
from app.embedder import embedder
from app.helpers import client_genai, AIMODEL
from app.rate_limiter import check_rate_limit, record_api_call
from app.accuracy_evaluation import AccuracyEvaluator
from google.genai.types import Content, Part
import re
import time


@dataclass
class AblationConfig:
    """Configuration for a single ablation experiment."""
    # Required fields (no defaults) - must come first
    retrieval_method: str  # 'vector_only', 'keyword_only', 'hybrid'
    context_selection_method: str  # 'llm_based', 'score_based', 'no_selection'
    
    # Optional fields with defaults
    vector_weight: float = 0.6  # For hybrid search
    keyword_weight: float = 0.4  # For hybrid search
    top_k_retrieval: int = 20  # Number of contexts to retrieve
    top_k_selection: int = 10  # Number of contexts to select (for LLM/score-based)
    use_relevance_filter: bool = False
    min_score_threshold: float = 0.3
    use_current_info: bool = True  # Whether to include current date/time info
    experiment_name: str = ""
    description: str = ""


@dataclass
class ExperimentResult:
    """Results from a single experiment run."""
    # Required fields (no defaults)
    config: AblationConfig
    query: str
    book_id: str
    timestamp: str
    
    # Retrieval results
    retrieved_contexts: List[Dict]
    retrieval_time: float
    
    # Selection results
    selected_contexts: List[Dict]
    selection_time: float
    
    # Generation results
    answer: str
    reasoning: str
    generation_time: float
    
    # Metrics
    num_retrieved: int
    num_selected: int
    avg_retrieval_score: float
    avg_selected_score: float
    
    # Accuracy metrics (optional - with defaults)
    ground_truth: Optional[str] = None
    exact_match: Optional[float] = None
    f1_score: Optional[float] = None
    semantic_similarity: Optional[float] = None
    contains_answer: Optional[float] = None


class AblationStudyRunner:
    """Main class for running ablation studies."""
    
    def __init__(self, results_dir: str = "ablation_results", evaluate_accuracy: bool = False):
        self.results_dir = Path(results_dir)
        self.results_dir.mkdir(parents=True, exist_ok=True)
        self.results: List[ExperimentResult] = []
        self.evaluate_accuracy = evaluate_accuracy
        self.accuracy_evaluator = AccuracyEvaluator() if evaluate_accuracy else None
    
    def run_experiment(
        self,
        config: AblationConfig,
        query: str,
        book_id: str,
        ground_truth: Optional[str] = None
    ) -> ExperimentResult:
        """
        Run a single experiment with the given configuration.
        
        Args:
            config: Ablation configuration
            query: User query
            book_id: Book ID to search in
            
        Returns:
            ExperimentResult with all metrics
        """
        print(f"\n{'='*60}")
        print(f"Running experiment: {config.experiment_name}")
        print(f"Query: {query[:100]}...")
        print(f"{'='*60}")
        
        # Step 1: Generate query embedding
        query_vec = embedder.embed(query)[0].tolist()
        
        # Step 2: Retrieve contexts
        retrieval_start = time.time()
        retrieved_contexts = self._retrieve_contexts(
            config, query_vec, query, book_id
        )
        retrieval_time = time.time() - retrieval_start
        
        # Step 3: Select contexts
        selection_start = time.time()
        selected_contexts = self._select_contexts(
            config, retrieved_contexts, query
        )
        selection_time = time.time() - selection_start
        
        # Step 4: Generate answer
        generation_start = time.time()
        answer, reasoning = self._generate_answer(
            config, selected_contexts, query
        )
        generation_time = time.time() - generation_start
        
        # Calculate metrics
        avg_retrieval_score = np.mean([
            c.get('score', 0) or 0 for c in retrieved_contexts
        ]) if retrieved_contexts else 0.0
        
        avg_selected_score = np.mean([
            c.get('score', 0) or 0 for c in selected_contexts
        ]) if selected_contexts else 0.0
        
        # Evaluate accuracy if ground truth is provided
        accuracy_metrics = {}
        if ground_truth and self.accuracy_evaluator:
            accuracy_metrics = self.accuracy_evaluator.evaluate(answer, ground_truth)
        
        result = ExperimentResult(
            config=config,
            query=query,
            book_id=book_id,
            timestamp=datetime.now().isoformat(),
            retrieved_contexts=retrieved_contexts,
            retrieval_time=retrieval_time,
            selected_contexts=selected_contexts,
            selection_time=selection_time,
            answer=answer,
            reasoning=reasoning,
            generation_time=generation_time,
            num_retrieved=len(retrieved_contexts),
            num_selected=len(selected_contexts),
            avg_retrieval_score=avg_retrieval_score,
            avg_selected_score=avg_selected_score,
            ground_truth=ground_truth,
            exact_match=accuracy_metrics.get('exact_match'),
            f1_score=accuracy_metrics.get('f1_score'),
            semantic_similarity=accuracy_metrics.get('semantic_similarity'),
            contains_answer=accuracy_metrics.get('contains_answer')
        )
        
        self.results.append(result)
        return result
    
    def _retrieve_contexts(
        self,
        config: AblationConfig,
        query_vec: List[float],
        query_text: str,
        book_id: str
    ) -> List[Dict]:
        """Retrieve contexts based on configuration."""
        top_k = config.top_k_retrieval
        
        if config.retrieval_method == 'vector_only':
            results = search_similar_in_book(query_vec, book_id, top_k)
        elif config.retrieval_method == 'keyword_only':
            results = search_keywords_in_book(query_text, book_id, top_k)
        elif config.retrieval_method == 'hybrid':
            results = hybrid_search_in_book(
                query_vec,
                query_text,
                book_id,
                top_k,
                vector_weight=config.vector_weight,
                keyword_weight=config.keyword_weight
            )
        else:
            raise ValueError(f"Unknown retrieval method: {config.retrieval_method}")
        
        # Apply relevance filtering if enabled
        if config.use_relevance_filter:
            results = [
                r for r in results
                if (r.get('score', 0) or 0) >= config.min_score_threshold
            ]
        
        return results
    
    def _select_contexts(
        self,
        config: AblationConfig,
        contexts: List[Dict],
        query: str
    ) -> List[Dict]:
        """Select contexts based on configuration."""
        if not contexts:
            return []
        
        if config.context_selection_method == 'no_selection':
            # Use all retrieved contexts (up to top_k_selection)
            return contexts[:config.top_k_selection]
        
        elif config.context_selection_method == 'score_based':
            # Select top-k by score
            sorted_contexts = sorted(
                contexts,
                key=lambda x: x.get('score', 0) or 0,
                reverse=True
            )
            return sorted_contexts[:config.top_k_selection]
        
        elif config.context_selection_method == 'llm_based':
            # Use LLM to select top contexts
            try:
                selected_ids = self._llm_select_contexts(contexts, query, config.top_k_selection)
                selected_contexts = [
                    c for c in contexts if c.get('id') in selected_ids
                ]
                # Ensure we have exactly top_k_selection
                if len(selected_contexts) > config.top_k_selection:
                    selected_contexts = selected_contexts[:config.top_k_selection]
                return selected_contexts
            except Exception as e:
                print(f"Error in LLM-based selection: {e}")
                # Fallback to score-based
                return self._select_contexts(
                    AblationConfig(
                        retrieval_method=config.retrieval_method,
                        context_selection_method='score_based',
                        top_k_selection=config.top_k_selection
                    ),
                    contexts,
                    query
                )
        else:
            raise ValueError(f"Unknown selection method: {config.context_selection_method}")
    
    def _generate_answer(
        self,
        config: AblationConfig,
        contexts: List[Dict],
        query: str
    ) -> Tuple[str, str]:
        """Generate answer using selected contexts."""
        # Check if question needs current information
        needs_current_info = config.use_current_info and self._needs_current_information(query)
        
        current_info = ""
        if needs_current_info:
            from datetime import datetime
            now = datetime.now()
            current_date = now.strftime("%B %d, %Y")
            current_time = now.strftime("%I:%M %p")
            current_day = now.strftime("%A")
            current_year = now.strftime("%Y")
            
            current_info = f"""
**Current Information:**
- Today's date: {current_date}
- Current day: {current_day}
- Current time: {current_time}
- Current year: {current_year}

Please use this current information to answer the question accurately."""
        
        # Build prompt
        if contexts:
            context_text = "\n\n".join([
                f"### {c.get('heading','')}\n{c.get('content','')}"
                for c in contexts
            ])
            full_prompt = f"""Use the following context from the documents to answer the question. If the context doesn't contain relevant information to answer the question, you may use your general knowledge instead.
{current_info}
Context:
{context_text}

**User Question:** {query}"""
        else:
            full_prompt = f"""Answer the following question using your general knowledge. Do not reference any documents or source materials.
{current_info}
**User Question:** {query}"""
        
        system_prompt = (
            "You are a knowledgeable AI assistant. Respond in clean Markdown with headings, bullet points, and summary. "
            "For general knowledge questions (greetings, current date/time, general facts), answer directly from your knowledge. "
            "When current date/time information is provided, use it to answer questions accurately. "
            "Do not say you cannot answer or that information is not available - provide the best answer you can."
        )
        
        try:
            answer, reasoning = self._call_llm(full_prompt, system_prompt)
            return answer, reasoning
        except Exception as e:
            return f"Error generating answer: {str(e)}", "No reasoning available"
    
    def _llm_select_contexts(self, contexts: List[Dict], user_query: str, top_k: int = 10) -> List[str]:
        """
        Use LLM to select top-k most relevant contexts.
        Direct-call version (not through Celery).
        """
        # Check rate limit
        can_proceed, wait_seconds = check_rate_limit()
        if not can_proceed:
            print(f"⏸️ Rate limit reached. Waiting {wait_seconds:.1f} seconds...")
            time.sleep(int(wait_seconds) + 1)
        
        context_list = []
        for i, c in enumerate(contexts):
            context_id = c.get('id', f'unknown_{i}')
            heading = c.get('heading', 'No heading')
            content = c.get('content', '')[:500]
            context_list.append(f"ID: {context_id}\nHeading: {heading}\nContent: {content}...\n")
        contexts_text = "\n---\n".join(context_list)
        
        selection_prompt = f"""
        You are given {len(contexts)} context passages and a user query.
        Select the TOP {top_k} most relevant context passages that best help answer the user's question.
        
        USER QUERY: {user_query}
        
        AVAILABLE CONTEXTS:
        {contexts_text}
        
        Respond with ONLY JSON:
        {{"selected_ids": ["id1", "id2", "id3", ...]}}
        """
        
        try:
            response = client_genai.models.generate_content(
                model=AIMODEL,
                contents=[
                    Content(role="model", parts=[Part(text="You are an expert at evaluating context relevance.")]),
                    Content(role="user", parts=[Part(text=selection_prompt)])
                ]
            )
            record_api_call()
            
            cleaned = re.sub(r"^```json\s*|```$", "", response.text.strip(), flags=re.MULTILINE).strip()
            parsed = json.loads(cleaned)
            selected_ids = parsed.get("selected_ids", [])
            return selected_ids[:top_k] if len(selected_ids) >= top_k else selected_ids
        except Exception as e:
            print(f"Error in LLM selection: {e}")
            # Fallback to top-k by score
            sorted_contexts = sorted(
                contexts,
                key=lambda x: x.get('score', 0) or 0,
                reverse=True
            )
            return [c.get('id') for c in sorted_contexts[:top_k]]
    
    def _call_llm(self, full_prompt: str, system_prompt: str) -> Tuple[str, str]:
        """
        Call LLM to generate answer.
        Direct-call version (not through Celery).
        """
        # Check rate limit
        can_proceed, wait_seconds = check_rate_limit()
        if not can_proceed:
            print(f"⏸️ Rate limit reached. Waiting {wait_seconds:.1f} seconds...")
            time.sleep(int(wait_seconds) + 1)
        
        try:
            response = client_genai.models.generate_content(
                model=AIMODEL,
                contents=[
                    Content(role="model", parts=[Part(text=system_prompt)]),
                    Content(role="user", parts=[Part(text=full_prompt)])
                ]
            )
            record_api_call()
            
            answer = response.text.strip()
            return answer, "No reasoning available (Gemini API does not return reasoning steps)"
        except Exception as e:
            error_str = str(e)
            print(f"Error calling Gemini model: {e}")
            return f"Error: {error_str}", "No reasoning available"
    
    def _needs_current_information(self, query: str) -> bool:
        """Detect if a question requires current/real-time information."""
        query_lower = query.lower().strip()
        
        date_time_patterns = [
            r'what.*today.*date', r'what.*current.*date', r'what.*time.*it',
            r'what.*time.*now', r'what.*day.*today', r'current.*date',
            r'today.*date', r'what.*date.*today', r'what.*is.*today',
            r'what.*day.*is.*it'
        ]
        if any(re.search(pattern, query_lower) for pattern in date_time_patterns):
            return True
        
        current_leader_patterns = [
            r'who.*president.*(usa|united states|america|us)',
            r'who.*prime minister.*(uk|britain|england|australia|canada|india)',
            r'who.*current.*president', r'who.*current.*leader',
            r'current.*president', r'current.*leader'
        ]
        if any(re.search(pattern, query_lower) for pattern in current_leader_patterns):
            return True
        
        current_events_patterns = [
            r'what.*current.*year', r'what.*year.*is.*it', r'current.*year',
            r'recent.*news', r'latest.*news', r'current.*events'
        ]
        if any(re.search(pattern, query_lower) for pattern in current_events_patterns):
            return True
        
        return False
    
    def save_results(self, filename: Optional[str] = None):
        """Save all experiment results to JSON file."""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"ablation_results_{timestamp}.json"
        
        filepath = self.results_dir / filename
        
        # Convert results to JSON-serializable format
        results_data = []
        for result in self.results:
            result_dict = asdict(result)
            # Convert config dataclass to dict
            result_dict['config'] = asdict(result.config)
            results_data.append(result_dict)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(results_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Results saved to: {filepath}")
        return filepath
    
    def generate_summary_report(self) -> Dict[str, Any]:
        """Generate a summary report of all experiments."""
        if not self.results:
            return {"error": "No results to summarize"}
        
        summary = {
            "total_experiments": len(self.results),
            "experiments_by_config": {},
            "average_metrics": {
                "retrieval_time": np.mean([r.retrieval_time for r in self.results]),
                "selection_time": np.mean([r.selection_time for r in self.results]),
                "generation_time": np.mean([r.generation_time for r in self.results]),
                "total_time": np.mean([
                    r.retrieval_time + r.selection_time + r.generation_time
                    for r in self.results
                ]),
                "num_retrieved": np.mean([r.num_retrieved for r in self.results]),
                "num_selected": np.mean([r.num_selected for r in self.results]),
                "avg_retrieval_score": np.mean([r.avg_retrieval_score for r in self.results]),
                "avg_selected_score": np.mean([r.avg_selected_score for r in self.results]),
            },
            "experiments": []
        }
        
        # Group by configuration
        for result in self.results:
            config_key = f"{result.config.retrieval_method}_{result.config.context_selection_method}"
            if config_key not in summary["experiments_by_config"]:
                summary["experiments_by_config"][config_key] = 0
            summary["experiments_by_config"][config_key] += 1
            
            summary["experiments"].append({
                "experiment_name": result.config.experiment_name,
                "query": result.query[:100] + "..." if len(result.query) > 100 else result.query,
                "retrieval_time": result.retrieval_time,
                "selection_time": result.selection_time,
                "generation_time": result.generation_time,
                "total_time": result.retrieval_time + result.selection_time + result.generation_time,
                "num_retrieved": result.num_retrieved,
                "num_selected": result.num_selected,
            })
        
        return summary


def create_baseline_config() -> AblationConfig:
    """Create baseline configuration (current production setup)."""
    return AblationConfig(
        retrieval_method='hybrid',
        vector_weight=0.6,
        keyword_weight=0.4,
        context_selection_method='llm_based',
        top_k_retrieval=20,
        top_k_selection=10,
        use_relevance_filter=False,
        experiment_name="baseline",
        description="Current production configuration: hybrid search (60/40) + LLM-based selection"
    )


def create_ablation_configs() -> List[AblationConfig]:
    """Create a comprehensive list of ablation configurations to test."""
    configs = []
    
    # Baseline
    configs.append(create_baseline_config())
    
    # 1. Retrieval method ablation
    configs.append(AblationConfig(
        retrieval_method='vector_only',
        context_selection_method='llm_based',
        top_k_retrieval=20,
        top_k_selection=10,
        experiment_name="retrieval_vector_only",
        description="Vector-only retrieval (no keyword search)"
    ))
    
    configs.append(AblationConfig(
        retrieval_method='keyword_only',
        context_selection_method='llm_based',
        top_k_retrieval=20,
        top_k_selection=10,
        experiment_name="retrieval_keyword_only",
        description="Keyword-only retrieval (no vector search)"
    ))
    
    # Hybrid weight variations
    for vw, kw in [(0.5, 0.5), (0.7, 0.3), (0.8, 0.2), (0.9, 0.1)]:
        configs.append(AblationConfig(
            retrieval_method='hybrid',
            vector_weight=vw,
            keyword_weight=kw,
            context_selection_method='llm_based',
            top_k_retrieval=20,
            top_k_selection=10,
            experiment_name=f"retrieval_hybrid_{int(vw*100)}_{int(kw*100)}",
            description=f"Hybrid search with {int(vw*100)}% vector, {int(kw*100)}% keyword"
        ))
    
    # 2. Context selection ablation
    configs.append(AblationConfig(
        retrieval_method='hybrid',
        vector_weight=0.6,
        keyword_weight=0.4,
        context_selection_method='score_based',
        top_k_retrieval=20,
        top_k_selection=10,
        experiment_name="selection_score_based",
        description="Score-based selection instead of LLM-based"
    ))
    
    configs.append(AblationConfig(
        retrieval_method='hybrid',
        vector_weight=0.6,
        keyword_weight=0.4,
        context_selection_method='no_selection',
        top_k_retrieval=10,
        top_k_selection=10,
        experiment_name="selection_no_selection",
        description="No selection - use all retrieved contexts"
    ))
    
    # 3. Top-k variations
    for top_k in [5, 15, 20]:
        configs.append(AblationConfig(
            retrieval_method='hybrid',
            vector_weight=0.6,
            keyword_weight=0.4,
            context_selection_method='llm_based',
            top_k_retrieval=20,
            top_k_selection=top_k,
            experiment_name=f"topk_{top_k}",
            description=f"Select top {top_k} contexts instead of 10"
        ))
    
    # 4. Relevance filtering
    configs.append(AblationConfig(
        retrieval_method='hybrid',
        vector_weight=0.6,
        keyword_weight=0.4,
        context_selection_method='llm_based',
        top_k_retrieval=20,
        top_k_selection=10,
        use_relevance_filter=True,
        min_score_threshold=0.3,
        experiment_name="filtering_threshold_0.3",
        description="With relevance filtering (threshold=0.3)"
    ))
    
    configs.append(AblationConfig(
        retrieval_method='hybrid',
        vector_weight=0.6,
        keyword_weight=0.4,
        context_selection_method='llm_based',
        top_k_retrieval=20,
        top_k_selection=10,
        use_relevance_filter=True,
        min_score_threshold=0.5,
        experiment_name="filtering_threshold_0.5",
        description="With relevance filtering (threshold=0.5)"
    ))
    
    return configs

