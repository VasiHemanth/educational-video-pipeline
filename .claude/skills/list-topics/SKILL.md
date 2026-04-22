---
name: list-topics
description: List all generated videos, coverage stats, and suggest gaps. Helps plan what to generate next.
---

# /list-topics

Show what's been generated and what's missing.

## Usage

```
/list-topics [--domain <domain>]
```

## Steps

1. Query the database:
```bash
sqlite3 prod_tracker.sqlite "SELECT domain, COUNT(*) as count, MIN(question_number) as first, MAX(question_number) as last FROM videos GROUP BY domain ORDER BY count DESC"
```

2. For a specific domain:
```bash
sqlite3 prod_tracker.sqlite "SELECT question_number, topic, created_at FROM videos WHERE domain='{domain}' ORDER BY question_number"
```

3. Check posting status:
```bash
sqlite3 prod_tracker.sqlite "SELECT v.question_number, v.topic, p.platform, p.status FROM videos v LEFT JOIN postings p ON v.id = p.video_id WHERE v.domain='{domain}' ORDER BY v.question_number"
```

4. Suggest next topics based on gaps in coverage for the domain.
