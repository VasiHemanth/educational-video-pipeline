#!/bin/bash
source .env
VIDEO_URL="https://res.cloudinary.com/deudtwqqk/video/upload/v1772129452/gcp_reel_1772129447578.mp4"
CAPTION="Testing cURL upload!"

echo "Sending container..."
curl -i -X POST \
 "https://graph.facebook.com/v21.0/${IG_ACCOUNT_ID}/media" \
 -d "access_token=${META_ACCESS_TOKEN}" \
 -d "media_type=REELS" \
 -d "video_url=${VIDEO_URL}" \
 -d "caption=${CAPTION}" \
 -d "share_to_feed=true"
