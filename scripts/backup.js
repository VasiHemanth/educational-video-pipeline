#!/usr/bin/env node
/**
 * Standalone CLI for Google Drive Backup
 * 
 * Usage:
 *   node scripts/backup.js --number 14
 *   node scripts/backup.js --all
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { getArg, hasFlag } = require('../utils/cli');
const { OUT_DIR, ENV_NAME } = require('../utils/env');
const { initDB, db, trackDriveBackup, hasBackedUpSuccessfully } = require('./db');
const { backupQuestionToDrive } = require('./drive_upload');

const NUMBER = getArg('--number');
const BACKUP_ALL = hasFlag('--all');

async function checkMissingBackups() {
    return new Promise((resolve, reject) => {
        // Find all successful videos that do not have a SUCCESS entry in drive_backups
        const query = `
            SELECT v.id, v.question_number, v.topic, v.video_file_name
            FROM videos v
            LEFT JOIN drive_backups b ON v.id = b.video_id AND b.status = 'SUCCESS'
            WHERE v.video_file_name IS NOT NULL
            AND b.id IS NULL
            ORDER BY v.question_number ASC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

async function getVideoInfo(questionNum) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT id, question_number, topic FROM videos WHERE question_number = ? ORDER BY id DESC LIMIT 1`,
            [questionNum],
            (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            }
        );
    });
}

async function run() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   Google Drive Backup Tool                       ║');
    console.log(`║   Env      : ${ENV_NAME.toUpperCase().padEnd(34)}║`);
    console.log(`║   Command  : ${BACKUP_ALL ? '--all' : '--number ' + NUMBER}`.padEnd(51) + '║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    await initDB();

    let videosToBackup = [];

    if (BACKUP_ALL) {
        console.log('🔍 Scanning database for videos missing Google Drive backups...');
        videosToBackup = await checkMissingBackups();
        console.log(`Found ${videosToBackup.length} videos to backup.\n`);
    } else if (NUMBER) {
        const qNum = parseInt(NUMBER, 10);
        const info = await getVideoInfo(qNum);
        if (!info) {
            console.error(`❌ Could not find video for Question #${qNum} in the database.`);
            process.exit(1);
        }
        
        const alreadyBackedUp = await hasBackedUpSuccessfully(info.id);
        if (alreadyBackedUp) {
            console.log(`⚠️  Question #${qNum} is already marked as SUCCESS in the drive_backups table.`);
            console.log('   Continuing anyway to force an overwrite or additional upload...\n');
        }
        
        videosToBackup = [info];
    } else {
        console.log('❌ Please provide --number <N> or --all');
        process.exit(1);
    }

    if (videosToBackup.length === 0) {
        console.log('🎉 Everything is up to date.');
        return;
    }

    for (let i = 0; i < videosToBackup.length; i++) {
        const video = videosToBackup[i];
        console.log(`\n⏳ Processing ${i + 1}/${videosToBackup.length}: Q${video.question_number} - ${video.topic}`);

        const safeTopic = (video.topic || 'Unknown_Topic').substring(0, 50);
        const backupRes = await backupQuestionToDrive(OUT_DIR, video.question_number, safeTopic);
        
        if (backupRes.status === 'SUCCESS') {
            await trackDriveBackup(video.id, backupRes.folderId, 'SUCCESS', backupRes.folderUrl);
            console.log('   💾 Database updated with SUCCESS status.');
        } else {
            await trackDriveBackup(video.id, null, 'FAILED', null);
            console.log('   💾 Database updated with FAILED status.');
        }
    }

    console.log('\n✅ Backup operation completed.');
}

run().catch(err => {
    console.error('\n❌ Backup Script failed:', err);
    process.exit(1);
});
