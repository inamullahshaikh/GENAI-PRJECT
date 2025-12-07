# Prompt Engineering Submission Guide

## What to Submit

For the **Prompt Engineering and Usage** rubric requirement (10 marks), submit the following files:

### Required Files:

1. **`prompts.txt`** - Raw prompt file containing all prompts used in the system
   - Simple text format with all prompts extracted from code
   - Easy to review and verify
   - Shows exact prompts as they appear in code

2. **`prompt_engineering.md`** - Comprehensive documentation explaining:
   - Purpose of each prompt
   - Prompt engineering techniques used
   - How prompts are structured and why
   - Effectiveness metrics
   - Examples of prompts in action

### Optional (Recommended):

3. **Code references** - The prompts are located in:
   - `GENAI-PRJECT/fastcite_backend/src/celery_app/tasks.py`
   - Lines 843-854: Context selection prompt
   - Lines 1076-1107: Answer generation prompts

---

## How These Files Address the Rubric

### ✅ Submission of prompt file(s) used for model/code generation
- **`prompts.txt`** contains all prompts in raw format
- **`prompt_engineering.md`** includes code references and locations
- All prompts are extracted directly from the codebase

### ✅ Relevance and structure of prompts used
- **`prompt_engineering.md`** Section 1-2: Explains purpose and structure of each prompt
- **`prompt_engineering.md`** Section 3: Details how prompts are structured
- **`prompt_engineering.md`** Section 7: Summary table of techniques and benefits

### ✅ Demonstration of effective prompt engineering techniques
- **`prompt_engineering.md`** Section 3: Lists 8+ prompt engineering techniques
- **`prompt_engineering.md`** Section 5: Best practices applied
- **`prompt_engineering.md`** Section 8: Examples showing techniques in action
- **`prompt_engineering.md`** Section 4: Flow diagram showing prompt selection logic

---

## Key Prompt Engineering Techniques Demonstrated

1. **Structured Output Format** - JSON specification for reliable parsing
2. **Role-Based Prompting** - System roles establish expertise
3. **Conditional Prompting** - Different prompts for different scenarios
4. **Content Optimization** - Token-efficient truncation strategies
5. **Format Specification** - Markdown output for readability
6. **Temporal Information Injection** - Addressing knowledge cutoff limitations
7. **Fallback Instructions** - Handling edge cases gracefully
8. **Clear Boundaries** - Explicit do/don't instructions

---

## Submission Checklist

- [x] `prompts.txt` - All prompts in raw format
- [x] `prompt_engineering.md` - Comprehensive documentation
- [x] Code references included
- [x] Examples provided
- [x] Techniques explained
- [x] Effectiveness metrics included

---

## Quick Reference

**File Locations:**
- Prompts: `research-paper/prompts.txt`
- Documentation: `research-paper/prompt_engineering.md`
- Code: `GENAI-PRJECT/fastcite_backend/src/celery_app/tasks.py`

**Main Prompts:**
1. Context Selection Prompt (selects top 10 from 20)
2. Answer Generation Prompt - With Contexts
3. Answer Generation Prompt - General Knowledge
4. Answer Generation Prompt - Without Contexts
5. System Prompt (used with all answer generation)

---

## Notes for Submission

- Both files are ready to submit as-is
- All prompts are extracted from actual code
- Documentation explains the "why" behind each design choice
- Examples demonstrate real-world usage
- Techniques are clearly labeled and explained

These files comprehensively address all three aspects of the rubric requirement.

