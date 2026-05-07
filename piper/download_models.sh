#!/bin/bash
set -euo pipefail

DEST_DIR="$(pwd)/piper/models"
mkdir -p "$DEST_DIR"

echo "Downloading Piper en_US-lessac-high model into $DEST_DIR"
wget -q -O "$DEST_DIR/en_US-lessac-high.onnx" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx"
wget -q -O "$DEST_DIR/en_US-lessac-high.onnx.json" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx.json"

echo "Done. Models in: $DEST_DIR"
