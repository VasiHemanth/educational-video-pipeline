# AWS Domain Reference

## Core Services for Video Content

### Compute
- Lambda (FaaS), ECS/Fargate (containers), EKS (managed K8s), EC2 (VMs), App Runner (serverless containers)

### Data & Analytics
- Redshift (warehouse), Kinesis (streaming), Glue (ETL), Athena (serverless SQL), EMR (Spark/Hadoop), MSK (Kafka)

### Storage
- S3 (object), DynamoDB (NoSQL), RDS (managed SQL), Aurora (high-perf SQL), ElastiCache (Redis/Memcached), DocumentDB (MongoDB-compat)

### AI/ML
- SageMaker (ML platform), Bedrock (foundation models), Q Developer (AI assistant), Titan models, Comprehend (NLP), Rekognition (vision)

### Networking & Security
- ALB/NLB, CloudFront (CDN), WAF, VPC, Route 53, API Gateway, Cognito, IAM, KMS, Secrets Manager

### DevOps
- CodePipeline, CodeBuild, CodeDeploy, CloudWatch, X-Ray, CloudTrail, CloudFormation, CDK

## Icon Names (for diagrams)
lambda, ecs, eks, ec2, s3, dynamodb, rds, aurora, sagemaker, bedrock, kinesis, redshift, api-gateway, cloudfront, alb, route-53, cognito, cloudwatch, sns, sqs, step-functions, eventbridge

## Interview Hot Topics
- Lambda cold starts and optimization
- DynamoDB single-table design
- ECS vs EKS vs Lambda decision matrix
- S3 event-driven architectures
- Bedrock vs SageMaker for GenAI
- Multi-account strategy with Organizations
- Cost optimization with Spot/Graviton
