/**
 * Prompt templates for GCP Daily Interview Questions video pipeline
 * Each prompt is tuned for JSON output to drive downstream rendering
 */

/**
 * STEP 1 — Generate question + full answer content
 * Output drives: title card, voiceover script, keyword highlighting, diagram specs
 */
function contentPrompt(questionNumber, topic) {
  return `
You are a GCP Cloud Architect educator creating short-form video content for Google Cloud interview prep.

Generate Interview Question #${questionNumber} about: "${topic}"

Return JSON with this exact structure:
{
  "question_number": ${questionNumber},
  "topic": "${topic}",
  "question_text": "How would you [specific scenario]?",
  "gcp_services": ["list", "of", "GCP", "services", "involved"],
  "answer_sections": [
    {
      "id": 1,
      "title": "DEFINITION",
      "text": "Full answer paragraph for this section (2-4 sentences). Be technical and specific.",
      "keywords": {
        "gcp_services": ["exact words to highlight BLUE"],
        "action_verbs": ["exact words to highlight RED"],
        "concepts": ["exact words to highlight GREEN"]
      }
    }
  ],
  "diagrams": [
    {
      "id": 1,
      "section_id": 1,
      "title": "ETL Pipeline Overview",
      "type": "flowchart",
      "dsl": "(Source) -> [Transform] -> [[Destination]]",
      "animation_sequence": ["node1_id", "arrow", "node2_id"],
      "direction": "LR"
    }
  ],
  "voiceover_script": "Full spoken script exactly matching the answer sections. Natural speech, no bullet points.",
  "title_card_text": "Short catchy subtitle for the intro card (max 8 words)",
  "hashtags": ["#GCP", "#CloudArchitect", "#GoogleCloud", "#Interview"]
}

DIAGRAM DSL RULES (Excalidraw-flowchart syntax):
- [Label]     = rectangle (process/service)
- {Label?}    = diamond (decision)
- (Label)     = ellipse (start/end)
- [[Label]]   = database/storage
- ->          = solid arrow
- --> "label" = labeled dashed arrow
- @direction LR  = left-to-right layout

KEYWORD RULES:
- gcp_services: exact service names as they appear in text (e.g. "Cloud Dataflow", "BigQuery")
- action_verbs: technical verbs (e.g. "extract", "transform", "partition")
- concepts: architectural concepts (e.g. "ETL", "streaming", "batch")

Generate 3-5 answer sections covering the complete answer. Each section needs 1 diagram.
Topic-specific guidance for "${topic}":
  - Be precise about GCP-specific APIs, configs, and patterns
  - Reference real GCP console paths or SDK commands where helpful
  - Include a monitoring/observability section if relevant
`;
}

/**
 * STEP 2 — Convert diagram spec to clean Excalidraw DSL
 * Called per diagram with the LLM-generated diagram spec
 */
function dslRefinementPrompt(diagramSpec, sectionText) {
  return `
Convert this GCP architecture diagram specification into clean Excalidraw-flowchart DSL.

Section context: "${sectionText}"

Diagram spec:
${JSON.stringify(diagramSpec, null, 2)}

EXCALIDRAW DSL SYNTAX:
  (Label)    = ellipse (start/end/external)
  [Label]    = rectangle (service/process)  
  {Label?}   = diamond (decision)
  [[Label]]  = database/storage cylinder
  ->         = solid arrow
  --> "text" = labeled solid arrow
  @direction LR|TB|RL|BT
  @spacing 80

RULES:
1. Keep labels SHORT — max 3 words per node
2. GCP service names: use official short forms (PubSub, Dataflow, BigQuery, GCS)  
3. Always start with @direction and @spacing
4. Decision diamonds must end with ?
5. No special characters except ? in labels

Return ONLY the DSL string, nothing else. Example:
@direction LR
@spacing 80
(PubSub) -> [Dataflow] -> "clean" -> [[BigQuery]]
[Dataflow] -> "errors" --> [[GCS]]
`;
}

/**
 * STEP 2b — Convert diagram spec to Mermaid DSL (colorful, reliable CLI)
 */
