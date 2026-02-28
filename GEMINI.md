# 🤖 AI Agent Context for GCP Educational Video Pipeline

> **IMPORTANT**: If you are an AI agent analyzing this repository, READ THIS ENTIRE FILE before proposing or making any changes. This project has highly specific constraints for mobile-first video rendering.

**Project Context:** We are generating and posting **AI Cloud Architect** related educational content. Each video contains a brief explanation of architectures or concepts, paired with dynamically generated **Flowchart diagrams** to visually illustrate the cloud solutions.

## 📱 1. Mobile-First Layout & Safe Zones (CRITICAL)
This pipeline generates 1080x1920 (9:16 portrait) videos for **YouTube Shorts, Instagram Reels, and Facebook Reels**. The UI layout must strictly adhere to the following safe zones to avoid overlapping with platform chromes (like/share buttons, profile names, top nav):

- **Canvas Size:** `1080` (width) × `1920` (height)
- **Top Safe Zone:** The top `200px` must remain clear (Instagram's back button/search bar zone).
    - Intro screen domain tag starts at `top: 20%`.
    - Content section title starts at `top: 200px`.
- **Text Zone:** Begins at `top: 320px` and takes `22%` of the screen height. 
- **Diagram Zone:** Located centrally to maximize screen real estate.
    - **Boundaries:** `top: 36%` to `bottom: 8%` (gives ~1075px usable height).
    - **Padding:** Left `60px`, Right `60px` (usable width ~960px).
- **Watermark:** Must be placed in the **bottom-left** corner (`bottom: 60px`, `left: 80px`). Do NOT place it in the bottom-right, as it will be covered by Instagram/YouTube engagement buttons.

---

## 📐 2. Smart Diagram System (`NativeDiagram.tsx`)
Because of the 9:16 aspect ratio, the rendering engine dynamically sizes and positions diagram nodes. **Never force diagrams to overflow.**

### Layout Decision Logic:
- **1 to 3 Nodes:** `LR` (Left-to-Right). Horizontal layout. Fits well across the 960px width.
- **4 to 8 Nodes:** `TB` (Top-to-Bottom). Vertical layout. Uses the massive 1075px vertical space. 
- **9+ Nodes:** `GRID` (2-row wrap layout). Fallback.

### Sizing Tiers (for `TB` Layout):
The font sizes and paddings scale conditionally based on the number of nodes so they always fit perfectly within the 1075px zone:
| Node Count | Font Size | Padding (V/H) | Gap  |
|------------|-----------|---------------|------|
| **≤ 4**    | `36px`    | `18px`/`28px` | `24px` |
| **5–6**    | `28px`    | `14px`/`22px` | `18px` |
| **7–8**    | `22px`    | `10px`/`18px` | `12px` |

**Text Wrapping:** Node styles must include `whiteSpace: 'normal'` and `wordBreak: 'break-word'` with a strictly calculated `maxWidth`. Do NOT use `nowrap`.

---

## 🧠 3. LLM Prompting Rules (`prompts/index.js`)
The LLM generates JSON payloads defining the video script and diagram structure.

- **Strict Node Labels:** Diagram node labels must be **1-2 words MAX**. They must be readable on a 6-inch phone screen. No sentences inside nodes.
- **Direction:** Prompts enforce `LR` for ≤3 nodes and `TB` for >3 nodes. `NativeDiagram.tsx` acts as the final arbiter.
- **Text Formatting:** The `"text"` field from the LLM is rendered dynamically. Newlines (`\n`) in the text are mapped to bulleted lines prefixed with `▸`. 

---

## ⚙️ 4. Pipeline Execution (`pipeline.js`)
The main entry point for video generation is `pipeline.js`. It orchestrates the entire flow:
1. **LLM Content Gen:** Gemini generates `qX_content.json`.
2. **LLM Diagram Refinement:** Gemini converts abstract diagram DSL into strictly formatted Remotion JSON nodes/edges.
3. **Metadata Gen:** Generates YouTube/Meta descriptions and hashtags into `qX_metadata.json`.
4. **Remotion Render:** Spins up a child process to compile `src/index.ts` into a `.mp4`.
5. **Auto-Post:** Uploads directly to social media.

### Sample Command:
```bash
node pipeline.js --topic "Large-Scale Gen AI" --number 6 --domain "Generative AI" --diagrams remotion --platforms "youtube,meta" --post
```

---

## 🚀 5. Social Media Uploading (`scripts/post.js`)
The pipeline integrates via APIs directly to social platforms.
- **YouTube Shorts:** Uses the `googleapis` library. Often restricts custom thumbnails via API for Shorts.
- **Facebook Reels:** Direct upload using the `FB_PAGE_ID` and user access token.
- **Instagram Reels:** 
  - Instagram Graph API **does not accept local file uploads**.
  - Pipeline uploads the local `.mp4` to **Cloudinary** first to get a public URL.
  - Passes the Cloudinary URL to Instagram to create an async media container, then polls for completion before publishing.

### Environment Requirements (`.env`):
For uploading to work, the script requires `dotenv` to be explicitly loaded at the top level and the following keys:
- `YOUTUBE_CLIENT_SECRET_FILE`
- `META_ACCESS_TOKEN`
- `FB_PAGE_ID`, `IG_ACCOUNT_ID`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
