#!/usr/bin/env node
/**
 * Standalone DB Tracker
 *
 * Called by AI agents to track a generated video in the SQLite database.
 *
 * Usage:
 *   node scripts/track.js --number 42 --domain "GCP" --topic "Cloud Run vs GKE"
 *   node scripts/track.js --number 42 --domain "AWS" --topic "Lambda vs Fargate" --env prod
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { getArg } = require('../utils/cli');
const { OUT_DIR } = require('../utils/env');
const { initDB, trackVideo, isTopicCovered } = require('./db');

const NUMBER = parseInt(getArg('--number'), 10);
const DOMAIN = getArg('--domain') || 'GCP';
const TOPIC = getArg('--topic');

if (!NUMBER || !TOPIC) {
  console.error('Usage: node scripts/track.js --number <N> --domain <domain> --topic "<topic>"');
  process.exit(1);
}

async function main() {
  await initDB();

  // Check for duplicates
  const existing = await isTopicCovered(DOMAIN, TOPIC);
  if (existing) {
    console.log(`Already tracked: Q${existing.question_number} "${TOPIC}" (${DOMAIN}) on ${existing.created_at}`);
    console.log(`Video ID: ${existing.id}`);
    return;
  }

  // Read content JSON for question text and concepts
  const contentPath = path.join(OUT_DIR, `q${NUMBER}_content.json`);
  let questionText = TOPIC;
  let concepts = [];

  if (fs.existsSync(contentPath)) {
    const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
    questionText = content.question_text || TOPIC;
    concepts = [
      ...(content.answer_sections || []).flatMap(s => s.keywords?.tech_terms || []),
      ...(content.answer_sections || []).flatMap(s => s.keywords?.concepts || []),
    ];
    concepts = [...new Set(concepts)];
  }

  // Find video file
  const videoDir = path.join(OUT_DIR, 'video');
  let videoFileName = null;
  if (fs.existsSync(videoDir)) {
    const files = fs.readdirSync(videoDir).filter(f => f.startsWith(`q${NUMBER}_`) && f.endsWith('.mp4'));
    if (files.length > 0) videoFileName = files[0];
  }

  const videoId = await trackVideo(DOMAIN, TOPIC, NUMBER, questionText, concepts, null, videoFileName);
  console.log(`Tracked: Q${NUMBER} "${TOPIC}" (${DOMAIN}) → video_id=${videoId}`);
  console.log(`  Concepts: ${concepts.length}`);
  console.log(`  Video file: ${videoFileName || 'not found'}`);
}

main().catch(err => {
  console.error('Track failed:', err.message);
  process.exit(1);
});
