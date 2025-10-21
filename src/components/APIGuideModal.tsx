import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code2, Box, Zap } from 'lucide-react';

interface APIGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const APIGuideModal: React.FC<APIGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedItem, setCopiedItem] = useState<string>('');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(''), 2000);
  };

  const apiEndpoint = 'http://127.0.0.1:11434/api/generate';
  const chatEndpoint = 'http://127.0.0.1:11434/api/chat';
  const modelName = 'gpt-oss:20b';

  const curlExample = `curl ${apiEndpoint} \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${modelName}",
    "prompt": "Explain quantum computing in simple terms",
    "stream": false
  }'`;

  const pythonExample = `import requests
import json

def query_hussai(prompt):
    url = "${apiEndpoint}"
    payload = {
        "model": "${modelName}",
        "prompt": prompt,
        "stream": False
    }

    response = requests.post(url, json=payload)
    data = response.json()
    return data['response']

# Example usage
result = query_hussai("Explain quantum computing")
print(result)`;

  const nodeExample = `const axios = require('axios');

async function queryHussAI(prompt) {
  const response = await axios.post('${apiEndpoint}', {
    model: '${modelName}',
    prompt: prompt,
    stream: false
  });

  return response.data.response;
}

// Example usage
queryHussAI('Explain quantum computing')
  .then(response => console.log(response))
  .catch(error => console.error('Error:', error));`;

  const reactExample = `import { useState } from 'react';

function HussAIChat() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const queryHussAI = async () => {
    setLoading(true);
    try {
      const res = await fetch('${apiEndpoint}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: '${modelName}',
          prompt: prompt,
          stream: false
        })
      });

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask HussAI..."
      />
      <button onClick={queryHussAI} disabled={loading}>
        {loading ? 'Thinking...' : 'Send'}
      </button>
      {response && <p>{response}</p>}
    </div>
  );
}`;

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative group">
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={() => copyToClipboard(code, id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
        >
          {copiedItem === id ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto text-sm border border-gray-700">
        <code>{code}</code>
      </pre>
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 font-mono">{language}</div>
    </div>
  );

  const InfoCard = ({ icon: Icon, title, value, id }: { icon: any; title: string; value: string; id: string }) => (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <button
          onClick={() => copyToClipboard(value, id)}
          className="text-purple-600 hover:text-purple-700 transition-colors"
        >
          {copiedItem === id ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <code className="text-xs bg-white px-3 py-2 rounded-lg block font-mono text-gray-800 border border-purple-100">
        {value}
      </code>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">HussAI 20B API Documentation</h2>
              <p className="text-blue-100 text-sm">Local AI API powered by Ollama</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <InfoCard
              icon={Terminal}
              title="API Endpoint"
              value={apiEndpoint}
              id="endpoint"
            />
            <InfoCard
              icon={Box}
              title="Model Name"
              value={modelName}
              id="model"
            />
          </div>

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-900 mb-2">Local API - No Authentication Required</h3>
                <p className="text-sm text-amber-800 mb-3">
                  HussAI 20B runs locally via Ollama. Make sure Ollama is running on{' '}
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">http://127.0.0.1:11434</code>.
                  No API keys needed - perfect for privacy and offline use!
                </p>
                <div className="bg-white border border-amber-200 rounded-lg p-3 mt-2">
                  <h4 className="font-bold text-amber-900 text-sm mb-2">📱 Using in Other LOCAL Dashboards:</h4>
                  <div className="text-sm text-amber-800 space-y-1">
                    <p>• <strong>API Endpoint:</strong> <code className="bg-amber-50 px-1.5 py-0.5 rounded font-mono text-xs">http://127.0.0.1:11434/api/generate</code></p>
                    <p>• <strong>API Key:</strong> Leave blank or use <code className="bg-amber-50 px-1.5 py-0.5 rounded font-mono text-xs">local</code> (no key required)</p>
                    <p>• <strong>Model Name:</strong> <code className="bg-amber-50 px-1.5 py-0.5 rounded font-mono text-xs">gpt-oss:20b</code></p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                  <h4 className="font-bold text-blue-900 text-sm mb-2">🌐 Using in REMOTE Dashboards (Vercel, etc.):</h4>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>Remote dashboards can't access localhost. Use <strong>ngrok</strong> to create a public tunnel:</p>
                    <code className="block bg-blue-100 px-2 py-1.5 rounded font-mono text-xs">ngrok http 11434</code>
                    <p className="mt-1">Then use the ngrok URL (e.g., <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-xs">https://abc123.ngrok.io/api/generate</code>) in your remote dashboard!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Code Examples */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Terminal className="h-5 w-5 text-blue-600" />
                cURL Example
              </h3>
              <CodeBlock code={curlExample} language="bash" id="curl" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-green-600" />
                Python Example
              </h3>
              <CodeBlock code={pythonExample} language="python" id="python" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-yellow-600" />
                Node.js Example
              </h3>
              <CodeBlock code={nodeExample} language="javascript" id="node" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-purple-600" />
                React Example
              </h3>
              <CodeBlock code={reactExample} language="jsx" id="react" />
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Additional API Endpoints</h3>
            <div className="space-y-3 text-sm">
              <div>
                <code className="bg-white px-3 py-1.5 rounded-lg font-mono text-xs border border-gray-300 inline-block mb-1">
                  POST {chatEndpoint}
                </code>
                <p className="text-gray-600">Chat endpoint with conversation history support</p>
              </div>
              <div>
                <code className="bg-white px-3 py-1.5 rounded-lg font-mono text-xs border border-gray-300 inline-block mb-1">
                  GET http://127.0.0.1:11434/api/tags
                </code>
                <p className="text-gray-600">List all available models</p>
              </div>
              <div>
                <code className="bg-white px-3 py-1.5 rounded-lg font-mono text-xs border border-gray-300 inline-block mb-1">
                  GET http://127.0.0.1:11434/api/show
                </code>
                <p className="text-gray-600">Get model information and configuration</p>
              </div>
            </div>
          </div>

          {/* Model Specs */}
          <div className="mt-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
            <h3 className="font-bold text-gray-900 mb-4">Model Specifications</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Parameters</p>
                <p className="font-bold text-purple-700">20.9 Billion</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Context Window</p>
                <p className="font-bold text-purple-700">131K tokens</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Architecture</p>
                <p className="font-bold text-purple-700">MoE (32 experts)</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Quantization</p>
                <p className="font-bold text-purple-700">MXFP4</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            For more details, visit{' '}
            <a
              href="https://ollama.com/library/gpt-oss"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              Ollama Documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default APIGuideModal;
