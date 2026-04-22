# Kubernetes Domain Reference

## Core Concepts for Video Content

### Workloads
- Pods, Deployments, StatefulSets, DaemonSets, Jobs/CronJobs, ReplicaSets

### Networking
- Services (ClusterIP, NodePort, LoadBalancer), Ingress, NetworkPolicies, DNS (CoreDNS), Service Mesh (Istio, Linkerd)

### Storage
- PersistentVolumes, PersistentVolumeClaims, StorageClasses, CSI drivers, ConfigMaps, Secrets

### Scaling & Scheduling
- HPA (Horizontal Pod Autoscaler), VPA (Vertical Pod Autoscaler), KEDA (event-driven), Node affinity, Taints/Tolerations, Pod Priority

### Security
- RBAC, Pod Security Standards, Network Policies, OPA/Gatekeeper, Secrets management, Service accounts

### Operations
- Helm, Kustomize, ArgoCD (GitOps), Flux, Operators, Custom Resources (CRDs), Admission webhooks

## Icon Names (for diagrams)
pod, deployment, service, ingress, statefulset, configmap, secret, persistent-volume, namespace, node, hpa, network-policy

## Interview Hot Topics
- Pod scheduling and affinity rules
- HPA vs VPA vs KEDA
- Ingress controllers comparison
- StatefulSet vs Deployment for databases
- RBAC design patterns
- GitOps with ArgoCD
- Service mesh: when and why
- Multi-tenancy patterns
