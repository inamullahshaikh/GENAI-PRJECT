# RAG Ablation Study Framework

This framework allows you to systematically test different components of the RAG (Retrieval-Augmented Generation) system to understand their individual contributions to performance.

## Overview

The ablation study tests the following components:

1. **Retrieval Methods**

   - Vector-only search (semantic similarity)
   - Keyword-only search (text matching)
   - Hybrid search with different weight combinations (60/40, 50/50, 70/30, etc.)

2. **Context Selection Strategies**

   - LLM-based selection (current production method)
   - Score-based selection (top-k by similarity score)
   - No selection (use all retrieved contexts)

3. **Number of Contexts**

   - Different top-k values (5, 10, 15, 20)

4. **Relevance Filtering**
   - With/without score threshold filtering (0.3, 0.5)

## Quick Start

### 1. Create Example Queries File

```bash
python -m scripts.run_ablation_study --create_example
```

This creates `ablation_results/example_queries.json`. Edit this file with your test queries.

### 2. Run Ablation Study

**PowerShell (Windows):**

```powershell
# Run all configurations with queries from file
python -m scripts.run_ablation_study --book_id 17ce1800-2079-4429-91e7-f4a01e034aec --queries_file ablation_results/example_queries.json

# Run with a single query
python -m scripts.run_ablation_study --book_id <your_book_id> --query "What is machine learning?"

# Run specific configuration groups
python -m scripts.run_ablation_study --book_id <your_book_id> --queries_file ablation_results/example_queries.json --configs retrieval
```

**Bash/Linux/Mac:**

```bash
# Run all configurations with queries from file
python -m scripts.run_ablation_study \
    --book_id <your_book_id> \
    --queries_file ablation_results/example_queries.json

# Run with a single query
python -m scripts.run_ablation_study \
    --book_id <your_book_id> \
    --query "What is machine learning?"

# Run specific configuration groups
python -m scripts.run_ablation_study \
    --book_id <your_book_id> \
    --queries_file ablation_results/example_queries.json \
    --configs retrieval  # Options: all, baseline, retrieval, selection, topk, filtering
```

### 3. Analyze Results

**PowerShell (Windows):**

```powershell
# Analyze results and print summary tables
python -m scripts.analyze_ablation_results --results_file ablation_results/ablation_results_YYYYMMDD_HHMMSS.json

# Export to CSV for further analysis
python -m scripts.analyze_ablation_results --results_file ablation_results/ablation_results_YYYYMMDD_HHMMSS.json --export_csv ablation_results/results.csv

# Export analysis to JSON
python -m scripts.analyze_ablation_results --results_file ablation_results/ablation_results_YYYYMMDD_HHMMSS.json --export_analysis ablation_results/analysis.json
```

**Bash/Linux/Mac:**
**PowerShell (Windows):**

```powershell
# Analyze results and print summary tables
python -m scripts.analyze_ablation_results --results_file ablation_results/ablation_results_YYYYMMDD_HHMMSS.json

# Export to CSV for further analysis
python -m scripts.analyze_ablation_results --results_file ablation_results/ablation_results_YYYYMMDD_HHMMSS.json --export_csv ablation_results/results.csv

# Export analysis to JSON
python -m scripts.analyze_ablation_results --results_file ablation_results/ablation_results_YYYYMMDD_HHMMSS.json --export_analysis ablation_results/analysis.json
```

**Bash/Linux/Mac:**

```bash
# Analyze results and print summary tables
python -m scripts.analyze_ablation_results \
    --results_file ablation_results/ablation_results_YYYYMMDD_HHMMSS.json

# Export to CSV for further analysis
python -m scripts.analyze_ablation_results \
    --results_file ablation_results/ablation_results_YYYYMMDD_HHMMSS.json \
    --export_csv ablation_results/results.csv

# Export analysis to JSON
python -m scripts.analyze_ablation_results \
    --results_file ablation_results/ablation_results_YYYYMMDD_HHMMSS.json \
    --export_analysis ablation_results/analysis.json
```

## Configuration Options

### Retrieval Methods

- `vector_only`: Pure semantic search using embeddings
- `keyword_only`: Pure keyword matching
- `hybrid`: Combination of both (configurable weights)

### Context Selection