function mermaidDslRefinementPrompt(diagramSpec, sectionText) {
  return `
Convert this GCP architecture diagram specification into Mermaid flowchart syntax.

Section context: "${sectionText}"

Diagram spec:
${JSON.stringify(diagramSpec, null, 2)}

MERMAID SYNTAX:
flowchart LR
  A[Service Name] --> B[Another Service]
  B --> C[(Database)]
  B --> D{Decision?}
  D -->|Yes| E[Result]
  D -->|No| F[Other]

NODE SHAPES:
  A[Label]     = rectangle (process/service)
  A[(Label)]   = cylinder (database/storage like BigQuery, GCS, Spanner)
  A{Label}     = diamond (decision)
  A([Label])   = rounded (start/end)
  A[[Label]]   = subroutine

STYLE RULES:
1. Use "flowchart LR" (left to right) unless the diagram needs TB (top to bottom)
2. Keep labels SHORT — max 3 words per node
3. GCP service names: use official short forms (Pub/Sub, Dataflow, BigQuery, GCS)
4. Use labeled arrows for data flow descriptions: -->|label|
5. Add style classes for GCP color coding after the flowchart:
   - style A fill:#4285F4,stroke:#2A6DD9,color:#fff   (for compute/processing: Dataflow, Cloud Run, GKE)
   - style B fill:#34A853,stroke:#1E8E3E,color:#fff   (for storage: BigQuery, GCS, Spanner)
   - style C fill:#EA4335,stroke:#C5221F,color:#fff   (for messaging: Pub/Sub, Cloud Tasks)
   - style D fill:#FBBC04,stroke:#E8A400,color:#000   (for monitoring: Cloud Monitoring, Logging)
6. NO markdown fences — return raw Mermaid code only

Return ONLY the Mermaid DSL string, nothing else. Example:
flowchart LR
  A([Source]) -->|ingest| B[Dataflow]
  B -->|transform| C[(BigQuery)]
  B -->|errors| D[(GCS)]
  style A fill:#EA4335,stroke:#C5221F,color:#fff
  style B fill:#4285F4,stroke:#2A6DD9,color:#fff
  style C fill:#34A853,stroke:#1E8E3E,color:#fff
  style D fill:#34A853,stroke:#1E8E3E,color:#fff
`;
}

/**
 * STEP 3 — Generate animation sequence JSON
 * Drives Remotion frame-by-frame node reveal
 */
function animationPrompt(dsl, voiceoverTimestamps) {
  return `
Given this Excalidraw DSL diagram and voiceover word timestamps, generate an animation sequence
that reveals diagram nodes in sync with the narration.

DSL:
${dsl}

Voiceover timestamps (word → time in seconds):
${JSON.stringify(voiceoverTimestamps, null, 2)}

Return JSON:
{
  "animation_steps": [
    {
      "step": 1,
      "action": "show_node",
      "node_label": "PubSub",
      "trigger_word": "integrate",
      "start_time_s": 2.4,
      "duration_ms": 400,
      "easing": "ease-out"
    },
    {
      "step": 2,
      "action": "show_arrow",
      "from": "PubSub",
      "to": "Dataflow",
      "trigger_word": "streams",
      "start_time_s": 3.1,
      "duration_ms": 300
    }
  ]
}

Actions: show_node | show_arrow | highlight_node | pulse_node
Match each node reveal to the moment the narrator first mentions that component.
`;
}

/**
 * STEP 4 — Generate YouTube/Reels metadata
 */
function metadataPrompt(content) {
  return `
Generate optimized social media metadata for this GCP interview question video.

Question: ${content.question_text}
Topic: ${content.topic}
Services covered: ${content.gcp_services.join(', ')}

Return JSON:
{
  "youtube": {
    "title": "GCP Interview Q${content.question_number}: [catchy title] #Shorts",
    "description": "3-4 sentence description with value prop + call to action",
    "tags": ["GCP", "GoogleCloud", "CloudArchitect", "Interview", "Shorts", "...10 more relevant tags"],
    "category": "Education",
    "playlist": "GCP Daily Interview Questions"
  },
  "instagram": {
    "caption": "Hook line\n\nValue lines (3-4)\n\nHashtags (15-20)",
    "cover_text": "Short punchy text for the reel cover"
  },
  "tiktok": {
    "caption": "Hook + value + CTA (max 150 chars)",
    "sounds_suggestion": "Lo-fi beats / study music genre"
  }
}
`;
}

module.exports = { contentPrompt, dslRefinementPrompt, mermaidDslRefinementPrompt, animationPrompt, metadataPrompt };
