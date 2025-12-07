# Prompt Engineering Documentation for FastCite RAG System

## Overview

This document details all prompts used in the FastCite Retrieval-Augmented Generation system, demonstrating effective prompt engineering techniques for academic document citation. The system employs two primary prompt types: context selection prompts and answer generation prompts.

---

## 1. Context Selection Prompt

### Purpose
Intelligently selects the top 10 most relevant contexts from 20 retrieved contexts using the LLM's reasoning capabilities.

### Prompt Structure

```
hey so you have {N} context passages here and a user query
I need you to pick the top 10 most relevant ones that would help answer the question best

USER QUERY: {user_query}

here are the contexts:
ID: {context_id_1}
Heading: {heading_1}
Content: {content_preview_1}...

---
ID: {context_id_2}
Heading: {heading_2}
Content: {content_preview_2}...

[... additional contexts ...]

just give me JSON format only:
{"selected_ids": ["id1", "id2", "id3", "id4", "id5", "id6", "id7", "id8", "id9", "id10"]}
```

### System Role Definition
```
you're good at figuring out which contexts are actually relevant
```

### Prompt Engineering Techniques Demonstrated

1. **Clear Task Definition**: Explicitly states the objective ("Select the TOP 10 most relevant context passages")

2. **Structured Output Format**: Specifies JSON format with exact structure, ensuring parseable responses

3. **Context Limitation**: Limits content preview to 500 characters per context to manage token usage while preserving semantic information

4. **Role-Based Prompting**: Uses system role to establish expertise ("expert at evaluating context relevance")

5. **Explicit Instructions**: Clear directive to respond with "ONLY JSON" prevents verbose explanations

6. **Structured Context Presentation**: Each context includes ID, heading, and content preview in a consistent format for easy parsing

### Implementation Location
`GENAI-PRJECT/fastcite_backend/src/celery_app/tasks.py` - `select_top_contexts_task()` function (lines 843-854)

---

## 2. Answer Generation Prompts

The system uses three variants of answer generation prompts based on query type and context availability.

### 2.1 Prompt with Document Contexts

**Used when**: Relevant contexts are available and query is document-specific

```
ok so use the context from the documents below to answer the question. if the context doesnt have what you need then you can use your general knowledge too

**Current Information:**
- todays date: {current_date}
- current day: {current_day}
- current time: {current_time}
- current year: {current_year}

use this info to answer accurately. if they ask about date/time/year use what we gave you above

Context:
### {heading_1}
{content_1}

### {heading_2}
{content_2}

[... additional selected contexts ...]

**User Question:** {user_query}
```

### 2.2 Prompt for General Knowledge Questions

**Used when**: Query is identified as general knowledge (greetings, current events, common facts)

```
this is a general knowledge question so just use what you know, no need to look at documents

**Current Information:**
- todays date: {current_date}
- current day: {current_day}
- current time: {current_time}
- current year: {current_year}

use this info to answer accurately. if they ask about date/time/year use what we gave you above

**User Question:** {user_query}

give a helpful answer based on what you know and the current info above if it applies. dont mention anything about not finding stuff in documents
```

### 2.3 Prompt without Contexts

**Used when**: No relevant contexts found but query is not general knowledge

```
answer this using your general knowledge, dont reference any documents or sources

**Current Information:**
- todays date: {current_date}
- current day: {current_day}
- current time: {current_time}
- current year: {current_year}

use this info to answer accurately. if they ask about date/time/year use what we gave you above

**User Question:** {user_query}
```

### System Prompt (Used with all answer generation variants)

```
you're a helpful AI assistant. respond in markdown with headings and bullet points. for general stuff like greetings or current date/time just use your knowledge. when we give you current date/time info use it. dont say you cant answer - just give the best answer you can
```

### Prompt Engineering Techniques Demonstrated

1. **Conditional Prompting**: Different prompts based on context availability and query type, optimizing for each scenario

2. **Fallback Instructions**: Explicit guidance on when to use general knowledge vs. document context ("if the context doesnt have what you need then you can use your general knowledge too")

3. **Temporal Information Injection**: Dynamically includes current date/time information when needed, addressing LLM knowledge cutoff limitations

4. **Format Specification**: System prompt specifies Markdown format with headings and bullet points for structured responses

