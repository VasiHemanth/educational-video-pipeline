/**
 * Prompt templates for Educational Video Pipeline
 * 5-Act Cinematic Structure:
 *   Hook → Tension → Reveal → Proof → Win
 */

/**
 * STEP 1 — Generate cinematic script with 5-act narrative structure
 */
function contentPrompt(questionNumber, topic, domain = 'Technology', liveModelsNote = '') {
  const currentDate = new Date().toISOString().split('T')[0];
  const liveSection = liveModelsNote
    ? `LIVE CONTEXT (fetched via web search today):\n${liveModelsNote}\n\n`
    : '';

  return `
You are an elite motion designer and technical educator producing SHORT-FORM cinematic videos about ${domain}.
Your content is mechanism-first: each video opens on the core decision loop, not a full architecture map.

TEMPORAL CONTEXT:
- Today's date is: ${currentDate}
${liveSection}

Generate a HIGHLY ENGAGING mechanism-first explainer for: "${topic}"

THE MECHANISM-FIRST STRUCTURE (non-negotiable):
1. HOOK          — ticker_hook scene: bold question that stops scrolling.
2. MECHANISM     — decision_loop scene: the confidence gate and branching action.
3. PROOF         — concept scene: specialist swarm or key mechanism proof.
4. SYSTEM PULLBACK — concept scene: full architecture map as payoff.
5. SYNTHESIS     — synthesis scene: compressed replay of the loop.

Return JSON with this EXACT structure:
{
  "question_number": ${questionNumber},
  "topic": "${topic}",
  "question_text": "One punchy question about the topic",
  "hook_text": "Scroll-stopping 1-sentence hook (what the viewer learns)",
  "cta_text": "Identity-close CTA: 'You now understand [X]. Follow for more.'",
  "tech_terms": ["list", "of", "core", "terms"],
  "scenes": [
    {
      "id": "1",
      "sceneType": "ticker_hook",
      "accentColor": "#00D4FF",
      "moodColor": "#0A0318",
      "transitionStyle": "wipe_right",
      "voicePacing": "fast",
      "title": "Short Title (2-4 words)",
      "text": "Max 10 words on screen.",
      "spokenAudio": "Punchy 1-sentence hook. Max 18 words.",
      "visualFormat": "ticker_hook",
      "visualData": {
        "hookStyle": "question",
        "question": "Act or Escalate?",
        "reveal": "Confidence Gate"
      },
      "keywords": { "tech_terms": ["exact", "terms"], "concepts": ["exact", "concepts"] }
    },
    {
      "id": "2",
      "sceneType": "decision_loop",
      "accentColor": "#5EE4FF",
      "moodColor": "#081425",
      "transitionStyle": "wipe_right",
      "voicePacing": "normal",
      "title": "Route, Evaluate, Decide",
      "text": "Every signal goes through specialists, then a confidence gate.",
      "spokenAudio": "Every signal goes through specialists, then a confidence gate decides the action.",
      "visualFormat": "diagram",
      "visualData": {
        "direction": "LR",
        "nodes": [
          { "id": "event", "label": "Event", "type": "messaging", "position": { "x": 12, "y": 50 } },
          { "id": "orchestrator", "label": "Orchestrator", "type": "process", "position": { "x": 28, "y": 50 } },
          { "id": "agent_a", "label": "Agent A", "type": "compute", "position": { "x": 46, "y": 28 } },
          { "id": "agent_b", "label": "Agent B", "type": "compute", "position": { "x": 46, "y": 50 } },
          { "id": "agent_c", "label": "Agent C", "type": "compute", "position": { "x": 46, "y": 72 } },
          { "id": "consensus", "label": "Consensus", "type": "process", "position": { "x": 66, "y": 50 } },
          { "id": "gate", "label": "Gate", "type": "decision", "position": { "x": 80, "y": 50 } },
          { "id": "execute", "label": "Execute", "type": "process", "position": { "x": 92, "y": 34 } },
          { "id": "escalate", "label": "Escalate", "type": "user", "position": { "x": 92, "y": 66 } },
          { "id": "audit", "label": "Audit Log", "type": "storage", "position": { "x": 80, "y": 84 } }
        ],
        "edges": [
          { "id": "event-orch", "from": "event", "to": "orchestrator" },
          { "id": "orch-a", "from": "orchestrator", "to": "agent_a" },
          { "id": "orch-b", "from": "orchestrator", "to": "agent_b" },
          { "id": "orch-c", "from": "orchestrator", "to": "agent_c" },
          { "id": "a-consensus", "from": "agent_a", "to": "consensus" },
          { "id": "b-consensus", "from": "agent_b", "to": "consensus" },
          { "id": "c-consensus", "from": "agent_c", "to": "consensus" },
          { "id": "consensus-gate", "from": "consensus", "to": "gate" },
          { "id": "gate-exec", "from": "gate", "to": "execute", "label": "auto" },
          { "id": "gate-esc", "from": "gate", "to": "escalate", "label": "human" },
          { "id": "exec-audit", "from": "execute", "to": "audit" },
          { "id": "esc-audit", "from": "escalate", "to": "audit" }
        ],
        "beats": [
          {
            "id": "beat-1",
            "label": "Signal In",
            "title": "Route the event",
            "detail": "Capture the event and pass it to the orchestrator.",
            "chip": "Event",
            "activeNodeIds": ["event", "orchestrator"],
            "activeEdgeIds": ["event-orch"]
          },
          {
            "id": "beat-2",
            "label": "Specialists",
            "title": "Parallel analysis",
            "detail": "Specialist agents evaluate the signal in parallel.",
            "chip": "Agents",
            "activeNodeIds": ["agent_a", "agent_b", "agent_c"],
            "activeEdgeIds": ["orch-a", "orch-b", "orch-c"]
          },
          {
            "id": "beat-3",
            "label": "Consensus",
            "title": "Merge evidence",
            "detail": "Aggregate outputs into a shared confidence score.",
            "chip": "Consensus",
            "activeNodeIds": ["consensus"],
            "activeEdgeIds": ["a-consensus", "b-consensus", "c-consensus"]
          },
          {
            "id": "beat-4",
            "label": "Gate",
            "title": "Decide the path",
            "detail": "If confidence is high, execute. If not, escalate.",
            "chip": "Gate",
            "activeNodeIds": ["gate"],
            "activeEdgeIds": ["consensus-gate"]
          }
        ]
      },
      "keywords": { "tech_terms": ["orchestrator", "agents"], "concepts": ["confidence gate"] }
    },
    {
      "id": "3",
      "sceneType": "concept",
      "accentColor": "#92FF7A",
      "moodColor": "#081A23",
      "transitionStyle": "wipe_right",
      "voicePacing": "normal",
      "title": "Specialist Swarm",
      "text": "Each agent owns a single lens: risk, context, action.",
      "spokenAudio": "Each agent owns a single lens: risk, context, and action.",
      "visualFormat": "diagram",
      "visualData": {
        "dsl": "(Risk Agent) -> [Confidence] -> (Decision)"
      },
      "keywords": { "tech_terms": ["agents"], "concepts": ["specialist", "confidence"] }
    },
    {
      "id": "4",
      "sceneType": "concept",
      "accentColor": "#7D8CFF",
      "moodColor": "#0D1525",
      "transitionStyle": "wipe_right",
      "voicePacing": "normal",
      "title": "System Pullback",
      "text": "Ingest, orchestrate, decide, and notify in one flow.",
      "spokenAudio": "Ingest, orchestrate, decide, and notify in one flow.",
      "visualFormat": "diagram",
      "visualData": {
        "dsl": "(Ingest) -> [Stream] -> [Agent Mesh] -> [Gate] -> (Actions)"
      },
      "keywords": { "tech_terms": ["ingest", "stream"], "concepts": ["architecture"] }
    },
    {
      "id": "5",
      "sceneType": "synthesis",
      "accentColor": "#FFD76A",
      "moodColor": "#121A2D",
      "transitionStyle": "flash",
      "voicePacing": "fast",
      "title": "Loop Summary",
      "text": "Route. Compare. Decide. Log. Repeat.",
      "spokenAudio": "Route, compare, decide, log, repeat.",
      "visualFormat": "text_only",
      "visualData": null,
      "keywords": { "tech_terms": [], "concepts": ["loop"] }
    }
  ],
  "title_card_text": "Catchy subtitle (max 5 words)"
}

CRITICAL RULES:
1. EXACTLY 5 scenes in the structure above (hook → decision_loop → proof → pullback → synthesis). CTA is auto-appended.
2. "text" field = max 12 words. Visual does the talking.
3. "spokenAudio" = conversational, max 25 words per scene. Voice of a mentor, not a lecturer.
4. decision_loop nodes MUST include "position" with x/y from 0-100 (no decimals).
5. decision_loop beats: 4-7 beats. Each beat needs activeNodeIds and activeEdgeIds.
6. For other diagram scenes, keep to 4-6 nodes for phone readability.
7. Avoid emojis. Use plain text labels only.
8. NO MARKDOWN. Return pure JSON only.
`;
}

