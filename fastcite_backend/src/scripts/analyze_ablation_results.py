"""
Script to analyze and visualize ablation study results.

Usage:
    python -m scripts.analyze_ablation_results --results_file <path>
"""

import argparse
import json
import sys
import glob
from pathlib import Path
from collections import defaultdict
from typing import Dict, List
import statistics

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    print("⚠️  pandas not installed. Install with: pip install pandas")

try:
    import matplotlib.pyplot as plt
    import matplotlib
    matplotlib.use('Agg')  # Use non-interactive backend
    import seaborn as sns
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False
    print("⚠️  matplotlib/seaborn not installed. Install with: pip install matplotlib seaborn")


def load_results(filepath: str) -> List[Dict]:
    """Load results from JSON file(s). Supports glob patterns."""
    # Handle glob patterns
    if '*' in filepath or '?' in filepath:
        # Find matching files
        matching_files = glob.glob(filepath)
        if not matching_files:
            raise FileNotFoundError(f"No files found matching pattern: {filepath}")
        if len(matching_files) > 1:
            # Sort by modification time, get most recent
            matching_files.sort(key=lambda x: Path(x).stat().st_mtime, reverse=True)
            print(f"⚠️  Multiple files match pattern. Using most recent: {matching_files[0]}")
        filepath = matching_files[0]
    
    # Resolve path
    path = Path(filepath)
    if not path.is_absolute():
        # Try relative to current directory first
        if not path.exists():
            # Try relative to project root
            project_root = Path(__file__).parent.parent.parent
            path = project_root / path
            if not path.exists():
                raise FileNotFoundError(f"Results file not found: {filepath}")
    
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def analyze_by_config(results: List[Dict]) -> Dict:
    """Analyze results grouped by configuration."""
    by_config = defaultdict(list)
    
    for result in results:
        config = result['config']
        config_key = f"{config['retrieval_method']}_{config['context_selection_method']}"
        by_config[config_key].append(result)
    
    analysis = {}
    for config_key, config_results in by_config.items():
        analysis[config_key] = {
            'count': len(config_results),
            'avg_retrieval_time': statistics.mean([r['retrieval_time'] for r in config_results]),
            'avg_selection_time': statistics.mean([r['selection_time'] for r in config_results]),
            'avg_generation_time': statistics.mean([r['generation_time'] for r in config_results]),
            'avg_total_time': statistics.mean([
                r['retrieval_time'] + r['selection_time'] + r['generation_time']
                for r in config_results
            ]),
            'avg_num_retrieved': statistics.mean([r['num_retrieved'] for r in config_results]),
            'avg_num_selected': statistics.mean([r['num_selected'] for r in config_results]),
            'avg_retrieval_score': statistics.mean([r['avg_retrieval_score'] for r in config_results]),
            'avg_selected_score': statistics.mean([r['avg_selected_score'] for r in config_results]),
        }
    
    return analysis


def compare_to_baseline(results: List[Dict]) -> Dict:
    """Compare all configurations to baseline."""
    # Find baseline
    baseline = None
    for result in results:
        if result['config']['experiment_name'] == 'baseline':
            baseline = result
            break
    
    if not baseline:
        print("⚠️  No baseline found in results")
        return {}
    
    baseline_metrics = {
        'retrieval_time': baseline['retrieval_time'],
        'selection_time': baseline['selection_time'],
        'generation_time': baseline['generation_time'],
        'total_time': baseline['retrieval_time'] + baseline['selection_time'] + baseline['generation_time'],
        'num_retrieved': baseline['num_retrieved'],
        'num_selected': baseline['num_selected'],
    }
    
    comparisons = {}
    for result in results:
        exp_name = result['config']['experiment_name']
        if exp_name == 'baseline':
            continue
        
        total_time = result['retrieval_time'] + result['selection_time'] + result['generation_time']
        
        comparisons[exp_name] = {
            'retrieval_time_diff': result['retrieval_time'] - baseline_metrics['retrieval_time'],
            'selection_time_diff': result['selection_time'] - baseline_metrics['selection_time'],
            'generation_time_diff': result['generation_time'] - baseline_metrics['generation_time'],
            'total_time_diff': total_time - baseline_metrics['total_time'],
            'total_time_pct_change': ((total_time - baseline_metrics['total_time']) / baseline_metrics['total_time']) * 100,
            'num_retrieved_diff': result['num_retrieved'] - baseline_metrics['num_retrieved'],
            'num_selected_diff': result['num_selected'] - baseline_metrics['num_selected'],
        }
    
    return comparisons


