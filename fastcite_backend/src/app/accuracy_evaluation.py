"""
Accuracy Evaluation Module for RAG Ablation Study

This module provides functions to evaluate the accuracy of RAG system responses
by comparing them against ground truth answers.
"""

import re
from typing import List, Dict, Tuple
import numpy as np

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False

try:
    from nltk.tokenize import word_tokenize
    from nltk.corpus import stopwords
    import nltk
    try:
        nltk.data.find('tokenizers/punkt')
        nltk.data.find('corpora/stopwords')
        HAS_NLTK = True
    except LookupError:
        HAS_NLTK = False
except ImportError:
    HAS_NLTK = False


class AccuracyEvaluator:
    """Evaluates accuracy of RAG responses against ground truth."""
    
    def __init__(self, embedding_model: str = "all-mpnet-base-v2"):
        """Initialize the accuracy evaluator."""
        self.embedding_model = None
        if HAS_SENTENCE_TRANSFORMERS:
            try:
                self.embedding_model = SentenceTransformer(embedding_model)
            except Exception as e:
                print(f"⚠️  Could not load embedding model: {e}")
        
        if not HAS_NLTK:
            print("⚠️  NLTK not available. Some metrics may be less accurate.")
    
    def exact_match(self, predicted: str, ground_truth: str) -> bool:
        """
        Check if predicted answer exactly matches ground truth (case-insensitive).
        
        Args:
            predicted: Generated answer
            ground_truth: Expected answer
            
        Returns:
            True if exact match, False otherwise
        """
        # Normalize: lowercase, strip whitespace
        pred_norm = predicted.lower().strip()
        gt_norm = ground_truth.lower().strip()
        
        return pred_norm == gt_norm
    
    def f1_score(self, predicted: str, ground_truth: str) -> float:
        """
        Calculate F1 score based on token overlap.
        
        Args:
            predicted: Generated answer
            ground_truth: Expected answer
            
        Returns:
            F1 score between 0 and 1
        """
        if not HAS_NLTK:
            # Fallback to simple word splitting
            pred_tokens = set(re.findall(r'\b\w+\b', predicted.lower()))
            gt_tokens = set(re.findall(r'\b\w+\b', ground_truth.lower()))
        else:
            try:
                pred_tokens = set(word_tokenize(predicted.lower()))
                gt_tokens = set(word_tokenize(ground_truth.lower()))
                # Remove stopwords for better matching
                stop_words = set(stopwords.words('english'))
                pred_tokens = pred_tokens - stop_words
                gt_tokens = gt_tokens - stop_words
            except:
                pred_tokens = set(re.findall(r'\b\w+\b', predicted.lower()))
                gt_tokens = set(re.findall(r'\b\w+\b', ground_truth.lower()))
        
        if len(gt_tokens) == 0:
            return 1.0 if len(pred_tokens) == 0 else 0.0
        
        if len(pred_tokens) == 0:
            return 0.0
        
        # Calculate precision and recall
        common_tokens = pred_tokens.intersection(gt_tokens)
        precision = len(common_tokens) / len(pred_tokens) if len(pred_tokens) > 0 else 0.0
        recall = len(common_tokens) / len(gt_tokens) if len(gt_tokens) > 0 else 0.0
        
        # Calculate F1
        if precision + recall == 0:
            return 0.0
        f1 = 2 * (precision * recall) / (precision + recall)
        
        return f1
    
    def semantic_similarity(self, predicted: str, ground_truth: str) -> float:
        """
        Calculate semantic similarity using embeddings.
        
        Args:
            predicted: Generated answer
            ground_truth: Expected answer
            
        Returns:
            Cosine similarity score between 0 and 1
        """
        if self.embedding_model is None:
            # Fallback to F1 score if embeddings not available
            return self.f1_score(predicted, ground_truth)
        
        try:
            # Generate embeddings
            pred_embedding = self.embedding_model.encode(predicted, convert_to_numpy=True, normalize_embeddings=True)
            gt_embedding = self.embedding_model.encode(ground_truth, convert_to_numpy=True, normalize_embeddings=True)
            
            # Calculate cosine similarity
            similarity = np.dot(pred_embedding, gt_embedding)
            return float(similarity)
        except Exception as e:
            print(f"⚠️  Error calculating semantic similarity: {e}")
            return self.f1_score(predicted, ground_truth)
    
    def contains_answer(self, predicted: str, ground_truth: str) -> bool:
        """
        Check if predicted answer contains the ground truth answer (or vice versa).
        
        Args:
            predicted: Generated answer
            ground_truth: Expected answer
            
        Returns:
            True if either contains the other
        """
        pred_lower = predicted.lower()
        gt_lower = ground_truth.lower()
        
        # Check if ground truth is in predicted (for longer answers)
        if len(gt_lower) < len(pred_lower):
            return gt_lower in pred_lower
        # Check if predicted is in ground truth (for shorter answers)
        else:
            return pred_lower in gt_lower
    
    def evaluate(self, predicted: str, ground_truth: str) -> Dict[str, float]:
        """
        Evaluate predicted answer against ground truth using multiple metrics.
        
        Args:
            predicted: Generated answer
            ground_truth: Expected answer
            
        Returns:
            Dictionary with evaluation metrics
        """
        return {
            'exact_match': 1.0 if self.exact_match(predicted, ground_truth) else 0.0,
            'f1_score': self.f1_score(predicted, ground_truth),
            'semantic_similarity': self.semantic_similarity(predicted, ground_truth),
            'contains_answer': 1.0 if self.contains_answer(predicted, ground_truth) else 0.0,
        }
    
    def evaluate_batch(self, predictions: List[str], ground_truths: List[str]) -> Dict[str, float]:
        """
        Evaluate multiple predictions against ground truths.
        
        Args:
            predictions: List of generated answers
            ground_truths: List of expected answers
            
        Returns:
            Dictionary with average evaluation metrics
        """
        if len(predictions) != len(ground_truths):
            raise ValueError("Predictions and ground truths must have the same length")
        
        all_metrics = {
            'exact_match': [],
            'f1_score': [],
            'semantic_similarity': [],
            'contains_answer': [],
        }
        
        for pred, gt in zip(predictions, ground_truths):
            metrics = self.evaluate(pred, gt)
            for key in all_metrics:
                all_metrics[key].append(metrics[key])
        
        # Calculate averages
        return {
            'exact_match': np.mean(all_metrics['exact_match']),
            'f1_score': np.mean(all_metrics['f1_score']),
            'semantic_similarity': np.mean(all_metrics['semantic_similarity']),
            'contains_answer': np.mean(all_metrics['contains_answer']),
            'exact_match_std': np.std(all_metrics['exact_match']),
            'f1_score_std': np.std(all_metrics['f1_score']),
            'semantic_similarity_std': np.std(all_metrics['semantic_similarity']),
            'contains_answer_std': np.std(all_metrics['contains_answer']),
        }


