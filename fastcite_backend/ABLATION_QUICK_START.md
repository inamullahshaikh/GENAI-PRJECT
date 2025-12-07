# Ablation Study Quick Start Guide

## Step 1: Get a Book ID

First, you need a book ID from your database. You can find this by:
- Checking your MongoDB `books` collection
- Using the book ID from a book you've uploaded
- The book must have status "complete" (fully processed)

## Step 2: Create Test Queries

**PowerShell:**
```powershell
cd fastcite_backend/src
python -m scripts.run_ablation_study --create_example
```

This creates `ablation_results/example_queries.json`. Edit it with your test queries.

## Step 3: Run a Small Test

Start with just the baseline to make sure everything works:

**PowerShell:**
```powershell
python -m scripts.run_ablation_study --book_id "your-book-id-here" --query "What is the main topic of this book?" --configs baseline
```

## Step 4: Run Full Ablation Study

Once you've verified it works, run the full study:

**PowerShell:**
```powershell
python -m scripts.run_ablation_study --book_id "your-book-id-here" --queries_file ablation_results/example_queries.json --configs all
```

## Step 5: Analyze Results

**PowerShell:**
```powershell
# Find your results file (it will have a timestamp)
python -m scripts.analyze_ablation_results --results_file ablation_results/ablation_results_YYYYMMDD_HHMMSS.json --export_csv ablation_results/results.csv
```

## Example: Testing Different Retrieval Methods

To test only retrieval methods (faster, fewer API calls):

**PowerShell:**
```powershell
python -m scripts.run_ablation_study --book_id "your-book-id-here" --queries_file ablation_results/example_queries.json --configs retrieval
```

## Tips

1. **Start Small**: Test with 1-2 queries first
2. **Use Specific Configs**: Use `--configs retrieval` or `--configs selection` to test specific components
3. **Monitor Costs**: LLM-based selection uses API calls. For large studies, consider using `score_based` selection
4. **Check Results**: Review the summary tables to see which configurations perform best

## Troubleshooting

**Import Errors**: Make sure you're in the `fastcite_backend/src` directory

**Book Not Found**: Verify the book ID exists and has status "complete"

**Rate Limiting**: The framework handles rate limits automatically, but large studies may take time

