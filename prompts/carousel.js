/**
 * Prompt templates for the Carousel Generation Pipeline
 * Two carousel types:
 *   - "insight"   : thought leadership, from a blog URL or topic
 *   - "technical" : architecture breakdown, from existing qX_content.json
 */

/**
 * CAROUSEL TYPE 1 — Insight Carousel
 * Input: raw blog text OR a topic string
 * Output: 7-8 slides JSON for a psychologically engaging carousel
 */
function insightCarouselPrompt(sourceText, topic, domain = 'AI') {
    const isUrl = sourceText && sourceText.length > 200; // assume it's blog body text if long
    const sourceSection = isUrl
        ? `SOURCE CONTENT (from blog/article — distill and repurpose, don't copy verbatim):\n"""\n${sourceText.substring(0, 4000)}\n"""`
        : `TOPIC TO GENERATE ORIGINAL INSIGHT CONTENT FOR: "${topic}"`;

    return `
You are a viral social media content strategist creating a LinkedIn/Instagram carousel about ${domain}.
Your carousels are known for stopping the scroll, building authority, and driving saves/shares.

${sourceSection}

Generate a 7-8 slide carousel. Each slide has ONE job. Use psychological triggers to keep readers swiping.

PSYCHOLOGICAL TRIGGER FRAMEWORK (pick the best for each slide):
- Slide 1 (HOOK): Curiosity gap, bold claim, pattern interruption, or fear-of-missing-out
- Slide 2 (PROBLEM): Amplify the pain. Make them feel it. Use real consequences.
- Slides 3–6 (VALUE): Teach, reveal, reframe. Each slide = one insight, stat, or "aha" moment.
- Slide 7 (PAYOFF): The synthesis. Make them feel smart for reading this far.
- Slide 8 (CTA): Strong, specific action. What should they do RIGHT NOW?

Return a JSON array of slides:
[
  {
    "slide_index": 1,
    "type": "cover",
    "label": null,
    "headline": "Bold, punchy, max 8 words. Use power words. End with emoji if appropriate.",
    "subtext": "1-2 lines that expand on the hook and make them NEED to swipe. Max 20 words.",
    "has_swipe_cue": true
  },
  {
    "slide_index": 2,
    "type": "problem",
    "label": "THE PROBLEM",
    "headline": "Max 10 words. State the pain clearly.",
    "subtext": "2-3 lines expanding on consequences. Concrete, specific, real.",
    "has_swipe_cue": true
  },
  {
    "slide_index": 3,
    "type": "insight",
    "label": "KEY INSIGHT",
    "headline": "A reframe or bold claim. Max 10 words.",
    "body_items": ["bullet 1 — short, punchy", "bullet 2", "bullet 3", "bullet 4 (optional)"],
    "has_swipe_cue": true
  },
  {
    "slide_index": 4,
    "type": "list",
    "label": "THE ROLE",
    "headline": "What [X] actually does. Max 10 words.",
    "list_items": [
      {"number": "01", "text": "Item name — brief description"},
      {"number": "02", "text": "Item name — brief description"},
      {"number": "03", "text": "Item name — brief description"},
      {"number": "04", "text": "Item name — brief description"},
      {"number": "05", "text": "Item name — brief description"}
    ],
    "has_swipe_cue": true
  },
  {
    "slide_index": 5,
    "type": "risk",
    "label": "THE RISK",
    "headline": "Without [X], here's what breaks. Max 10 words.",
    "risk_items": ["► Risk 1", "► Risk 2", "► Risk 3", "► Risk 4"],
    "pullquote": "A memorable, quotable one-liner that summarizes the stakes.",
    "has_swipe_cue": true
  },
  {
    "slide_index": 6,
    "type": "quote",
    "label": "KEY TRUTH",
    "quote": "The most impactful insight from the whole piece. Make it quotable.",
    "attribution": "Optional: short attribution or source",
    "subtext": "1-2 sentences that land the insight deeper.",
    "has_swipe_cue": true
  },
  {
    "slide_index": 7,
    "type": "payoff",
    "label": "THE TAKEAWAY",
    "headline": "What this all means. Bold forward-looking statement.",
    "subtext": "2-3 lines with the key synthesis.",
    "has_swipe_cue": true
  },
  {
    "slide_index": 8,
    "type": "cta",
    "label": null,
    "headline": "A question that makes them reflect OR a bold closing statement.",
    "subtext": "1-2 sentences of stakes and urgency.",
    "cta_primary": "Follow for daily AI insights →",
    "cta_secondary": "Save this post 🔖",
    "has_swipe_cue": false
  }
]

RULES:
1. Headlines: punchy, specific, direct. No filler. Max 10 words. No generic platitudes.
2. Subtext: concrete and real. Every sentence earns its place.
3. List items: 3-5 words each, scannable at a glance.
4. Pullquotes: memorable, tweet-worthy, under 15 words.
5. ALL content must be relevant to: "${topic}"
6. Return ONLY the JSON array. No markdown fences, no explanation.
`;
}

