const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'content_tracker.sqlite');

let db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    }
});

// Initialize database schema
function initDB() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Videos table
            db.run(`CREATE TABLE IF NOT EXISTS videos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain TEXT NOT NULL,
                topic TEXT NOT NULL,
                question_number INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                duration_seconds INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Content keywords/concepts
            db.run(`CREATE TABLE IF NOT EXISTS concepts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                video_id INTEGER NOT NULL,
                concept TEXT NOT NULL,
                FOREIGN KEY (video_id) REFERENCES videos(id)
            )`);

            // Social Postings tracking
            db.run(`CREATE TABLE IF NOT EXISTS postings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                video_id INTEGER NOT NULL,
                platform TEXT NOT NULL,
                post_url TEXT,
                status TEXT NOT NULL,
                posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (video_id) REFERENCES videos(id)
            )`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

// Track a newly generated video
function trackVideo(domain, topic, questionNum, questionText, conceptsList = [], duration = null) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO videos (domain, topic, question_number, question_text, duration_seconds) 
             VALUES (?, ?, ?, ?, ?)`,
            [domain, topic, questionNum, questionText, duration],
            function (err) {
                if (err) {
                    console.error("Error inserting video:", err);
                    return reject(err);
                }
                const videoId = this.lastID;

                // Track concepts
                if (conceptsList && conceptsList.length > 0) {
                    const stmt = db.prepare("INSERT INTO concepts (video_id, concept) VALUES (?, ?)");
                    conceptsList.forEach(c => stmt.run(videoId, c));
                    stmt.finalize();
                }
                resolve(videoId);
            }
        );
    });
}

// Track a posting
function trackPosting(videoId, platform, status, url = null) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO postings (video_id, platform, status, post_url) VALUES (?, ?, ?, ?)`,
            [videoId, platform, status, url],
            function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

module.exports = {
    initDB,
    trackVideo,
    trackPosting,
    db
};
