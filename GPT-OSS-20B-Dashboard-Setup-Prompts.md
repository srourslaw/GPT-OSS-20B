# GPT-OSS-20B Dashboard Setup Prompts
## Step-by-Step Project Initialization

---

## Prompt 1: Project Context & GitHub Setup

```
# Claude Code Project Kickoff Statement

For this project, we will use **GitHub** as the single source of truth and your persistent context. Treat the repository's commit history, branch structure, and file changes as your "memory" of the project.

## GitHub Repository
- Repository: https://github.com/srourslaw/GPT-OSS-20B
- Vercel Deployment: https://vercel.com/hussein-srours-projects
- This will be our central source of truth for all project decisions, code changes, and documentation

## Project Overview
A simple dashboard for testing GPT-OSS-20B AI model as an API service with document viewing capabilities. Users can:
- Upload PDF and Word documents
- Select between Gemini AI and GPT-OSS-20B models
- Ask questions about uploaded documents
- View AI responses in a chat interface

## How to Use GitHub Context
- **Commit History as Living Documentation**  
  Always read and interpret commit messages to understand what changed, why, and when. Use `git log`, `git diff`, and branch comparisons to track the evolution of the codebase.

- **Pattern Recognition & Reuse**  
  Identify and reuse established coding, architecture, and testing patterns. When adding new features or APIs, follow these patterns unless explicitly told otherwise.

- **Error Resolution via Comparison**  
  When something breaks, compare the current implementation to previously working versions and suggest fixes based on proven solutions from earlier commits.

## Development Workflow
- **Commit Strategy**  
  Commit after each successful test checkpoint with clear, descriptive messages.

- **Branch Strategy**  
  Work directly on `main` for this simple project, or create feature branches for major components.

- **Vercel Integration**
  Automatic deployments from main branch to Vercel for testing.

## Your Role
- **Before starting**: Review the README and recent commits to understand the current state.  
- **During development**: Test each component before moving to the next.  
- **When debugging**: Compare broken code to working implementations.  

## Key Principles
1. **Simple & Functional** – Focus on core functionality over complexity
2. **Test Early** – Test document upload and AI integration as soon as possible  
3. **Git Discipline** – Commit working code frequently
4. **Deployment Ready** – Ensure code works in Vercel environment

**Bottom Line:** Keep it simple, test frequently, and use GitHub as your project memory. This is a testing/proof-of-concept project, not a production application.

## CRITICAL REQUIREMENTS
1. **Always commit changes** to GitHub after any working functionality
2. **Test document upload** and AI integration early
3. **Keep dependencies minimal** for easier deployment
4. **Focus on functionality** over perfect styling

Now, let's start by setting up the project structure for a simple document AI dashboard.
```

---

## Prompt 2: Project Structure & Dependencies

```
Initialize the GPT-OSS-20B Dashboard with a simple, focused structure:

## Step 1: Repository Setup
1. Clone the repository: https://github.com/srourslaw/GPT-OSS-20B
2. Set up proper Git configuration
3. Initialize with main branch

## Step 2: Simple Project Structure
Create this streamlined directory structure:

```
GPT-OSS-20B/
├── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── index.html
├── .gitignore
├── .env.example
├── vercel.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── FileUpload.tsx
│   │   ├── DocumentViewer.tsx
│   │   ├── AISelector.tsx
│   │   ├── ChatInterface.tsx
│   │   └── Header.tsx
│   ├── services/
│   │   ├── aiService.ts
│   │   ├── documentService.ts
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── fileHelpers.ts
│       └── constants.ts
├── public/
│   └── favicon.ico
└── docs/
    ├── setup.md
    └── api-integration.md
```

## Step 3: Technology Stack (Minimal)
Set up with essential dependencies only:
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Document Processing**: pdf-parse, mammoth (for Word docs)
- **HTTP Client**: fetch (built-in) or axios
- **Icons**: Lucide React
- **File Upload**: Built-in HTML5 file API

## Step 4: Package.json Configuration
Create package.json with:
- React + TypeScript setup
- Vite for fast development
- Tailwind for styling
- Document processing libraries
- Vercel deployment configuration

## Step 5: Environment Configuration
Create .env.example with:
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GPT_OSS_API_URL=your_gpt_oss_api_url_here
VITE_GPT_OSS_API_KEY=your_gpt_oss_api_key_here
```

## Step 6: Vercel Configuration
Create vercel.json for deployment:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "functions": {
    "src/api/*.ts": {
      "runtime": "@vercel/node"
    }
  }
}
```

## Step 7: Initial Commit
After creating the structure, make initial commit:
"feat: initial project structure for GPT-OSS-20B dashboard"

Please create this simplified structure and initialize the repository.
```

