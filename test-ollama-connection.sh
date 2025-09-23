#!/bin/bash

echo "🔍 Testing Ollama Connection..."
echo "================================"

# Test if Ollama server is running
echo "1. Checking if Ollama server is running..."
if curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    echo "✅ Ollama server is running"
else
    echo "❌ Ollama server is not running"
    echo "   Start with: export OLLAMA_MODELS='/Volumes/LaCie 1TB/GPT-OSS-20B' && ollama serve"
    exit 1
fi

# List available models
echo ""
echo "2. Available models:"
curl -s http://127.0.0.1:11434/api/tags | python3 -m json.tool

# Test GPT-OSS-20B model
echo ""
echo "3. Testing GPT-OSS-20B model..."
curl -s -X POST http://127.0.0.1:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-oss:20b",
    "prompt": "Hello, please respond with just the word SUCCESS to test the connection.",
    "stream": false
  }' | python3 -m json.tool

echo ""
echo "🎉 Connection test complete!"