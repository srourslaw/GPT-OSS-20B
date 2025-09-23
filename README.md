# GPT-OSS-20B Dashboard

A simple dashboard for testing GPT-OSS-20B AI model as an API service with document viewing capabilities.

## Features

- Upload PDF and Word documents
- Select between Gemini AI and GPT-OSS-20B models
- Ask questions about uploaded documents
- View AI responses in a chat interface

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
   - GPT-OSS-20B API endpoint and key

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
