#!/bin/bash
set -euo pipefail

TEXT="$1"
FILENAME="${2:-announcement_$(date +%s)}"
OUTPUT_DIR="/output"
MODEL_PATH="/models/en_US-lessac-high.onnx"

mkdir -p "$OUTPUT_DIR"

echo "$TEXT" | piper \
  --model "$MODEL_PATH" \
  --output_file "$OUTPUT_DIR/${FILENAME}.wav" \
  --length_scale 0.9 \
  --noise_scale 0.667 \
  --noise_w 0.8

ffmpeg -y \
  -i "$OUTPUT_DIR/${FILENAME}.wav" \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=in:ss=0:d=0.3,afade=t=out:st=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"$OUTPUT_DIR/${FILENAME}.wav\" | awk '{print $1-0.3}'):d=0.3" \
  -codec:a libmp3lame \
  -b:a 192k \
  -ar 44100 \
  "$OUTPUT_DIR/${FILENAME}.mp3"

rm -f "$OUTPUT_DIR/${FILENAME}.wav"

echo "$OUTPUT_DIR/${FILENAME}.mp3"
