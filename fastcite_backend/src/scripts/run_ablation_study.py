"""
Script to run ablation study experiments.

Usage:
    python -m scripts.run_ablation_study --book_id <book_id> --queries_file <path>
    python -m scripts.run_ablation_study --book_id <book_id> --query "What is machine learning?"
"""

import argparse
import json
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Get project root (fastcite_backend directory)
PROJECT_ROOT = Path(__file__).parent.parent.parent

from app.ablation_study import (
    AblationStudyRunner,
    create_baseline_config,
    create_ablation_configs,
    AblationConfig
)
from app.accuracy_evaluation import load_test_dataset, create_example_test_dataset


def resolve_path(filepath: str) -> Path:
    """Resolve file path relative to project root if not absolute."""
    path = Path(filepath)
    if path.is_absolute():
        return path
    # Try relative to current directory first
    if path.exists():
        return path
    # Try relative to project root
    project_path = PROJECT_ROOT / path
    if project_path.exists():
        return project_path
    # Return original path (will raise error if doesn't exist)
    return path


def load_queries_from_file(filepath: str) -> list:
    """Load queries from a JSON file."""
    resolved_path = resolve_path(filepath)
    with open(resolved_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Handle different formats
    if isinstance(data, list):
        # Format: ["query1", "query2", ...]
        return data
    elif isinstance(data, dict) and 'queries' in data:
        # Format: {"queries": ["query1", "query2", ...]}
        return data['queries']
    else:
        raise ValueError("Invalid query file format. Expected list or dict with 'queries' key.")


def create_example_queries_file(filepath: str):
    """Create an example queries file."""
    example_queries = [
        "What is the main topic of this book?",
        "Explain the key concepts discussed in chapter 1",
        "What are the main findings or conclusions?",
        "How does the author approach the subject matter?",
        "What are the practical applications mentioned?",
    ]
    
    # Resolve path - if relative, make it relative to project root
    path = Path(filepath)
    if path.is_absolute():
        resolved_path = path
    else:
        # Try relative to project root
        resolved_path = PROJECT_ROOT / path
    
    # Create parent directory if it doesn't exist
    resolved_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(resolved_path, 'w', encoding='utf-8') as f:
        json.dump({"queries": example_queries}, f, indent=2)
    
    print(f"✅ Created example queries file: {resolved_path}")
    print(f"   Edit this file to add your own test queries.")


def main():
    parser = argparse.ArgumentParser(
        description="Run ablation study experiments on RAG system"
    )
    parser.add_argument(
        '--book_id',
        type=str,
        required=False,
        help='Book ID to run experiments on (required when running experiments)'
    )
    parser.add_argument(
        '--queries_file',
        type=str,
        help='Path to JSON file containing test queries'
    )
    parser.add_argument(
        '--query',
        type=str,
        help='Single query to test (alternative to queries_file)'
    )
    parser.add_argument(
        '--configs',
        type=str,
        choices=['all', 'baseline', 'retrieval', 'selection', 'topk', 'filtering'],
        default='all',
        help='Which configurations to test (default: all)'
    )
    parser.add_argument(
        '--output_dir',
        type=str,
        default='ablation_results',
        help='Directory to save results (default: ablation_results)'
    )
    parser.add_argument(
        '--create_example',
        action='store_true',
        help='Create an example queries file and exit'
    )
    parser.add_argument(
        '--test_dataset',
        type=str,
        help='Path to JSON file with test dataset (questions + ground truth answers) for accuracy evaluation'
    )
    parser.add_argument(
        '--create_test_dataset',
        action='store_true',
        help='Create an example test dataset file and exit'
    )
    parser.add_argument(
        '--evaluate_accuracy',
        action='store_true',
        help='Enable accuracy evaluation (requires test_dataset)'
    )
    
    args = parser.parse_args()
    
    # Create example file if requested
    if args.create_example:
        # Default to project root if relative path
        if not Path(args.output_dir).is_absolute():
            output_dir = PROJECT_ROOT / args.output_dir
        else:
            output_dir = Path(args.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        example_path = output_dir / "example_queries.json"
        create_example_queries_file(str(example_path))
        return
    
    # Create test dataset example if requested
    if args.create_test_dataset:
        if not Path(args.output_dir).is_absolute():
            output_dir = PROJECT_ROOT / args.output_dir
        else:
            output_dir = Path(args.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        test_dataset_path = output_dir / "example_test_dataset.json"
        create_example_test_dataset(str(test_dataset_path))
        return
    
    # Validate book_id is provided when running experiments
    if not args.book_id:
        print("❌ Error: --book_id is required when running experiments")
        print("   (Not needed for --create_example or --create_test_dataset)")
        parser.print_help()
        return
    
    # Get queries and ground truth (if accuracy evaluation is enabled)
    test_dataset = None
    queries = []
    ground_truth_map = {}
    
    if args.evaluate_accuracy and args.test_dataset:
        # Load test dataset with ground truth
        test_dataset = load_test_dataset(resolve_path(args.test_dataset))
        queries = [tc['question'] for tc in test_dataset]
        ground_truth_map = {tc['question']: tc.get('ground_truth', '') for tc in test_dataset}
        print(f"✅ Loaded test dataset with {len(queries)} questions and ground truth answers")
    elif args.query:
        queries = [args.query]
    elif args.queries_file:
        queries = load_queries_from_file(resolve_path(args.queries_file))
    else:
        print("❌ Error: Must provide either --query, --queries_file, or --test_dataset (with --evaluate_accuracy)")
        parser.print_help()
        return
    
    if args.evaluate_accuracy and not args.test_dataset:
        print("⚠️  Warning: --evaluate_accuracy specified but no --test_dataset provided. Accuracy evaluation disabled.")
        args.evaluate_accuracy = False
    
    # Get configurations
    if args.configs == 'all':
        configs = create_ablation_configs()
    elif args.configs == 'baseline':
        configs = [create_baseline_config()]
    elif args.configs == 'retrieval':
        configs = [
            create_baseline_config(),
            AblationConfig(
                retrieval_method='vector_only',
                context_selection_method='llm_based',
                top_k_retrieval=20,
                top_k_selection=10,
                experiment_name="retrieval_vector_only",
                description="Vector-only retrieval"
            ),
            AblationConfig(
                retrieval_method='keyword_only',
                context_selection_method='llm_based',
                top_k_retrieval=20,
                top_k_selection=10,
                experiment_name="retrieval_keyword_only",
                description="Keyword-only retrieval"
            ),
        ]
    elif args.configs == 'selection':
        configs = [
            create_baseline_config(),
            AblationConfig(
                retrieval_method='hybrid',
                vector_weight=0.6,
                keyword_weight=0.4,
                context_selection_method='score_based',
                top_k_retrieval=20,
                top_k_selection=10,
                experiment_name="selection_score_based",
                description="Score-based selection"
            ),
            AblationConfig(
                retrieval_method='hybrid',
                vector_weight=0.6,
                keyword_weight=0.4,
                context_selection_method='no_selection',
                top_k_retrieval=10,
                top_k_selection=10,
                experiment_name="selection_no_selection",
                description="No selection"
            ),
        ]
    elif args.configs == 'topk':
        configs = [
            AblationConfig(
                retrieval_method='hybrid',
                vector_weight=0.6,
                keyword_weight=0.4,
                context_selection_method='llm_based',
                top_k_retrieval=20,
                top_k_selection=k,
                experiment_name=f"topk_{k}",
                description=f"Top-{k} contexts"
            )
            for k in [5, 10, 15, 20]
        ]
    elif args.configs == 'filtering':
        configs = [
            create_baseline_config(),
            AblationConfig(
                retrieval_method='hybrid',
                vector_weight=0.6,
                keyword_weight=0.4,
                context_selection_method='llm_based',
                top_k_retrieval=20,
                top_k_selection=10,
                use_relevance_filter=True,
                min_score_threshold=0.3,
                experiment_name="filtering_threshold_0.3",
                description="With filtering (0.3)"
            ),
            AblationConfig(
                retrieval_method='hybrid',
                vector_weight=0.6,
                keyword_weight=0.4,
                context_selection_method='llm_based',
                top_k_retrieval=20,
                top_k_selection=10,
                use_relevance_filter=True,
                min_score_threshold=0.5,
                experiment_name="filtering_threshold_0.5",
                description="With filtering (0.5)"
            ),
        ]
    else:
        configs = create_ablation_configs()
    
    # Resolve output directory path
    if not Path(args.output_dir).is_absolute():
        output_dir = PROJECT_ROOT / args.output_dir
    else:
        output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Initialize runner
    runner = AblationStudyRunner(
        results_dir=str(output_dir),
        evaluate_accuracy=args.evaluate_accuracy
    )
    
    print(f"\n{'='*80}")
    print(f"Ablation Study Runner")
    print(f"{'='*80}")
    print(f"Book ID: {args.book_id}")
    print(f"Number of queries: {len(queries)}")
    print(f"Number of configurations: {len(configs)}")
    print(f"Total experiments: {len(queries) * len(configs)}")
    print(f"{'='*80}\n")
    
    # Run experiments
    total_experiments = len(queries) * len(configs)
    current_experiment = 0
    
    for query_idx, query in enumerate(queries, 1):
        print(f"\n{'#'*80}")
        print(f"Query {query_idx}/{len(queries)}: {query[:80]}...")
        print(f"{'#'*80}")
        
        for config_idx, config in enumerate(configs, 1):
            current_experiment += 1
            print(f"\n[{current_experiment}/{total_experiments}] {config.experiment_name}")
            
            try:
                ground_truth = ground_truth_map.get(query) if args.evaluate_accuracy else None
                result = runner.run_experiment(config, query, args.book_id, ground_truth=ground_truth)
                print(f"✅ Completed: {result.num_retrieved} retrieved, {result.num_selected} selected")
                print(f"   Times: retrieval={result.retrieval_time:.2f}s, "
                      f"selection={result.selection_time:.2f}s, "
                      f"generation={result.generation_time:.2f}s")
                if args.evaluate_accuracy and result.f1_score is not None:
                    print(f"   Accuracy: F1={result.f1_score:.3f}, "
                          f"Semantic={result.semantic_similarity:.3f}, "
                          f"Exact Match={result.exact_match:.0%}")
            except Exception as e:
                print(f"❌ Error: {e}")
                import traceback
                traceback.print_exc()
    
    # Save results
    print(f"\n{'='*80}")
    print("Saving results...")
    results_file = runner.save_results()
    
    # Generate summary
    print("\nGenerating summary report...")
    summary = runner.generate_summary_report()
    
    # Use the resolved output_dir path
    summary_file = output_dir / "summary_report.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Summary saved to: {summary_file}")
    
    # Print summary statistics
    print(f"\n{'='*80}")
    print("Summary Statistics")
    print(f"{'='*80}")
    print(f"Total experiments: {summary['total_experiments']}")
    print(f"Average retrieval time: {summary['average_metrics']['retrieval_time']:.3f}s")
    print(f"Average selection time: {summary['average_metrics']['selection_time']:.3f}s")
    print(f"Average generation time: {summary['average_metrics']['generation_time']:.3f}s")
    print(f"Average total time: {summary['average_metrics']['total_time']:.3f}s")
    print(f"Average contexts retrieved: {summary['average_metrics']['num_retrieved']:.1f}")
    print(f"Average contexts selected: {summary['average_metrics']['num_selected']:.1f}")
    print(f"{'='*80}\n")
    
    print(f"✅ Ablation study complete!")
    print(f"   Results: {results_file}")
    print(f"   Summary: {summary_file}")


if __name__ == "__main__":
    main()

