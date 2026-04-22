---
name: research-topic
description: Research a cloud/tech topic using web search before generating video content. Returns latest service info, deprecations, and architecture patterns.
---

# /research-topic

Research a topic and generate a structured brief before video generation.

## Usage

```
/research-topic <topic> --domain <domain>
/research-topic --domain GCP          # auto-pick topic from coverage gaps
```

## Steps

1. **Run the research script** to check DB coverage and get topic suggestions:
   ```bash
   node scripts/research.js --domain {domain}
   ```
   This writes `output_prod/q{N}_research.json` with covered topics, suggestions, and next steps.

2. **Read the brief**:
   ```bash
   cat output_prod/q{N}_research.json
   ```

3. **Web search** the chosen topic to verify:
   - Latest service names and versions (avoid deprecated)
   - Current pricing model and limits
   - Recent announcements (2024-2025)
   - Common architecture patterns

4. **Read the domain reference file** listed in the brief:
   ```bash
   cat domains/{domain-slug}.md
   ```

5. **Report findings** to inform content generation:
   - Key facts and constraints
   - Services/features to highlight
   - Things to avoid (deprecated, renamed)
   - The angle that makes this video unique

Then proceed with `/generate-video` using the brief's `suggested_question_number`.
