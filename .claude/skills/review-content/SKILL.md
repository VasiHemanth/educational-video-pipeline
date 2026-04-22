---
name: review-content
description: Review and validate an existing content JSON file for quality, accuracy, and rendering constraints before video render.
---

# /review-content

Validate a content JSON file before rendering.

## Usage

```
/review-content --number <N>
```

## Checks

Read `output_prod/q{N}_content.json` and verify:

### Word Counts
- Each `spoken_audio`: must be 10-20 words (count every word)
- Each `text`: must be 15-20 words total
- `hook_text`: must be 1-2 sentences, punchy
- `cta_text`: must be short and actionable

### Keywords
- Every keyword in `tech_terms`, `action_verbs`, `concepts` must be an exact word from the corresponding section's `text`
- No keywords that don't appear in `text`

### Diagrams
- Each `dsl` must be valid JSON when parsed
- Each node `label` must be 1-2 words
- Direction must be LR (<=3 nodes) or TB (>3 nodes)
- Node `type` must be: compute, storage, database, messaging, or user
- Edges must reference valid node IDs

### Structure
- Exactly 2-3 answer sections
- Each section has matching diagram (section_id matches)
- All required fields present

### Technical Accuracy
- Web search to verify service names are current (not deprecated)
- Check that architecture patterns make sense
- Verify icon names match real services

### Report
Output a pass/fail checklist and fix any issues found by rewriting the JSON.
