# System Design Domain Reference

## Core Concepts for Video Content

### Scalability
- Horizontal vs vertical scaling, Load balancing (L4/L7), Auto-scaling, Sharding, Partitioning

### Data Patterns
- CQRS, Event sourcing, Saga pattern, Outbox pattern, Change data capture, Write-ahead log

### Caching
- Cache-aside, Write-through, Write-behind, Cache invalidation, Redis patterns, CDN caching

### Messaging
- Pub/Sub, Message queues, Event-driven architecture, Exactly-once delivery, Dead letter queues, Backpressure

### Reliability
- Circuit breaker, Retry with backoff, Bulkhead, Rate limiting, Health checks, Graceful degradation

### Microservices
- Service discovery, API gateway, Sidecar pattern, Service mesh, Strangler fig, BFF pattern

## Icon Names (for diagrams)
load-balancer, cache, database, queue, api-gateway, service, user, cdn, storage, event-bus

## Interview Hot Topics
- Design a URL shortener
- Design a real-time chat system
- Design a news feed / timeline
- Design a rate limiter
- Design a distributed cache
- Design a notification system
- CAP theorem practical implications
- Eventual consistency patterns
