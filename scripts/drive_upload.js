const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = path.join(__dirname, '..', 'drive_tokens.json');

/**
 * Initializes the Google Drive API client
 * Uses the same client_secret.json as YouTube but generates a separate drive_tokens.json
 */
async function authorizeDrive() {
    return new Promise((resolve, reject) => {
        const credentialsFile = process.env.YOUTUBE_CLIENT_SECRET_FILE || './client_secret.json';
        const credPath = path.resolve(__dirname, '..', credentialsFile);

        if (!fs.existsSync(credPath)) {
            console.error(`❌ Missing Google credentials at ${credPath}`);
            return resolve(null);
        }

        const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
        const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) {
                return getNewToken(oAuth2Client, resolve, reject);
            }
            oAuth2Client.setCredentials(JSON.parse(token));
            resolve(oAuth2Client);
        });
    });
}

function getNewToken(oAuth2Client, resolve, reject) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('\n======================================================');
    console.log('🔗 GOOGLE DRIVE AUTHORIZATION REQUIRED');
    console.log('Authorize this app to upload to Drive by visiting this url:');
    console.log(authUrl);
    console.log('======================================================\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                console.error('Error retrieving Drive access token', err);
                return reject(err);
            }
            oAuth2Client.setCredentials(token);
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
            console.log(`✅ Drive token stored to ${TOKEN_PATH}`);
            resolve(oAuth2Client);
        });
    });
}

/**
 * Ensures a master folder exists in Drive (e.g., "AI Cloud Architect")
 */
async function getOrCreateMasterFolder(drive, folderName = 'AI Cloud Architect') {
    // Search for the folder
    const res = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
    });

    if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id;
    }

    // Create the folder if it doesn't exist
    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
    };

    const createRes = await drive.files.create({
        resource: fileMetadata,
        fields: 'id',
    });

    return createRes.data.id;
}

/**
 * Creates a subfolder in Google Drive under a parent folder
 */
async function createSubfolder(drive, parentId, folderName) {
    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
    };

    const res = await drive.files.create({
        resource: fileMetadata,
        fields: 'id, webViewLink',
    });

    return { id: res.data.id, url: res.data.webViewLink };
}

/**
 * Uploads a single file to a specific Drive folder
 */
async function uploadFileToFolder(drive, folderId, filePath) {
    const fileName = path.basename(filePath);
    
    // Determine basic mime types
    let mimeType = 'application/octet-stream';
    if (fileName.endsWith('.mp4')) mimeType = 'video/mp4';
    else if (fileName.endsWith('.json')) mimeType = 'application/json';
    else if (fileName.endsWith('.png')) mimeType = 'image/png';
    else if (fileName.endsWith('.sqlite')) mimeType = 'application/vnd.sqlite3';
    
    const fileMetadata = {
        name: fileName,
        parents: [folderId]
    };
    
    const media = {
        mimeType: mimeType,
        body: fs.createReadStream(filePath)
    };

    const res = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
    });

    return res.data.id;
}

/**
 * Main export to backup a specific question's scattered assets to Google Drive
 * Scans output_prod and voice_output for files starting with q<Number>_
 */
async function backupQuestionToDrive(outDir, questionNumber, topicName) {
    console.log(`   📤 Initiating Google Drive Backup for Q${questionNumber}...`);
    
    try {
        const auth = await authorizeDrive();
        if (!auth) {
            console.log('   ⏭️  Skipping Drive Backup (Missing Credentials)');
            return { status: 'FAILED', folderId: null, folderUrl: null };
        }

        const drive = google.drive({ version: 'v3', auth });
        
        // 1. Get or master folder
        const masterFolderId = await getOrCreateMasterFolder(drive, 'AI Cloud Architect');
        
        // 2. Create subfolder for this specific question
        const safeTopicName = (topicName || 'Unknown_Topic').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
        const folderName = `Q${questionNumber}_${safeTopicName}`;
        console.log(`   📂 Creating Drive folder: ${folderName}...`);
        
        const subfolder = await createSubfolder(drive, masterFolderId, folderName);
        
        // 3. Collect ALL scattered files for this question number
        const allFiles = [];
        const prefix = `q${questionNumber}_`;

        // Direct root items (content/metadata)
        if (fs.existsSync(path.join(outDir, `${prefix}content.json`))) allFiles.push(path.join(outDir, `${prefix}content.json`));
        if (fs.existsSync(path.join(outDir, `${prefix}metadata.json`))) allFiles.push(path.join(outDir, `${prefix}metadata.json`));

        // Subdirectories to scan in outDir
        const targetDirs = ['video', 'thumbnails', 'diagrams', 'carousels', 'audio', 'frames'];
        targetDirs.forEach(dir => {
            const dirPath = path.join(outDir, dir);
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                files.forEach(f => {
                    // Match the precise prefix to avoid colliding Q1 with Q10, etc.
                    // Also check for the edge case where output videos have an extra domain prefix 
                    // (e.g., q11_Generative_AI_...)
                    if (f.startsWith(prefix)) {
                        allFiles.push(path.join(dirPath, f));
                    }
                });
            }
        });

        // Scan voice_output for manifest
        const manifestPath = path.join(__dirname, '..', 'voice_output', `${prefix}manifest.json`);
        if (fs.existsSync(manifestPath)) allFiles.push(manifestPath);

        if (allFiles.length === 0) {
            console.error(`   ❌ No files found starting with ${prefix} in ${outDir}`);
            return { status: 'FAILED', folderId: null, folderUrl: null };
        }

        console.log(`   📤 Uploading ${allFiles.length} files to Drive...`);
        
        for (const filePath of allFiles) {
            const fileName = path.basename(filePath);
            process.stdout.write(`      - Uploading ${fileName}... `);
            await uploadFileToFolder(drive, subfolder.id, filePath);
            console.log(`✅`);
        }
        
        console.log(`   ✅ Drive Backup Complete! Folder URL: ${subfolder.url}`);
        return { status: 'SUCCESS', folderId: subfolder.id, folderUrl: subfolder.url };

    } catch (err) {
        console.error('   ❌ Drive Backup Failed:');
        console.error(err.message || err);
        return { status: 'FAILED', folderId: null, folderUrl: null };
    }
}

// For manual testing
if (require.main === module) {
    authorizeDrive().then(() => console.log('Auth check complete.'));
}

module.exports = { backupQuestionToDrive, authorizeDrive };