---

## Prompt 3: Core Application Setup

```
Create the basic application structure with essential components for the document AI dashboard.

## Step 1: Main Application Files

### src/main.tsx
- React 18 entry point
- Strict mode enabled
- Basic error boundary

### src/App.tsx
- Main application component
- Single page layout (no routing needed)
- State management for:
  - Uploaded document
  - Selected AI model
  - Chat messages
  - Loading states

### src/index.css
- Tailwind CSS imports
- Basic global styles
- Document viewer styling

## Step 2: Essential Components

### components/Header.tsx
- Simple header with app title
- AI model selector dropdown
- Basic styling

### components/FileUpload.tsx
- Drag & drop file upload
- Support for PDF and Word documents
- File validation and preview
- Upload progress indicator

### components/DocumentViewer.tsx
- Display uploaded document content
- Scrollable text area
- Loading state for processing
- "No document" placeholder

### components/AISelector.tsx
- Dropdown to choose between:
  - Gemini AI
  - GPT-OSS-20B
- Visual indicator of selected model

### components/ChatInterface.tsx
- Message input field
- Send button
- Chat history display
- Loading indicator for AI responses
- Error handling

## Step 3: Services Layer

### services/documentService.ts
- Extract text from PDF files
- Extract text from Word documents
- Handle file reading errors
- Return processed text content

### services/aiService.ts
- API calls to Gemini AI
- API calls to GPT-OSS-20B
- Handle different response formats
- Error handling and retries

### services/api.ts
- HTTP client configuration
- Request/response interceptors
- Environment-based API URLs

## Step 4: Types Definition

### types/index.ts
```typescript
export interface Document {
  name: string;
  type: string;
  content: string;
  uploadedAt: Date;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  aiModel?: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export interface AIResponse {
  text: string;
  model: string;
  timestamp: Date;
}
```

## Step 5: Basic Functionality Test
After setup, the app should:
- Load without errors
- Display all components
- Handle file upload (basic validation)
- Show selected AI model
- Have working chat input (UI only)

## Step 6: Commit Strategy
Commit with message: "feat: implement basic application structure and components"

The app should run with `npm run dev` and display a functional interface ready for AI integration.

Please implement this core application structure.
```

---

## Prompt 4: Document Processing Implementation

```
Implement document processing functionality to extract text from PDF and Word documents.

## Step 1: Install Document Processing Dependencies
Add these packages:
- pdf-parse (for PDF text extraction)
- mammoth (for Word document processing)
- file-type (for file validation)

## Step 2: Document Service Implementation

### services/documentService.ts
Implement functions for:

#### PDF Processing
- `processPDF(file: File): Promise<string>`
- Extract plain text from PDF
- Handle encrypted/protected PDFs
- Error handling for corrupted files

#### Word Document Processing  
- `processWordDoc(file: File): Promise<string>`
- Support for .doc and .docx formats
- Extract text content only (ignore formatting)
- Handle password-protected documents

#### File Validation
- `validateFile(file: File): boolean`
- Check file type and size limits
- Supported formats: PDF, DOC, DOCX
- Maximum file size: 10MB

#### Text Cleaning
- `cleanText(text: string): string`
- Remove extra whitespace
- Fix encoding issues
- Prepare text for AI processing

## Step 3: FileUpload Component Enhancement

### Update components/FileUpload.tsx:
- Integrate document processing service
- Show processing progress
- Display text extraction results
- Handle processing errors gracefully
- Update parent component with extracted text

## Step 4: DocumentViewer Component Enhancement

### Update components/DocumentViewer.tsx:
- Display processed document text
- Add text search functionality
- Show document metadata (name, type, length)
- Responsive text display
- Copy text to clipboard option

## Step 5: Error Handling
Implement comprehensive error handling for:
- Unsupported file formats
- Corrupted documents
- Processing timeouts
- Memory limits exceeded
- Network issues during upload

## Step 6: Testing Checklist
Test with various document types:
- [ ] Simple PDF documents
- [ ] Complex PDF with images/tables
- [ ] Word documents (.docx)
- [ ] Legacy Word documents (.doc)
- [ ] Password-protected files (should fail gracefully)
- [ ] Very large documents (should handle or reject appropriately)
- [ ] Corrupted files (should show error message)

## Step 7: User Experience Features
Add helpful UX elements:
- File format icons
- Processing progress indicators
- Success/error notifications
- Document preview before processing
- Clear/reset functionality

## Step 8: Commit Strategy
After implementing and testing document processing:
"feat: implement document text extraction for PDF and Word files"

The application should successfully extract and display text from uploaded documents before moving to AI integration.

Please implement this document processing functionality with proper error handling and user feedback.
```

---

## Prompt 5: AI Integration Implementation

```
Implement AI service integration for both Gemini AI and GPT-OSS-20B with document context.

## Step 1: Environment Variables Setup
Update .env.example and create .env.local:
```
# Gemini AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

# GPT-OSS-20B Configuration  
VITE_GPT_OSS_API_URL=your_gpt_oss_20b_endpoint
VITE_GPT_OSS_API_KEY=your_gpt_oss_api_key

# General Configuration
VITE_MAX_CONTEXT_LENGTH=4000
VITE_REQUEST_TIMEOUT=30000
```

## Step 2: AI Service Implementation

### services/aiService.ts
Create a unified AI service that handles both models:

#### Core Functions
- `sendMessage(message: string, documentContext: string, model: string): Promise<AIResponse>`
- `formatPrompt(userQuestion: string, documentContent: string): string`
- `handleGeminiRequest(prompt: string): Promise<string>`
- `handleGPTOSSRequest(prompt: string): Promise<string>`

#### Request Formatting
For both AI models, format requests to include:
- Document context (truncated if too long)
- User question
- Clear instructions for the AI
- Response format guidelines

#### Error Handling
- API timeout handling
- Rate limit management
- Invalid API key detection
- Network error recovery
- Graceful fallback messages

## Step 3: Chat Interface Integration

### Update components/ChatInterface.tsx:
- Connect to AI service
- Send document context with each question
- Display AI responses with model attribution
- Handle loading states during API calls
- Show error messages for failed requests
- Maintain chat history

### Chat Features
- Message timestamps
- Model indicator for each response
- Copy response to clipboard
- Clear chat history
- Retry failed requests

## Step 4: AI Model Selector Enhancement

### Update components/AISelector.tsx:
- Visual indicators for each model
- Model descriptions/capabilities
- Connection status indicators
- API key validation status

## Step 5: Context Management
Implement smart context handling:
- Truncate long documents for API limits
- Preserve important sections when truncating
- Show context length indicators
- Warn users about context limits

## Step 6: Response Processing
Handle different AI response formats:
- Parse JSON responses safely
- Extract text content from structured responses
- Handle streaming responses (if supported)
- Format responses for display

## Step 7: Testing Strategy
Test AI integration thoroughly:

#### Gemini AI Testing
- [ ] Valid API key works
- [ ] Invalid API key shows error
- [ ] Document context included correctly
- [ ] Responses formatted properly
- [ ] Rate limits handled gracefully

#### GPT-OSS-20B Testing
- [ ] API endpoint accessible
- [ ] Authentication working
- [ ] Document questions answered accurately
- [ ] Error responses handled
- [ ] Response time acceptable

#### Integration Testing
- [ ] Switch between models works
- [ ] Document context preserved
- [ ] Chat history maintained
- [ ] Multiple questions in sequence
- [ ] Large documents handled

## Step 8: User Experience Enhancements
Add features for better UX:
- Typing indicators during AI processing
- Estimated response time
- Model comparison mode
- Response rating/feedback
- Export chat history

## Step 9: Final Testing & Deployment
Before committing:
- Test with real documents
- Verify API integrations work
- Check error handling paths
- Ensure Vercel deployment compatibility
- Test environment variable loading

## Step 10: Commit Strategy
After successful AI integration testing:
"feat: implement AI service integration for Gemini and GPT-OSS-20B with document context"

The application should now be fully functional for document upload, text extraction, and AI-powered question answering with both AI models.

Please implement this AI integration with thorough testing of both models.
```

---

## Summary

These 5 simplified setup prompts will create a focused GPT-OSS-20B dashboard:

1. ✅ **GitHub + Vercel Integration** - Proper repository setup with deployment
2. ✅ **Simple Project Structure** - Minimal but complete architecture  
3. ✅ **Core Application** - Basic React app with essential components
4. ✅ **Document Processing** - PDF and Word text extraction
5. ✅ **AI Integration** - Both Gemini and GPT-OSS-20B API connections

**Key Differences from Your Complex Project:**
- Single page application (no routing)
- Minimal dependencies 
- Focus on core functionality only
- Direct Vercel deployment
- Simplified testing requirements

**Expected Timeline:** 2-3 days for complete implementation

Each prompt builds on the previous one, and Claude Code will have full context through GitHub commits. The final result will be a working dashboard deployed on Vercel for testing your GPT-OSS-20B API integration.