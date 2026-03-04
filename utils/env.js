/**
 * Environment Configuration — test vs prod
 * 
 * Usage:
 *   node pipeline.js --env test    → uses content_tracker.sqlite + output/
 *   node pipeline.js --env prod    → uses prod_tracker.sqlite + output_prod/  (default)
 * 
 * Or set via env var:
 *   PIPELINE_ENV=test node pipeline.js ...
 */

const path = require('path');

// Read --env from CLI args or fall back to PIPELINE_ENV, default 'prod'
const args = process.argv.slice(2);
const envIdx = args.indexOf('--env');
const ENV_NAME = (envIdx !== -1 && args[envIdx + 1])
    ? args[envIdx + 1].toLowerCase()
    : (process.env.PIPELINE_ENV || 'prod');

if (!['test', 'prod'].includes(ENV_NAME)) {
    console.error(`❌ Invalid --env value: "${ENV_NAME}". Must be "test" or "prod".`);
    process.exit(1);
}

const ROOT = path.join(__dirname, '..');

const CONFIG = {
    test: {
        dbPath: path.join(ROOT, 'content_tracker.sqlite'),
        outDir: path.join(ROOT, 'output'),
    },
    prod: {
        dbPath: path.join(ROOT, 'prod_tracker.sqlite'),
        outDir: path.join(ROOT, 'output_prod'),
    },
};

const DB_PATH = CONFIG[ENV_NAME].dbPath;
const OUT_DIR = CONFIG[ENV_NAME].outDir;

module.exports = { ENV_NAME, DB_PATH, OUT_DIR };