/**
 * CAROUSEL TYPE 2 — Technical Carousel
 * Input: existing qX_content.json from the video pipeline
 * Output: 5-7 slides JSON for an architecture breakdown carousel
 */
function technicalCarouselPrompt(contentJson, domain = 'GCP') {
    return `
You are an ${domain} technical educator creating a LinkedIn/Instagram carousel that teaches a cloud architecture concept.
The carousel should be educational, credibility-building, and drive saves/shares from engineers.

SOURCE CONTENT:
Question: ${contentJson.question_text}
Topic: ${contentJson.topic}
Sections: ${JSON.stringify(contentJson.answer_sections?.map(s => ({ title: s.title, text: s.text })), null, 2)}

Generate a 5-7 slide technical carousel:

Slide 1: HOOK — A bold problem statement or provocative question that makes engineers want to read on.
Slides 2-(N-1): ARCHITECTURE — One answer_section per slide. Each slide covers ONE architectural decision.
Last Slide: CTA — Follow + Save prompt.

Return a JSON array of slides:
[
  {
    "slide_index": 1,
    "type": "cover",
    "label": null,
    "headline": "Punchy engineer-focused hook. Max 10 words. Can use 🔥 or ⚡.",
    "subtext": "The specific problem this architecture solves. 1-2 lines.",
    "has_swipe_cue": true
  },
  {
    "slide_index": 2,
    "type": "architecture",
    "label": "STEP 1",
    "headline": "Section title — what this architecture block does.",
    "body_items": ["Key point 1", "Key point 2", "Key point 3"],
    "tech_terms": ["GCS", "Pub/Sub"],
    "has_swipe_cue": true
  },
  {
    "slide_index": -1,
    "type": "cta",
    "label": null,
    "headline": "A question that makes engineers want to engage.",
    "subtext": "Follow for daily ${domain} architecture breakdowns.",
    "cta_primary": "Follow AI Cloud Architect →",
    "cta_secondary": "Save for your next system design 🔖",
    "has_swipe_cue": false
  }
]

RULES:
1. Technical accuracy is CRITICAL. Use correct service names, real patterns.
2. Headlines: engineer-friendly, specific, no buzzwords without substance.
3. Body items: each is 5-10 words. Highly scannable. Use → or ▸ prefix.
4. Use existing answer_sections as source — extract the key insight per section.
5. Return ONLY the JSON array. No markdown fences, no explanation.
`;
}

/**
 * Carousel Social Metadata
 * Generates platform-specific captions and hashtags
 */
function carouselMetadataPrompt(slides, type, domain = 'AI') {
    const headline = slides[0]?.headline || 'AI Architecture Insights';
    const topic = slides[0]?.subtext || '';

    return `
Generate social media metadata for a ${type} carousel post about: "${headline}".
Topic context: "${topic}"

Return JSON:
{
  "instagram": {
    "caption": "STRICT FORMAT:\\nLine 1: One punchy hook sentence ending with an emoji.\\n\\nLine 2-4: Three bullet points starting with ► covering the key insights from this carousel.\\n\\nLine 5: Strong CTA — e.g. 'Save this 🔖 | Drop your thoughts below 👇'\\n\\nLine 6: blank\\n\\nLine 7: Hashtags — 5 ultra-niche + 4 mid-range + 3 broad = 12 hashtags max. Must include #${domain.replace(/\s/g, '')} #AIArchitect #TechCarousel"
  },
  "facebook": {
    "caption": "A 2-3 sentence compelling description of what this carousel teaches, followed by a CTA to save and share. Professional and direct tone."
  },
  "hashtags": {
    "primary": ["array of 5 most relevant niche hashtags"],
    "secondary": ["array of 4 mid-range hashtags"],
    "broad": ["#AI", "#Technology", "#Leadership"]
  }
}

Return ONLY the JSON object. No markdown fences.
`;
}

module.exports = { insightCarouselPrompt, technicalCarouselPrompt, carouselMetadataPrompt };