def print_analysis_table(analysis: Dict):
    """Print analysis as a formatted table."""
    print("\n" + "="*100)
    print("Analysis by Configuration")
    print("="*100)
    print(f"{'Configuration':<40} {'Count':<8} {'Retrieval':<12} {'Selection':<12} {'Generation':<12} {'Total':<12}")
    print("-"*100)
    
    for config_key, metrics in sorted(analysis.items()):
        print(f"{config_key:<40} {metrics['count']:<8} "
              f"{metrics['avg_retrieval_time']:<12.3f} "
              f"{metrics['avg_selection_time']:<12.3f} "
              f"{metrics['avg_generation_time']:<12.3f} "
              f"{metrics['avg_total_time']:<12.3f}")
    
    print("="*100)


def print_comparison_table(comparisons: Dict):
    """Print comparison to baseline as a formatted table."""
    print("\n" + "="*100)
    print("Comparison to Baseline")
    print("="*100)
    print(f"{'Experiment':<40} {'Total Time Δ':<15} {'Total Time %':<15} {'Retrieved Δ':<15} {'Selected Δ':<15}")
    print("-"*100)
    
    for exp_name, comp in sorted(comparisons.items()):
        print(f"{exp_name:<40} "
              f"{comp['total_time_diff']:+.3f}s{'':<8} "
              f"{comp['total_time_pct_change']:+.1f}%{'':<8} "
              f"{comp['num_retrieved_diff']:+.1f}{'':<8} "
              f"{comp['num_selected_diff']:+.1f}")
    
    print("="*100)


def export_to_csv(results: List[Dict], output_file: str):
    """Export results to CSV file."""
    if not HAS_PANDAS:
        print("⚠️  pandas not available, skipping CSV export")
        return
    
    # Flatten results
    rows = []
    for result in results:
        config = result['config']
        row = {
            'experiment_name': config['experiment_name'],
            'query': result['query'],
            'book_id': result['book_id'],
            'retrieval_method': config['retrieval_method'],
            'vector_weight': config.get('vector_weight', 0),
            'keyword_weight': config.get('keyword_weight', 0),
            'context_selection_method': config['context_selection_method'],
            'top_k_retrieval': config['top_k_retrieval'],
            'top_k_selection': config['top_k_selection'],
            'retrieval_time': result['retrieval_time'],
            'selection_time': result['selection_time'],
            'generation_time': result['generation_time'],
            'total_time': result['retrieval_time'] + result['selection_time'] + result['generation_time'],
            'num_retrieved': result['num_retrieved'],
            'num_selected': result['num_selected'],
            'avg_retrieval_score': result['avg_retrieval_score'],
            'avg_selected_score': result['avg_selected_score'],
            'exact_match': result.get('exact_match'),
            'f1_score': result.get('f1_score'),
            'semantic_similarity': result.get('semantic_similarity'),
            'contains_answer': result.get('contains_answer'),
        }
        rows.append(row)
    
    df = pd.DataFrame(rows)
    
    # Check if accuracy metrics are available
    has_accuracy = df['f1_score'].notna().any()
    df.to_csv(output_file, index=False)
    print(f"✅ Exported to CSV: {output_file}")


