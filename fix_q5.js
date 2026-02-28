const fs = require('fs');
const path = require('path');
const { askJSON } = require('./providers/llm');
const { remotionDslRefinementPrompt, metadataPrompt } = require('./prompts/index');
const { assembleVideo } = require('./scripts/assembler');

async function fixVideo() {
  const contentPath = 'output_prod/q5_content.json';
  if (!fs.existsSync(contentPath)) {
    throw new Error('Content file not found: ' + contentPath);
  }
  const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  const DOMAIN = content.domain || 'Generative AI';
  const NUMBER = 5;

  console.log('📐 Refining diagrams for Q5...');
  for (let i = 0; i < content.diagrams.length; i++) {
    const diag = content.diagrams[i];
    const section = content.answer_sections.find(s => s.id === diag.section_id);
    console.log(`  Diagram ${i+1}/${content.diagrams.length}: ${diag.title}`);
    
    const prompt = remotionDslRefinementPrompt(diag, section?.spoken_audio || section?.text || '', DOMAIN);
    const refined = await askJSON(prompt);
    diag.dsl = JSON.stringify(refined);
  }

  fs.writeFileSync(contentPath, JSON.stringify(content, null, 2));
  console.log('✅ Content updated with refined diagrams.');

  console.log('📱 Generating platform metadata...');
  const metadata = await askJSON(metadataPrompt(content, DOMAIN));
  
  const platforms = ['youtube', 'meta'];
  for (const platform of platforms) {
    console.log(`🎬 Assembling video for ${platform}...`);
    const videoPath = await assembleVideo(content, content.diagrams.map(d => ({...d, isNative: true})), metadata, NUMBER, true, {
      animStyle: 'highlight',
      platform: platform
    });
    console.log(`✅ ${platform} Video ready: ${videoPath}`);
  }
}

fixVideo().catch(err => {
  console.error('❌ Fix failed:', err);
  process.exit(1);
});
