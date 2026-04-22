---                                                          
  What Changed: Agent-as-Harness Architecture                                                                                                                    
                                                                                                                                                                 
  Before                                 
                                                                                                                                                                 
  pipeline.js (code) → calls Gemini API → parses JSON → renders → posts
                       ↑ fragile, expensive, no self-correction                                                                                                  
                                                                                                                                                                 
  After                                                                                                                                                          
                                                                                                                                                                 
  Any AI agent (Claude Code / Gemini CLI / Codex CLI)          
    ├── reads CLAUDE.md / GEMINI.md / AGENTS.md (auto-loaded project context)                                                                                    
    ├── reads domains/*.md (domain-specific knowledge)
    ├── uses skills (/generate-video, /batch-generate, etc.)                                                                                                     
    ├── writes JSON files directly (content + metadata)        
    ├── calls: node scripts/render.js   (Remotion render)                                                                                                        
    ├── calls: node scripts/track.js    (DB tracking)          
    └── calls: node scripts/post.js     (social upload)                                                                                                          
                                                               
  Files Created/Updated                                                                                                                                          
                                                               
  ┌────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────┐
  │              File              │                                          Purpose                                           │
  ├────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
  │ CLAUDE.md                      │ NEW - Claude Code project context (full schema, workflow, constraints)                     │
  ├────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
  │ GEMINI.md                      │ UPDATED - Same context for Gemini CLI                                                      │                                
  ├────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤                                
  │ AGENTS.md                      │ NEW - Same context for Codex CLI                                                           │                                
  ├────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤                                
  │ domains/*.md                   │ NEW - 8 domain reference files (GCP, AWS, Azure, K8s, Terraform, GenAI, SysDesign, DevOps) │
  ├────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤                                
  │ scripts/render.js              │ NEW - Standalone video renderer (no LLM calls)                                             │
  ├────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤                                
  │ scripts/track.js               │ NEW - Standalone DB tracker                                                                │
  ├────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤                                
  │ .claude/skills/generate-video/ │ NEW - Full video generation skill                                                          │
  ├────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤                                
  │ .claude/skills/research-topic/ │ NEW - Topic research skill                                                                 │
  ├────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤                                
  │ .claude/skills/batch-generate/ │ NEW - Batch generation skill                                                               │
  ├────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤                                
  │ .claude/skills/review-content/ │ NEW - Content validation skill                                                             │
  ├────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
  │ .claude/skills/list-topics/    │ NEW - Coverage tracker skill                                                               │
  └────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────┘                                
  
  How to Use Now                                                                                                                                                 
                                                               
  Claude Code (in this folder):                                                                                                                                  
  /generate-video "Lambda cold starts" --number 101 --domain AWS --voice
  /batch-generate --domain Kubernetes --count 5 --start-number 200                                                                                               
  /list-topics --domain GCP                                                                                                                                      
  /research-topic "Bedrock vs SageMaker" --domain AWS                                                                                                            
                                                                                                                                                                 
  Gemini CLI (in this folder):                                                                                                                                   
  gemini "generate a video about Cloud Run vs GKE, question 42, GCP domain"                                                                                      
                                                                           
  Codex CLI (in this folder):                                                                                                                                    
  codex "generate a video about EKS autoscaling, question 101, AWS domain"                                                                                       
                                                                                                                                                                 
  All three agents read the project context files automatically, understand the JSON schema, and know to call node scripts/render.js etc. No API costs -- just   
  your existing CLI subscriptions.    