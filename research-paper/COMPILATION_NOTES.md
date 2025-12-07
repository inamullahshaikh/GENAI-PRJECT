# LaTeX Compilation Notes

## Fixed Issues
- Replaced `\text{}` with `\mathrm{}` in math mode equations to fix undefined control sequence errors
- All citations and references are properly defined in the bibliography

## Compilation Instructions

LaTeX requires **multiple compilation passes** to resolve all cross-references and citations. Run the following sequence:

```bash
pdflatex main_paper.tex
pdflatex main_paper.tex
pdflatex main_paper.tex
```

Or use `latexmk` which handles multiple passes automatically:

```bash
latexmk -pdf main_paper.tex
```

## Expected Warnings (First Pass Only)

On the first compilation pass, you may see warnings about:
- Undefined citations (e.g., `lewis2020retrieval`, `guu2020retrieval`, etc.)
- Undefined references (e.g., `fig:architecture`, `tab:comparison`, etc.)

These are **normal** and will resolve on subsequent passes as LaTeX builds the reference database.

## Overfull Hbox Warnings

Some "Overfull \hbox" warnings may appear - these are minor formatting issues where text slightly exceeds margins. They don't prevent compilation and can be ignored or fixed by adjusting text manually.

## Figure Files

Ensure the following figure files are in the correct locations:
- `fig1.eps` or `fig1.pdf` in the same directory as `main_paper.tex`
- Ablation study screenshots in `ablationstudy-screenshots/screenshots/` directory

If `fig1.eps` doesn't exist, you can:
1. Create a simple architecture diagram
2. Comment out the figure temporarily
3. Use a placeholder image

## Bibliography

All 22 citations are properly defined in the `\begin{thebibliography}` section. The bibliography uses manual entries (not BibTeX), so no separate `.bib` file is needed.