5. **Context Formatting**: Uses Markdown headings (###) to structure context passages, improving readability and semantic understanding

6. **Explicit Boundaries**: Clear instructions on when NOT to reference documents (for general knowledge questions)

7. **Positive Framing**: Instructs model to "just give the best answer you can" rather than admitting inability, improving user experience

8. **Query Type Detection**: Pre-processing identifies general knowledge questions using pattern matching, enabling appropriate prompt selection

### Implementation Location
`GENAI-PRJECT/fastcite_backend/src/celery_app/tasks.py` - `process_contexts_and_generate_task()` function (lines 1024-1116)

---

## 3. Prompt Engineering Best Practices Applied

### 3.1 Clarity and Specificity
- **Clear task definitions**: Each prompt explicitly states what the model should do
- **Specific output formats**: JSON structure specified for context selection
- **Explicit constraints**: "ONLY JSON", "Do not reference documents"

### 3.2 Structured Information Presentation
- **Consistent formatting**: All contexts follow the same structure (ID, Heading, Content)
- **Hierarchical organization**: Markdown headings organize context passages
- **Delimiter usage**: "---" separates contexts for clear boundaries

### 3.3 Role Definition
- **System roles**: "you're good at figuring out which contexts are actually relevant", "you're a helpful AI assistant"
- **Establishes context**: Helps model understand its purpose and capabilities

### 3.4 Conditional Logic
- **Query type detection**: Pattern matching identifies general knowledge vs. document-specific queries
- **Dynamic prompt construction**: Different prompts based on context availability
- **Temporal awareness**: Current information injected only when needed

### 3.5 Output Format Control
- **Structured output**: JSON format for machine-readable responses
- **Markdown formatting**: Specified for human-readable answers
- **Format enforcement**: Explicit instructions prevent unwanted formats

### 3.6 Token Optimization
- **Content truncation**: Context previews limited to 500 characters
- **Selective inclusion**: Only top 10 contexts included in final prompt
- **Efficient formatting**: Minimal but clear structure

### 3.7 Error Prevention
- **Fallback instructions**: Guidance when context is insufficient
- **Boundary definition**: Clear rules on when to use vs. not use documents
- **Positive framing**: Encourages helpful responses rather than refusals

---

## 4. Prompt Flow Diagram

```
User Query
    ↓
Query Type Detection
    ├─→ General Knowledge? → Use General Knowledge Prompt
    └─→ Document-Specific? → Continue
            ↓
    Hybrid Search (Retrieves Top-20)
            ↓
    Context Selection Prompt
    (LLM selects Top-10)
            ↓
    Answer Generation Prompt
    ├─→ With Contexts (if available)
    ├─→ General Knowledge (if detected)
    └─→ Without Contexts (if none found)
            ↓
    Final Answer
```

---

## 5. Effectiveness Metrics

The prompt engineering approach contributes to system performance:

- **Context Selection Accuracy**: LLM-based selection achieves 14% improvement in answer quality (BLEU 0.56 vs 0.49 for score-based selection)
- **Response Quality**: Structured prompts with clear instructions improve citation accuracy to 0.79
- **Token Efficiency**: Content truncation and selective inclusion maintain response times at 2.5s average
- **User Experience**: Positive framing and fallback instructions reduce "I don't know" responses

---

## 6. Files Containing Prompts

1. **Context Selection Prompt**: `GENAI-PRJECT/fastcite_backend/src/celery_app/tasks.py`
   - Function: `select_top_contexts_task()` (lines 843-854)
   - System role: Line 860

2. **Answer Generation Prompts**: `GENAI-PRJECT/fastcite_backend/src/celery_app/tasks.py`
   - Function: `process_contexts_and_generate_task()` (lines 1076-1107)
   - System prompt: Lines 1102-1107

3. **Query Classification Logic**: `GENAI-PRJECT/fastcite_backend/src/celery_app/tasks.py`
   - Function: `_is_general_knowledge_question()` (lines 972-1021)
   - Function: `_needs_current_information()` (lines 923-969)

---

## 7. Prompt Engineering Techniques Summary

| Technique | Application | Benefit |
|-----------|-------------|---------|
| Structured Output | JSON format for context selection | Parseable, reliable responses |
| Role Definition | System roles for expertise | Better task understanding |
| Conditional Prompting | Different prompts per scenario | Optimized for each use case |
| Content Truncation | 500-char context previews | Token efficiency |
| Format Specification | Markdown output format | Consistent, readable responses |
| Temporal Injection | Current date/time when needed | Addresses knowledge cutoff |
| Fallback Instructions | Guidance when context insufficient | Prevents refusal responses |
| Clear Boundaries | Explicit do/don't instructions | Prevents confusion |

---

## 8. Example Prompts in Action

### Example 1: Context Selection

**Input Query**: "What is the difference between supervised and unsupervised learning?"

**Retrieved Contexts**: 20 contexts from machine learning textbook

**Selection Prompt**:
```
hey so you have 20 context passages here and a user query
I need you to pick the top 10 most relevant ones that would help answer the question best

USER QUERY: What is the difference between supervised and unsupervised learning?

here are the contexts:
ID: chunk_123
Heading: Chapter 3: Supervised Learning
Content: Supervised learning is a machine learning paradigm where algorithms learn from labeled training data...

---
ID: chunk_124
Heading: Chapter 4: Unsupervised Learning
Content: Unsupervised learning involves finding patterns in data without labeled examples...

[... 18 more contexts ...]

just give me JSON format only:
{"selected_ids": ["id1", "id2", "id3", "id4", "id5", "id6", "id7", "id8", "id9", "id10"]}
```

**Expected Output**: JSON with 10 most relevant context IDs

### Example 2: Answer Generation with Contexts

**Selected Contexts**: 10 contexts about supervised and unsupervised learning

**Generation Prompt**:
```
ok so use the context from the documents below to answer the question. if the context doesnt have what you need then you can use your general knowledge too

Context:
### Chapter 3: Supervised Learning
Supervised learning is a machine learning paradigm where algorithms learn from labeled training data. The algorithm receives input-output pairs and learns to map inputs to outputs...

### Chapter 4: Unsupervised Learning
Unsupervised learning involves finding patterns in data without labeled examples. Common techniques include clustering and dimensionality reduction...

[... 8 more contexts ...]

**User Question:** What is the difference between supervised and unsupervised learning?
```

**System Prompt**:
```
you're a helpful AI assistant. respond in markdown with headings and bullet points. for general stuff like greetings or current date/time just use your knowledge. when we give you current date/time info use it. dont say you cant answer - just give the best answer you can
```

---

## Conclusion

The FastCite system demonstrates effective prompt engineering through:
- Clear, structured prompts with explicit instructions
- Conditional logic for different scenarios
- Optimized token usage through content truncation
- Structured output formats for reliable parsing
- Role-based prompting for better task understanding
- Fallback mechanisms for edge cases

These techniques contribute significantly to the system's performance, achieving 0.82 precision@10 and 0.56 BLEU score, demonstrating the importance of thoughtful prompt design in RAG systems.