def generate_visualizations(results: List[Dict], output_dir: str):
    """Generate visualization charts and save to screenshots folder."""
    if not HAS_MATPLOTLIB or not HAS_PANDAS:
        print("⚠️  Skipping visualizations (matplotlib/seaborn or pandas not available)")
        return
    
    screenshots_dir = Path(output_dir) / "screenshots"
    screenshots_dir.mkdir(parents=True, exist_ok=True)
    
    # Convert to DataFrame
    rows = []
    for result in results:
        config = result['config']
        rows.append({
            'experiment_name': config['experiment_name'],
            'retrieval_method': config['retrieval_method'],
            'context_selection_method': config['context_selection_method'],
            'vector_weight': config.get('vector_weight', 0),
            'keyword_weight': config.get('keyword_weight', 0),
            'top_k_selection': config['top_k_selection'],
            'retrieval_time': result['retrieval_time'],
            'selection_time': result['selection_time'],
            'generation_time': result['generation_time'],
            'total_time': result['retrieval_time'] + result['selection_time'] + result['generation_time'],
            'num_retrieved': result['num_retrieved'],
            'num_selected': result['num_selected'],
            'avg_retrieval_score': result['avg_retrieval_score'],
            'avg_selected_score': result['avg_selected_score'],
            'exact_match': result.get('exact_match'),
            'f1_score': result.get('f1_score'),
            'semantic_similarity': result.get('semantic_similarity'),
            'contains_answer': result.get('contains_answer'),
        })
    
    df = pd.DataFrame(rows)
    
    # Check if accuracy metrics are available
    has_accuracy = df['f1_score'].notna().any()
    
    # Set style
    sns.set_style("whitegrid")
    plt.rcParams['figure.figsize'] = (12, 6)
    
    # 1. Total Time by Configuration
    plt.figure(figsize=(14, 8))
    config_times = df.groupby('experiment_name')['total_time'].mean().sort_values()
    plt.barh(range(len(config_times)), config_times.values)
    plt.yticks(range(len(config_times)), config_times.index, fontsize=8)
    plt.xlabel('Average Total Time (seconds)', fontsize=12)
    plt.title('Average Total Time by Configuration', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(screenshots_dir / '1_total_time_by_config.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    # 2. Time Breakdown (Retrieval, Selection, Generation)
    plt.figure(figsize=(14, 8))
    time_breakdown = df.groupby('experiment_name').agg({
        'retrieval_time': 'mean',
        'selection_time': 'mean',
        'generation_time': 'mean'
    }).sort_values('retrieval_time')
    
    x = range(len(time_breakdown))
    width = 0.25
    plt.bar([i - width for i in x], time_breakdown['retrieval_time'], width, label='Retrieval', alpha=0.8)
    plt.bar(x, time_breakdown['selection_time'], width, label='Selection', alpha=0.8)
    plt.bar([i + width for i in x], time_breakdown['generation_time'], width, label='Generation', alpha=0.8)
    
    plt.xlabel('Configuration', fontsize=12)
    plt.ylabel('Time (seconds)', fontsize=12)
    plt.title('Time Breakdown by Component', fontsize=14, fontweight='bold')
    plt.xticks(x, time_breakdown.index, rotation=45, ha='right', fontsize=8)
    plt.legend()
    plt.tight_layout()
    plt.savefig(screenshots_dir / '2_time_breakdown.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    # 3. Retrieval Method Comparison
    plt.figure(figsize=(12, 6))
    retrieval_comparison = df.groupby('retrieval_method')['total_time'].mean()
    colors = sns.color_palette("husl", len(retrieval_comparison))
    plt.bar(retrieval_comparison.index, retrieval_comparison.values, color=colors, alpha=0.8)
    plt.xlabel('Retrieval Method', fontsize=12)
    plt.ylabel('Average Total Time (seconds)', fontsize=12)
    plt.title('Performance by Retrieval Method', fontsize=14, fontweight='bold')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(screenshots_dir / '3_retrieval_method_comparison.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    # 4. Context Selection Method Comparison
    plt.figure(figsize=(12, 6))
    selection_comparison = df.groupby('context_selection_method')['total_time'].mean()
    colors = sns.color_palette("Set2", len(selection_comparison))
    plt.bar(selection_comparison.index, selection_comparison.values, color=colors, alpha=0.8)
    plt.xlabel('Context Selection Method', fontsize=12)
    plt.ylabel('Average Total Time (seconds)', fontsize=12)
    plt.title('Performance by Context Selection Method', fontsize=14, fontweight='bold')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(screenshots_dir / '4_selection_method_comparison.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    # 5. Number of Contexts Retrieved vs Selected
    plt.figure(figsize=(12, 6))
    context_stats = df.groupby('experiment_name').agg({
        'num_retrieved': 'mean',
        'num_selected': 'mean'
    }).sort_values('num_retrieved')
    
    x = range(len(context_stats))
    width = 0.35
    plt.bar([i - width/2 for i in x], context_stats['num_retrieved'], width, label='Retrieved', alpha=0.8)
    plt.bar([i + width/2 for i in x], context_stats['num_selected'], width, label='Selected', alpha=0.8)
    
    plt.xlabel('Configuration', fontsize=12)
    plt.ylabel('Number of Contexts', fontsize=12)
    plt.title('Average Contexts Retrieved vs Selected', fontsize=14, fontweight='bold')
    plt.xticks(x, context_stats.index, rotation=45, ha='right', fontsize=8)
    plt.legend()
    plt.tight_layout()
    plt.savefig(screenshots_dir / '5_contexts_retrieved_vs_selected.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    # 6. Score Distribution
    plt.figure(figsize=(12, 6))
    plt.hist(df['avg_retrieval_score'].dropna(), bins=20, alpha=0.7, label='Retrieval Score', edgecolor='black')
    plt.hist(df['avg_selected_score'].dropna(), bins=20, alpha=0.7, label='Selected Score', edgecolor='black')
    plt.xlabel('Average Score', fontsize=12)
    plt.ylabel('Frequency', fontsize=12)
    plt.title('Score Distribution', fontsize=14, fontweight='bold')
    plt.legend()
    plt.tight_layout()
    plt.savefig(screenshots_dir / '6_score_distribution.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    # 7. Top-K Selection Impact
    if 'topk' in df['experiment_name'].values or any('topk' in name for name in df['experiment_name']):
        plt.figure(figsize=(12, 6))
        topk_data = df[df['experiment_name'].str.contains('topk', case=False, na=False)]
        if len(topk_data) > 0:
            topk_comparison = topk_data.groupby('top_k_selection')['total_time'].mean()
            plt.plot(topk_comparison.index, topk_comparison.values, marker='o', linewidth=2, markersize=8)
            plt.xlabel('Top-K Selection', fontsize=12)
            plt.ylabel('Average Total Time (seconds)', fontsize=12)
            plt.title('Impact of Top-K Selection on Performance', fontsize=14, fontweight='bold')
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            plt.savefig(screenshots_dir / '7_topk_impact.png', dpi=300, bbox_inches='tight')
            plt.close()
    
    # 8. Hybrid Weight Comparison (if applicable)
    hybrid_data = df[df['retrieval_method'] == 'hybrid']
    if len(hybrid_data) > 0:
        plt.figure(figsize=(12, 6))
        hybrid_data['weight_label'] = hybrid_data.apply(
            lambda x: f"{int(x['vector_weight']*100)}/{int(x['keyword_weight']*100)}", axis=1
        )
        weight_comparison = hybrid_data.groupby('weight_label')['total_time'].mean().sort_index()
        plt.bar(weight_comparison.index, weight_comparison.values, alpha=0.8, color=sns.color_palette("viridis", len(weight_comparison)))
        plt.xlabel('Vector/Keyword Weight Ratio', fontsize=12)
        plt.ylabel('Average Total Time (seconds)', fontsize=12)
        plt.title('Hybrid Search Weight Comparison', fontsize=14, fontweight='bold')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.savefig(screenshots_dir / '8_hybrid_weight_comparison.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    # Accuracy visualizations (if available)
    if has_accuracy:
        # 9. Accuracy Metrics by Configuration
        plt.figure(figsize=(14, 8))
        accuracy_by_config = df.groupby('experiment_name').agg({
            'f1_score': 'mean',
            'semantic_similarity': 'mean',
            'exact_match': 'mean'
        }).sort_values('f1_score', ascending=False)
        
        x = range(len(accuracy_by_config))
        width = 0.25
        plt.bar([i - width for i in x], accuracy_by_config['f1_score'], width, label='F1 Score', alpha=0.8)
        plt.bar(x, accuracy_by_config['semantic_similarity'], width, label='Semantic Similarity', alpha=0.8)
        plt.bar([i + width for i in x], accuracy_by_config['exact_match'], width, label='Exact Match', alpha=0.8)
        
        plt.xlabel('Configuration', fontsize=12)
        plt.ylabel('Score', fontsize=12)
        plt.title('Accuracy Metrics by Configuration', fontsize=14, fontweight='bold')
        plt.xticks(x, accuracy_by_config.index, rotation=45, ha='right', fontsize=8)
        plt.legend()
        plt.ylim(0, 1)
        plt.tight_layout()
        plt.savefig(screenshots_dir / '9_accuracy_by_config.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        # 10. Retrieval Method Accuracy Comparison
        plt.figure(figsize=(12, 6))
        retrieval_accuracy = df.groupby('retrieval_method').agg({
            'f1_score': 'mean',
            'semantic_similarity': 'mean'
        })
        x = range(len(retrieval_accuracy))
        width = 0.35
        plt.bar([i - width/2 for i in x], retrieval_accuracy['f1_score'], width, label='F1 Score', alpha=0.8)
        plt.bar([i + width/2 for i in x], retrieval_accuracy['semantic_similarity'], width, label='Semantic Similarity', alpha=0.8)
        plt.xlabel('Retrieval Method', fontsize=12)
        plt.ylabel('Score', fontsize=12)
        plt.title('Accuracy by Retrieval Method', fontsize=14, fontweight='bold')
        plt.xticks(x, retrieval_accuracy.index, rotation=45, ha='right')
        plt.legend()
        plt.ylim(0, 1)
        plt.tight_layout()
        plt.savefig(screenshots_dir / '10_retrieval_method_accuracy.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        # 11. Context Selection Method Accuracy Comparison
        plt.figure(figsize=(12, 6))
        selection_accuracy = df.groupby('context_selection_method').agg({
            'f1_score': 'mean',
            'semantic_similarity': 'mean'
        })
        x = range(len(selection_accuracy))
        width = 0.35
        plt.bar([i - width/2 for i in x], selection_accuracy['f1_score'], width, label='F1 Score', alpha=0.8)
        plt.bar([i + width/2 for i in x], selection_accuracy['semantic_similarity'], width, label='Semantic Similarity', alpha=0.8)
        plt.xlabel('Context Selection Method', fontsize=12)
        plt.ylabel('Score', fontsize=12)
        plt.title('Accuracy by Context Selection Method', fontsize=14, fontweight='bold')
        plt.xticks(x, selection_accuracy.index, rotation=45, ha='right')
        plt.legend()
        plt.ylim(0, 1)
        plt.tight_layout()
        plt.savefig(screenshots_dir / '11_selection_method_accuracy.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        # 12. Accuracy vs Speed Trade-off
        plt.figure(figsize=(12, 8))
        config_performance = df.groupby('experiment_name').agg({
            'f1_score': 'mean',
            'total_time': 'mean'
        })
        plt.scatter(config_performance['total_time'], config_performance['f1_score'], s=100, alpha=0.6)
        for idx, row in config_performance.iterrows():
            plt.annotate(idx, (row['total_time'], row['f1_score']), fontsize=7, alpha=0.7)
        plt.xlabel('Average Total Time (seconds)', fontsize=12)
        plt.ylabel('Average F1 Score', fontsize=12)
        plt.title('Accuracy vs Speed Trade-off', fontsize=14, fontweight='bold')
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(screenshots_dir / '12_accuracy_vs_speed.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    print(f"✅ Generated {len(list(screenshots_dir.glob('*.png')))} visualization charts")
    print(f"   Saved to: {screenshots_dir}")


def main():
    parser = argparse.ArgumentParser(
        description="Analyze ablation study results"
    )
    parser.add_argument(
        '--results_file',
        type=str,
        required=True,
        help='Path to results JSON file'
    )
    parser.add_argument(
        '--export_csv',
        type=str,
        help='Export results to CSV file'
    )
    parser.add_argument(
        '--export_analysis',
        type=str,
        help='Export analysis to JSON file'
    )
    parser.add_argument(
        '--generate_visuals',
        action='store_true',
        help='Generate visualization charts and save to screenshots folder'
    )
    
    args = parser.parse_args()
    
    # Load results
    print(f"Loading results from: {args.results_file}")
    results = load_results(args.results_file)
    print(f"✅ Loaded {len(results)} experiment results")
    
    # Analyze
    print("\nAnalyzing results...")
    analysis = analyze_by_config(results)
    comparisons = compare_to_baseline(results)
    
    # Print tables
    print_analysis_table(analysis)
    print_comparison_table(comparisons)
    
    # Export if requested
    if args.export_csv:
        export_to_csv(results, args.export_csv)
    
    if args.export_analysis:
        analysis_data = {
            'by_config': analysis,
            'comparisons': comparisons
        }
        with open(args.export_analysis, 'w', encoding='utf-8') as f:
            json.dump(analysis_data, f, indent=2, ensure_ascii=False)
        print(f"✅ Analysis exported to: {args.export_analysis}")
    
    # Generate visualizations if requested
    if args.generate_visuals:
        results_file_path = Path(args.results_file)
        output_dir = results_file_path.parent
        generate_visualizations(results, str(output_dir))


if __name__ == "__main__":
    main()

