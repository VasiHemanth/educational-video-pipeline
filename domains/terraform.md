# Terraform Domain Reference

## Core Concepts for Video Content

### Fundamentals
- Providers, Resources, Data sources, Variables, Outputs, Locals, State files, Plan/Apply lifecycle

### Modules
- Module composition, Registry modules, Private modules, Module versioning, Input/Output contracts

### State Management
- Remote backends (S3, GCS, Azure Blob), State locking, State migration, Workspaces, Import existing resources

### Advanced Patterns
- Dynamic blocks, for_each vs count, Conditional resources, Moved blocks, Custom providers, Provisioners (avoid)

### CI/CD & Workflows
- Terraform Cloud/Enterprise, Atlantis, Spacelift, GitHub Actions integration, Plan-on-PR, Auto-apply

### Best Practices
- DRY with modules, Environment separation, Tagging strategies, Security scanning (tfsec, checkov), Drift detection

## Icon Names (for diagrams)
terraform, module, state, provider, resource, workspace, plan, apply, backend, pipeline

## Interview Hot Topics
- State management strategies at scale
- Module design patterns
- Workspace vs directory structure for environments
- Terraform vs Pulumi vs CDK
- Managing secrets in Terraform
- Import and adopt existing infrastructure
- Terraform in CI/CD pipelines