/**
 * STEP 2 — Refine Diagram into exact JSON needed by the DynamicDiagram React component
 */
function remotionDslRefinementPrompt(diagramSpec, sectionText, domain = 'Technology') {
  return `
Convert this ${domain} architecture diagram specification into a strict JSON payload for the video rendering engine.

Section context (what the narrator says while this renders):
"${sectionText}"

Diagram spec from Step 1:
${JSON.stringify(diagramSpec, null, 2)}

Return ONLY a valid JSON object matching this schema (NO MARKDOWN FENCES, just raw JSON):
{
  "direction": "LR" | "TB",
  "nodes": [
    { 
      "id": "string",
      "label": "string (1-2 words MAX — abbreviate aggressively)",
      "type": "compute" | "storage" | "database" | "messaging" | "user" | "process" | "decision",
      "iconName": "optional 1-character emoji like 👤, ⚡, 💾, or 📨"
    }
  ],
  "edges": [
    { "from": "node_id", "to": "node_id", "label": "optional very short label (1 word)" }
  ]
}

VISUAL DESIGN RULES:
1. "direction": Use "LR" for ≤3 nodes, "TB" for 4-8 nodes.
2. "label": MUST be incredibly short. "Amazon Elastic Compute Cloud" → "EC2". "User Browser" → "Browser".
3. "type": Closest logical shape. Users = circles, databases = cylinders, compute = rounded rects.
4. Keep node count to 4-6 for optimal visual clarity on a phone screen.
5. Create a logical narrative flow that maps to the spoken audio.
`;
}

