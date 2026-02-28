#!/bin/bash
source .env
CONTAINER_ID="18027096416622547"

echo "Checking status loop..."
while true; do
    res=$(curl -s "https://graph.facebook.com/v25.0/${CONTAINER_ID}?fields=status_code&access_token=${META_ACCESS_TOKEN}")
    status=$(echo $res | jq -r .status_code)
    echo "Status: $status"
    if [ "$status" == "FINISHED" ]; then
        echo "Publishing..."
        curl -i -X POST \
            "https://graph.facebook.com/v25.0/${IG_ACCOUNT_ID}/media_publish" \
            -d "creation_id=${CONTAINER_ID}" \
            -d "access_token=${META_ACCESS_TOKEN}"
        break
    elif [ "$status" == "ERROR" ]; then
        echo "Error: $res"
        break
    fi
    sleep 5
done
