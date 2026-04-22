---
name: batch-generate
description: Generate multiple videos in sequence for a domain. Auto-picks topics, checks DB for coverage gaps, and renders each one.
---

# /batch-generate

Generate a batch of videos for a domain.

## Usage

```
/batch-generate --domain <domain> --count <N> [--start-number <N>] [--voice]
```

Examples:
```
/batch-generate --domain GCP --count 5 --start-number 101
/batch-generate --domain AWS --count 10 --start-number 1 --voice
/batch-generate --domain "Generative AI" --count 3 --start-number 50
```

## Steps

### 1. Check Existing Coverage

```bash
sqlite3 prod_tracker.sqlite "SELECT question_number, topic, domain FROM videos WHERE domain='{domain}' ORDER BY question_number DESC"
```

### 2. Generate Topic List

Based on the domain, generate a list of {count} topics that:
- Are NOT already in the database
- Cover a good spread of the domain's key areas
- Progress from fundamental to advanced
- Are interview-relevant and practical

Use web search to find trending/relevant topics.

### 3. Generate Each Video

For each topic, run `/generate-video` flow:
1. Write content JSON
2. Write metadata JSON
3. Render video
4. Track in DB

### 4. Report Summary

After all videos are generated, show:
- List of generated videos with paths
- Any failures and reasons
- Total count and suggested next topics

## Domain Topic Suggestions

**GCP**: Cloud Run, GKE, BigQuery, Dataflow, Pub/Sub, Vertex AI, Cloud Functions, Spanner, Firestore, Cloud Armor, Cloud CDN, Anthos
**AWS**: Lambda, ECS, EKS, S3, DynamoDB, SageMaker, Kinesis, Step Functions, API Gateway, CloudFront, Aurora, Bedrock
**Azure**: Functions, AKS, Cosmos DB, Azure ML, Service Bus, Event Grid, Front Door, Azure SQL, Synapse
**Kubernetes**: Pod scheduling, HPA/VPA, Ingress, Service Mesh, Operators, Helm, RBAC, Network Policies, StatefulSets
**Terraform**: Modules, State management, Workspaces, Provider configs, CI/CD integration, Drift detection
**Generative AI**: RAG, Fine-tuning, Vector DBs, Prompt engineering, Agents, Guardrails, Evaluation, LLM Ops
**System Design**: Load balancing, Caching, Rate limiting, Event sourcing, CQRS, Saga pattern, Circuit breaker
**DevOps**: GitOps, Observability, SRE practices, Canary deployments, Feature flags, Chaos engineering
