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

---

## Prompt 6: Canvas Mode & Advanced Features

```
Implement Canvas Mode with multi-window system, chat history, and advanced UI controls.

## Step 1: Canvas Mode Implementation

### Overview
Canvas Mode provides a flexible workspace where users can open multiple windows simultaneously:
- Chat windows with AI conversation
- Reference windows for document viewing
- Notes windows for taking notes
- Draft windows for writing
- Web browser windows for research
- Document library for file management

### Core Components

#### components/CanvasBoard.tsx
Main canvas workspace component with:
- Multi-window management system
- Window positioning and resizing
- Z-index management for window layering
- Drag-and-drop window movement
- Window minimization/maximization
- Toggleable toolbar for navigation

#### components/CanvasWindow.tsx
Individual window component featuring:
- Draggable header with title
- Minimize, maximize, and close buttons
- Resize handles (bottom-right and bottom-left corners)
- Window state management (normal, minimized, maximized)
- Z-index handling for proper layering

### Window Types
Each window type has specific functionality:
- **Chat Window**: Full AI chat interface with history
- **Reference Window**: Document viewer for uploaded files
- **Notes Window**: Rich text editor for note-taking
- **Draft Window**: Advanced text editor with export capabilities
- **Web Browser**: Embedded browser for research
- **Document Library**: File management and organization

## Step 2: Chat History System

### Architecture
Implement persistent chat session management:

#### Key Features
- Multiple chat sessions per window
- Auto-generated session titles from first message
- Session pinning for important conversations
- Time-based session grouping (Today, Yesterday, Previous 7/30 Days, Older)
- Search functionality across all sessions
- Session metadata (message count, last updated timestamp)

#### Implementation Files

**components/ChatHistory.tsx**
- Sidebar with session list
- Search bar for filtering sessions
- Pin/unpin functionality
- Delete session with confirmation
- Session selection and creation
- Responsive time-based grouping

**utils/chatHistoryHelpers.ts**
Helper functions for:
- `generateChatTitle(firstMessage)` - Create meaningful titles
- `createNewSession()` - Initialize new chat sessions
- `updateSessionTitle(session)` - Auto-update based on first message
- `saveChatHistory(windowId, sessions, activeSessionId)` - Persist to localStorage
- `loadChatHistory(windowId)` - Restore from localStorage
- `deleteSession(sessions, sessionId)` - Remove sessions
- `togglePinSession(sessions, sessionId)` - Pin/unpin functionality

#### Types Enhancement
```typescript
interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
}
```

## Step 3: UI Controls & Stacking Context Solution

### Problem: Maximized Windows Overlapping Controls
When canvas windows are maximized, they can cover UI controls (Home button, add menu, etc.)

### Solution: React Portals + Position Fixed
Implement a two-part solution:

#### Part 1: React Portals for UI Controls
Use React Portals to render UI controls at the document.body level:
```typescript
import { createPortal } from 'react-dom';

{typeof document !== 'undefined' && document && document.body ? createPortal(
  <div className="fixed" style={{ zIndex: 999999 }}>
    {/* UI Controls */}
  </div>,
  document.body
) : null}
```

**Important**: Always check for document existence for SSR compatibility:
- Check `typeof document !== 'undefined'`
- Check `document` is not null
- Check `document.body` exists
- Use ternary operator (`? :`) not AND operator (`&&`) to prevent parameter evaluation

#### Part 2: Position Fixed for Maximized Windows
Change maximized windows from `position: absolute` to `position: fixed`:
```typescript
const style: React.CSSProperties = windowData.isMaximized
  ? {
      position: 'fixed', // Critical: matches portal stacking context
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 10000 // Below UI controls (999999)
    }
  : {
      position: 'absolute',
      left: windowData.x,
      top: windowData.y,
      width: windowData.width,
      height: windowData.height,
      zIndex: windowData.zIndex
    };
```

**Why This Works**:
- `position: fixed` creates stacking context relative to viewport
- Both portals and maximized windows use same stacking context
- z-index comparison now works correctly (999999 > 10000)
- Without this, `position: absolute` windows create separate stacking context

## Step 4: Toggleable Toolbar Implementation

### Design Requirements
- Compact size (7x7 pixels for buttons)
- Top-left corner placement
- Manual toggle (no auto-hide)
- Consolidated all controls in one location

### Implementation
```typescript
const [showToolbar, setShowToolbar] = useState(false);