- `llm_based`: Use LLM to intelligently select top contexts (current production)
- `score_based`: Select top-k by similarity score
- `no_selection`: Use all retrieved contexts (up to limit)

### Pre-defined Configuration Groups

- `all`: All configurations (baseline + all ablations)
- `baseline`: Current production configuration
- `retrieval`: Test different retrieval methods
- `selection`: Test different selection strategies
- `topk`: Test different numbers of contexts
- `filtering`: Test relevance filtering

## Results Structure

Results are saved as JSON files with the following structure:

```json
{
  "config": {
    "retrieval_method": "hybrid",
    "vector_weight": 0.6,
    "keyword_weight": 0.4,
    "context_selection_method": "llm_based",
    "top_k_retrieval": 20,
    "top_k_selection": 10,
    "experiment_name": "baseline"
  },
  "query": "What is machine learning?",
  "book_id": "...",
  "retrieved_contexts": [...],
  "selected_contexts": [...],
  "answer": "...",
  "retrieval_time": 0.123,
  "selection_time": 0.456,
  "generation_time": 0.789,
  "num_retrieved": 20,
  "num_selected": 10,
  "avg_retrieval_score": 0.75,
  "avg_selected_score": 0.82
}
```

## Metrics Tracked

- **Retrieval Time**: Time to retrieve contexts from vector store
- **Selection Time**: Time to select top contexts (LLM-based or score-based)
- **Generation Time**: Time to generate answer using LLM
- **Number of Contexts**: Retrieved and selected counts
- **Average Scores**: Average similarity scores for retrieved and selected contexts

## Example Workflow

1. **Prepare Test Queries**

   ```bash
   python -m scripts.run_ablation_study --create_example
   # Edit ablation_results/example_queries.json with your queries
   ```

2. **Run Full Ablation Study**

   ```bash
   python -m scripts.run_ablation_study \
       --book_id "your-book-id-here" \
       --queries_file ablation_results/example_queries.json \
       --configs all
   ```

3. **Analyze Results**

   ```bash
   python -m scripts.analyze_ablation_results \
       --results_file ablation_results/ablation_results_*.json \
       --export_csv ablation_results/results.csv \
       --export_analysis ablation_results/analysis.json
   ```

4. **Compare Configurations**
   - Review the comparison table to see which configurations perform best
   - Check time differences vs. baseline
   - Analyze score distributions

## Custom Configurations

You can create custom configurations by modifying the `create_ablation_configs()` function in `app/ablation_study.py`:

```python
from app.ablation_study import AblationConfig, AblationStudyRunner

custom_config = AblationConfig(
    retrieval_method='hybrid',
    vector_weight=0.8,
    keyword_weight=0.2,
    context_selection_method='score_based',
    top_k_retrieval=15,
    top_k_selection=8,
    experiment_name="custom_config",
    description="Custom configuration for testing"
)
```

## Tips for Effective Ablation Studies

1. **Use Diverse Queries**: Include different types of questions (factual, conceptual, analytical)

2. **Test on Multiple Books**: Run experiments on different books to ensure generalizability

3. **Compare to Baseline**: Always include the baseline configuration for comparison

4. **Monitor Costs**: LLM-based selection uses API calls - consider using `score_based` for large-scale studies

5. **Iterative Testing**: Start with specific component groups (e.g., `--configs retrieval`) before running full study

## Troubleshooting

### Import Errors

Make sure you're running from the correct directory:

```bash
cd fastcite_backend/src
python -m scripts.run_ablation_study ...
```

### Book ID Not Found

Verify the book ID exists in your database and has been processed (status: "complete").

### Rate Limiting

If you hit rate limits, the framework will retry automatically. For large studies, consider:

- Running experiments in batches
- Using `score_based` selection instead of `llm_based` for faster runs
- Adding delays between experiments

## Output Files

- `ablation_results/ablation_results_*.json`: Full experiment results
- `ablation_results/summary_report.json`: Summary statistics
- `ablation_results/results.csv`: CSV export (if using --export_csv)
- `ablation_results/analysis.json`: Detailed analysis (if using --export_analysis)

## Next Steps

After running your ablation study:

1. Review the summary tables to identify best-performing configurations
2. Compare metrics (time, scores, context counts) across configurations
3. Analyze which components have the most impact on performance
4. Use insights to optimize your production RAG pipeline
