#!/bin/bash

echo "GPT-OSS-20B Download Monitor"
echo "============================="
echo "Target size: ~13 GB"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
    # Get current size
    CURRENT_SIZE=$(du -sh ~/AI-Models/GPT-OSS-20B 2>/dev/null | awk '{print $1}')

    # Get file count in blobs
    BLOB_COUNT=$(find ~/AI-Models/GPT-OSS-20B/blobs -type f 2>/dev/null | wc -l | tr -d ' ')

    # Clear line and print status
    echo -ne "\rCurrent size: $CURRENT_SIZE | Files: $BLOB_COUNT | $(date '+%H:%M:%S')"

    sleep 2
done
