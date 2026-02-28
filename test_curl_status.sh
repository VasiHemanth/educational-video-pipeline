#!/bin/bash
source .env
CONTAINER_ID="18027096416622547"

echo "Checking status..."
curl -i -X GET \
 "https://graph.facebook.com/v25.0/${CONTAINER_ID}?fields=status_code&access_token=${META_ACCESS_TOKEN}"

