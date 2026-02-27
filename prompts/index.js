/**
 * Prompt templates for GCP Daily Interview Questions video pipeline
 * Each prompt is tuned for JSON output to drive downstream rendering
 */

/**
 * STEP 1 — Generate question + full answer content
 * Output drives: title card, voiceover script, keyword highlighting, diagram specs
 */
function contentPrompt(questionNumber, topic, domain = 'GCP') {
  return `
You are an AI Cloud Architect educator creating short-form video content for ${domain} interview prep.
We focus on building crazy scalable AI systems.
*CRITICAL*: Use your Web Search tools to find the absolute latest, bleeding-edge architectures and tools for this topic before answering! Do not rely solely on your training data.

Generate Interview Question #${questionNumber} about: "${topic}"

Return JSON with this exact structure:
{
  "question_number": ${questionNumber},
  "topic": "${topic}",
  "question_text": "How would you [specific scenario]?",
  "hook_text": "A punchy, viral 1-2 sentence hook opening the video (e.g. 'Here is how to build a RAG system that handles 10,000 queries/day on Google Cloud').",
  "cta_text": "A strong, brief call to action for the end of the video (e.g. 'Save this for your next AI build' or 'Follow for daily Cloud Architect tips').",
  "tech_terms": ["list", "of", "${domain}", "services", "or", "technologies", "involved"],
  "answer_sections": [
    {
      "id": 1,
      "title": "Short Title",
      "text": "Extremely concise on-screen text. Maximum 10-15 words total. Punchy, readable, punchy.",
      "spoken_audio": "Detailed spoken explanation of this section (20-30 words). Natural speech, no bullet points. This will be read by TTS.",
      "keywords": {
        "tech_terms": ["exact words from 'text' to highlight"],
        "action_verbs": ["exact words from 'text' to highlight"],
        "concepts": ["exact words from 'text' to highlight"]
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
- tech_terms: exact service/tech names as they appear in the 'text' property
- action_verbs: technical verbs from the 'text' property
- concepts: architectural concepts from the 'text' property

CRITICAL CONSTRAINTS:
1. Generate EXACTLY 2-3 answer sections (no more!).
2. 'text' MUST BE ULTRA CONCISE. Mobile viewers will read it fast. Maximum 10-15 words.
3. 'spoken_audio' provides the detailed explanation that the narrator says while 'text' is on screen.
4. Each section needs 1 diagram.
5. DO NOT USE ANY MARKDOWN FORMATTING (like **bold** or *italics*) in the text strings. Just plain text.

Topic-specific guidance for "${topic}":
  - Be precise about ${domain}-specific APIs, configs, and patterns
  - Reference real console paths or SDK commands where helpful
  - Include a monitoring/observability section if relevant
`;
}

/**
 * STEP 2 — Convert diagram spec to clean Excalidraw DSL
 * Called per diagram with the LLM-generated diagram spec
 */
function dslRefinementPrompt(diagramSpec, sectionText, domain = 'GCP') {
  return `
Convert this ${domain} architecture diagram specification into clean Excalidraw-flowchart DSL.

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
1. Keep labels INCREDIBLY SHORT — strictly 1-2 words max per node. They must be readable on a small mobile screen.
2. Service names: use official short forms (e.g. PubSub, EC2, Databricks)
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
function mermaidDslRefinementPrompt(diagramSpec, sectionText, domain = 'GCP') {
  return `
Convert this ${domain} architecture diagram specification into Mermaid flowchart syntax.

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
1. MUST use "flowchart TB" (vertical layout) IF there are more than 3 nodes in the diagram. If the diagram has 3 or fewer nodes, MUST use "flowchart LR" (horizontal layout).
2. Keep labels INCREDIBLY SHORT — strictly 1-2 words max per node! They must be massive and readable on a mobile screen.
3. Service names: use official short forms (Pub/Sub, Lambda, S3)
4. Use labeled arrows for data flow descriptions ONLY if absolutely necessary, kept to 1 word: -->|label|
5. Add style classes for color coding after the flowchart:
   - style A fill:#4285F4,stroke:#2A6DD9,color:#fff   (for compute/processing)
   - style B fill:#34A853,stroke:#1E8E3E,color:#fff   (for storage/databases)
   - style C fill:#EA4335,stroke:#C5221F,color:#fff   (for messaging/streaming)
   - style D fill:#FBBC04,stroke:#E8A400,color:#000   (for monitoring/management)
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
function metadataPrompt(content, domain = 'GCP') {
  return `
Generate optimized social media metadata for this ${domain} interview question video.

Question: ${content.question_text}
Topic: ${content.topic}
Services covered: ${(content.tech_terms || []).join(', ')}

Return JSON:
{
  "youtube": {
    "title": "${domain} Interview Q${content.question_number}: [catchy title] #Shorts",
    "description": "Write a highly technical, rigorous 5-6 sentence explanation of the architectural workflow shown in the video. Explain the exact mechanism of how the services interact. End with a strong CTA.",
    "tags": ["${domain}", "CloudArchitect", "Interview", "AI", "Shorts", "SystemDesign", "...exactly 15-20 strictly relevant technical hashtags!"],
    "category": "Education",
    "playlist": "${domain} Daily Interview Questions"
  },
  "thumbnail": {
    "headline": "A very punchy, large-text headline for the thumbnail (max 5 words).",
    "subheadline": "A slightly longer sub-headline that elaborates on the topic (max 10-12 words)."
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

/**
 * STEP 2c — Convert diagram spec to native JSON (Remotion component)
 */
function remotionDslRefinementPrompt(diagramSpec, sectionText, domain = 'GCP') {
  return `
Convert this ${domain} architecture diagram specification into a simple JSON graph format for direct UI rendering.

Section context: "${sectionText}"

Diagram spec:
${JSON.stringify(diagramSpec, null, 2)}

Return ONLY a valid JSON object matching this schema:
{
  "direction": "LR" | "TB",
  "nodes": [
    { "id": "string", "label": "string (keep to 1-2 words)", "type": "compute | storage | database | messaging | user" }
  ],
  "edges": [
    { "from": "node_id", "to": "node_id", "label": "optional short label" }
  ]
}

RULES:
1. "direction": MUST be "LR" for 3 or fewer nodes, UNLESS any node label is more than 2 words long, in which case it MUST be "TB". If more than 3 nodes, it MUST be "TB".
2. "label" MUST BE INCREDIBLY SHORT — strictly 1-2 words max per node!
3. Do not include markdown fences (like \`\`\`json). Just the raw JSON object.
`;
}

module.exports = { contentPrompt, dslRefinementPrompt, mermaidDslRefinementPrompt, remotionDslRefinementPrompt, animationPrompt, metadataPrompt };
