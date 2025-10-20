#!/bin/bash

echo "🚀 Starting GPT-OSS-20B Dashboard..."
echo "===================================="

# Check if Ollama server is running
if ! curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    echo "Starting Ollama server with GPT-OSS-20B model path..."
    export OLLAMA_MODELS=~/AI-Models/GPT-OSS-20B
    nohup ollama serve > /tmp/ollama.log 2>&1 &
    sleep 3
    echo "✅ Ollama server started"
else
    echo "✅ Ollama server already running"
fi

# Check if model is available
echo ""
echo "Checking for GPT-OSS-20B model..."
if export OLLAMA_MODELS=~/AI-Models/GPT-OSS-20B && ollama list | grep -q "gpt-oss:20b"; then
    echo "✅ GPT-OSS-20B model found"
else
    echo "❌ GPT-OSS-20B model not found"
    echo "   Download it with: export OLLAMA_MODELS=~/AI-Models/GPT-OSS-20B && ollama pull gpt-oss:20b"
    exit 1
fi

# Start the dashboard
echo ""
echo "Starting dashboard on http://localhost:5174"
echo "===================================="
npm run dev