/**
 * STEP 2b — Refine chaos_grid data for PainChaosScene
 */
function refineChaosGridPrompt(rawProblems, sectionText, domain) {
  return `
Refine these pain point items for a ${domain} educational video chaos scene.

Scene voiceover: "${sectionText}"
Raw problems: ${JSON.stringify(rawProblems)}

Return ONLY raw JSON (no markdown):
{
  "problems": ["3 words max", "3 words max", "3 words max"],
  "tagline": "One sentence, rhetorical. E.g. 'There has to be a better way.'"
}

Rules:
- Each problem is MAX 3 words. Specific, painful, punchy.
- Tagline creates emotional urgency for the next scene.
`;
}

/**
 * STEP 2c — Refine timeline_steps data for TimelineStepsScene
 */
function refineTimelineStepsPrompt(rawSteps, sectionText, domain) {
  return `
Refine these timeline steps for a ${domain} educational video.

Scene voiceover: "${sectionText}"
Raw steps: ${JSON.stringify(rawSteps)}

Return ONLY raw JSON (no markdown):
{
  "steps": [
    { "n": "1", "icon": "⚡", "title": "2-3 words", "detail": "One clear sentence." },
    { "n": "2", "icon": "🔄", "title": "2-3 words", "detail": "One clear sentence." },
    { "n": "3", "icon": "✅", "title": "2-3 words", "detail": "One clear sentence." }
  ]
}

Rules:
- title: MAX 3 words. Action-oriented.
- detail: MAX 1 sentence. Explains the "why" or mechanism.
- icon: Relevant emoji that visually represents the step.
- Max 4 steps total.
`;
}


/**
 * Legacy stubs for backwards compatibility
 */
function dslRefinementPrompt() { return ''; }
function mermaidDslRefinementPrompt() { return ''; }

/**
 * STEP 3 — Generate Social Metadata
 */
function metadataPrompt(content, domain = 'Technology') {
  return `
Generate optimized social media metadata for this ${domain} educational video.

Topic: ${content.topic}
Services/Concepts covered: ${(content.tech_terms || []).join(', ')}
Core mechanism: decision loop, confidence gate, act vs escalate

Return JSON:
{
  "youtube": {
    "title": "${domain} Explained: [catchy title under 60 chars] #Shorts",
    "description": "Write a highly technical explanation of the architectural workflow shown in the video. End with 'Subscribe for daily breakdowns.'",
    "tags": ["${domain}", "Architecture", "Engineering", "SystemDesign", "...20 highly specific tech tags"]
  },
  "thumbnail": {
    "headline": "Punchy large-text headline for thumbnail (max 4 words, ALL CAPS).",
    "subheadline": "A slightly longer sub-headline (max 8 words)."
  },
  "instagram": {
    "caption": "STRICT FORMAT:\\nLine 1: Punchy hook.\\n\\nLine 2-5: Four bullet points (►), highly technical insights.\\n\\nLine 6: 'Save this 🔖'\\n\\nLine 7: hashtags (15 highly segmented niche tags)."
  }
}
`;
}

module.exports = { 
  contentPrompt, 
  dslRefinementPrompt, 
  mermaidDslRefinementPrompt, 
  remotionDslRefinementPrompt,
  refineChaosGridPrompt,
  refineTimelineStepsPrompt,
  metadataPrompt 
};