def load_test_dataset(filepath: str) -> List[Dict]:
    """
    Load test dataset with questions and ground truth answers.
    
    Expected format (JSON):
    [
        {
            "question": "What is machine learning?",
            "ground_truth": "Machine learning is a subset of artificial intelligence...",
            "book_id": "optional-book-id"
        },
        ...
    ]
    
    Args:
        filepath: Path to JSON file with test dataset
        
    Returns:
        List of test cases
    """
    import json
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if isinstance(data, list):
        return data
    elif isinstance(data, dict) and 'test_cases' in data:
        return data['test_cases']
    else:
        raise ValueError("Invalid test dataset format. Expected list or dict with 'test_cases' key.")


def create_example_test_dataset(filepath: str):
    """Create an example test dataset file."""
    example_dataset = [
        {
            "question": "What is the main topic of this book?",
            "ground_truth": "The main topic of this book is machine learning and artificial intelligence.",
            "book_id": None
        },
        {
            "question": "Explain the key concepts discussed in chapter 1",
            "ground_truth": "Chapter 1 introduces fundamental concepts including neural networks, backpropagation, and gradient descent.",
            "book_id": None
        },
        {
            "question": "What are the main findings or conclusions?",
            "ground_truth": "The main findings suggest that deep learning models achieve superior performance on complex tasks.",
            "book_id": None
        },
    ]
    
    import json
    from pathlib import Path
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump({"test_cases": example_dataset}, f, indent=2)
    
    print(f"✅ Created example test dataset: {filepath}")
    print(f"   Edit this file to add your own test questions and ground truth answers.")