{typeof document !== 'undefined' && document && document.body ? createPortal(
  <div className="fixed left-3 top-3 flex flex-col gap-1.5" style={{ zIndex: 999999 }}>
    {/* Menu Button - Always Visible */}
    <button onClick={() => setShowToolbar(!showToolbar)} className="w-7 h-7...">
      <Menu className="h-3.5 w-3.5" />
    </button>

    {/* Toolbar Buttons - Toggleable */}
    {showToolbar && (
      <>
        <button onClick={onReturnHome} className="w-7 h-7...">
          <Home className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setShowAddMenu(!showAddMenu)} className="w-7 h-7...">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </>
    )}
  </div>,
  document.body
) : null}
```

### Controls Included
- **Menu Button**: Toggle toolbar visibility (always visible)
- **Home Button**: Return to landing page
- **Plus Button**: Open add window menu (Chat, References, Notes, etc.)

## Step 5: Standard Mode Home Button

### Issue
Standard Mode (single chat interface) also needs a Home button.

### Implementation
Add conditional Home button for Standard Mode:
```typescript
{viewMode === 'standard' && (
  <button
    onClick={() => setViewMode('landing')}
    className="fixed bottom-6 left-6 z-50 p-3 bg-gradient-to-r from-blue-600 to-purple-600..."
  >
    <Home className="h-5 w-5" />
  </button>
)}
```

**Placement**: Bottom-left corner (doesn't conflict with chat interface)

## Step 6: Testing Checklist

### Canvas Mode Testing
- [ ] Open multiple windows of different types
- [ ] Drag windows to different positions
- [ ] Resize windows using corner handles
- [ ] Minimize/maximize windows
- [ ] Close windows
- [ ] Switch between windows (z-index ordering)
- [ ] Maximized windows don't cover toolbar
- [ ] Toolbar toggle works correctly

### Chat History Testing
- [ ] Create new chat sessions
- [ ] Session titles auto-generate correctly
- [ ] Pin/unpin sessions
- [ ] Delete sessions with confirmation
- [ ] Search functionality filters sessions
- [ ] Time-based grouping updates correctly
- [ ] Switch between sessions preserves messages
- [ ] Chat history persists after page reload

### Navigation Testing
- [ ] Home button works in Standard Mode
- [ ] Home button works in Canvas Mode
- [ ] Plus menu opens/closes correctly
- [ ] All window types can be created
- [ ] Toolbar toggle state persists during session

### Stacking Context Testing
- [ ] UI controls always visible on top
- [ ] Maximized windows never cover controls
- [ ] Multiple maximized windows layer correctly
- [ ] Portal rendering works on all browsers

## Step 7: Browser Compatibility

### SSR/Hydration Safety
All portal usage must check for document existence:
```typescript
typeof document !== 'undefined' && document && document.body ?
  createPortal(..., document.body) : null
```

### Cache Management
After major UI changes:
- Clear Vite cache: `rm -rf node_modules/.vite`
- Restart dev server
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)
- Test in incognito window to bypass all caching

## Step 8: Commit Strategy

After implementing Canvas Mode features:
```
feat: add chat history system and fix canvas UI controls overlay

- Implement multi-window canvas system with drag/drop and resize
- Add chat history with sessions, search, and pin functionality
- Fix maximized windows covering UI controls using React Portals
- Resolve stacking context issue with position: fixed
- Add toggleable toolbar in top-left corner
- Restore Home button for Standard Mode
- Persist chat sessions to localStorage per window
```

## Step 9: Performance Considerations

### Optimization Tips
- Lazy load chat history when sidebar opens
- Debounce window resize/drag events
- Use React.memo for window components
- Limit number of concurrent windows (8-10 max)
- Clean up event listeners on window close
- Throttle localStorage saves (use debounce)

### Memory Management
- Clear old chat sessions periodically
- Limit chat history message count per session
- Remove event listeners on component unmount
- Use WeakMap for window references where possible

## Summary

Canvas Mode provides a powerful multi-window workspace for document analysis and AI interaction. Key achievements:

✅ **Multi-Window System** - Flexible workspace with multiple concurrent windows
✅ **Chat History** - Persistent sessions with search and organization
✅ **Stacking Context Fix** - UI controls always accessible via React Portals
✅ **Compact Toolbar** - Space-efficient navigation in top-left corner
✅ **Full Navigation** - Home button available in both Standard and Canvas modes

The implementation uses modern React patterns (Portals, hooks) and CSS positioning techniques to create a seamless multi-window experience while maintaining proper UI layering.
```