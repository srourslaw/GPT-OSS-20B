# Nexus 20B Dashboard

A powerful AI dashboard featuring Nexus 20B (20.9B parameter open-source model) with advanced document analysis capabilities.

## Features

- Upload PDF, Word, Excel, CSV, JSON, and text documents
- Dual chat modes: General Chat & Document Q&A
- Select between Nexus 20B (local) and Gemini AI models
- Dynamic context window control (16K - 100K tokens)
- Syntax-highlighted code responses
- Interactive charts and visualizations
- Export conversations (Markdown, JSON, Text)
- Download charts as images
- Conversation memory for context-aware responses

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Document Processing**: pdf-parse, mammoth
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/srourslaw/GPT-OSS-20B.git
   cd GPT-OSS-20B
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Add your API keys to `.env.local`:
   - Gemini AI API key
   - Nexus 20B (via Ollama) endpoint

5. Start development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Deployment

The app is configured for automatic deployment to Vercel from the main branch.

## Project Structure

```
src/
├── components/          # React components
│   ├── FileUpload.tsx
│   ├── DocumentViewer.tsx
│   ├── AISelector.tsx
│   ├── ChatInterface.tsx
│   └── Header.tsx
├── services/           # API and business logic
│   ├── aiService.ts
│   ├── documentService.ts
│   └── api.ts
├── types/              # TypeScript definitions
│   └── index.ts
└── utils/              # Helper functions
    ├── fileHelpers.ts
    └── constants.ts
```
