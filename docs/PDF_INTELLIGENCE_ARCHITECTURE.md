# PDF Intelligence Engine - Architecture & Design

## System Overview

The PDF Intelligence Engine is a **production-grade, scalable, asynchronous content processing system** that transforms raw PDFs into structured, AI-enhanced learning content.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PDF UPLOAD API (REST)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼──────────┐
                    │  File Storage     │
                    │  (AWS S3 / local) │
                    └────────┬──────────┘
                             │
                    ┌────────▼──────────────┐
                    │  Job Queue (BullMQ)   │
                    │  - Track status       │
                    │  - Retry logic        │
                    └────────┬──────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼──────┐    ┌────────▼────────┐  ┌──────▼──────┐
   │ EXTRACTION│    │    PARSING      │  │CLASSIFICATION
   │WORKER     │    │    WORKER       │  │  WORKER      │
   │           │    │                 │  │              │
   │ • PDF     │    │ • Structure     │  │• Rule-based  │
   │ • Text    │    │ • Blocks        │  │• AI-classify │
   │ • OCR     │    │ • Hierarchy     │  │• Tag content │
   └────┬──────┘    └────────┬────────┘  └──────┬───────┘
        │                    │                   │
        └────────────────────┼───────────────────┘
                             │
                    ┌────────▼──────────┐
                    │ AI ENHANCEMENT    │
                    │ WORKER            │
                    │                   │
                    │ • Summarize       │
                    │ • Generate MCQs   │
                    │ • Create cards    │
                    │ • Difficulty      │
                    └────────┬──────────┘
                             │
                    ┌────────▼──────────┐
                    │ TOPIC MAPPING     │
                    │ WORKER            │
                    │                   │
                    │ • Vector search   │
                    │ • Keyword match   │
                    │ • Map hierarchy   │
                    └────────┬──────────┘
                             │
                    ┌────────▼──────────────────┐
                    │   DATA STORAGE            │
                    │                           │
                    │ • Notes                   │
                    │ • Questions               │
                    │ • Flashcards              │
                    │ • Topics & Mappings       │
                    │ • Processing Logs         │
                    └────────┬──────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼──────┐    ┌────────▼────────┐  ┌──────▼──────┐
   │  NOTES    │    │   QUIZ ENGINE   │  │EXAM ENGINE  │
   │  MODULE   │    │                 │  │              │
   └───────────┘    └─────────────────┘  └──────────────┘
```

---

## 1. ARCHITECTURE LAYERS

### 1.1 API Layer
- **HTTP Endpoints** - REST API for uploads and status
- **Authentication** - JWT-based user identification
- **Validation** - File type, size, user quota checks
- **Response Formatting** - Standard JSON responses

### 1.2 Queue Layer
- **BullMQ/Redis** - Job queue for async processing
- **Job Scheduling** - Automatic worker assignment
- **Retry Logic** - Exponential backoff for failures
- **Status Tracking** - Real-time job progress

### 1.3 Worker Layer
- **Extraction Worker** - PDF text/OCR extraction
- **Parsing Worker** - Structure detection
- **Classification Worker** - Content categorization
- **AI Enhancement Worker** - LLM-powered features
- **Topic Mapping Worker** - Hierarchy assignment

### 1.4 Service Layer
- **StorageService** - File management
- **ExtractionService** - PDF parsing logic
- **ParsingService** - Block structuring
- **ClassificationService** - Content typing
- **AIService** - LLM integration
- **TopicMappingService** - Hierarchy mapping
- **DatabaseService** - Data persistence

### 1.5 Data Layer
- **Database** - MongoDB for structured data
- **Cache** - Redis for embeddings/results
- **File Storage** - S3 or local filesystem

---

## 2. PROCESSING PIPELINE

### Phase 1: Upload & Validation
```
Input: PDF file + user context
├─ Validate file (type, size, format)
├─ Check user quota
├─ Store file metadata
├─ Create job record
└─ Enqueue job → Queue
```

### Phase 2: Extraction
```
Input: File path
├─ Attempt digital PDF extraction (pdf-parse)
├─ If fails → OCR extraction (Tesseract)
├─ Split into pages
├─ Extract text + metadata
└─ Store extracted text
```

### Phase 3: Parsing
```
Input: Raw extracted text
├─ Detect content blocks
│  ├─ Headings (regex patterns)
│  ├─ Paragraphs (spacing, line breaks)
│  ├─ Lists (bullets, numbering)
│  ├─ Tables (cell detection)
│  ├─ Code blocks (indentation, syntax)
│  └─ Formulas (LaTeX patterns)
├─ Maintain hierarchy
├─ Preserve page references
└─ Create block structure
```

### Phase 4: Classification
```
Input: Structured blocks
├─ Rule-based detection
│  ├─ MCQ pattern: "A) B) C) D)"
│  ├─ Question pattern: "What/Why/How + ?"
│  ├─ Definition pattern: "X is defined as"
│  └─ Code pattern: code syntax
├─ AI classification (LLM)
│  ├─ For ambiguous blocks
│  └─ Confidence scoring
├─ Tag content type
└─ Store classification
```

### Phase 5: AI Enhancement
```
Input: Classified content
├─ For each content block:
│  ├─ Generate summary (concise)
│  ├─ Generate explanation (detailed)
│  ├─ Extract key points
│  ├─ Create flashcards (Q/A)
│  ├─ Generate MCQs (if text)
│  └─ Assign difficulty
├─ Batch LLM calls
└─ Cache results
```

### Phase 6: Topic Mapping
```
Input: Enhanced content
├─ Extract keywords
├─ Vector search against topics DB
├─ Keyword matching algorithm
├─ AI classification fallback
├─ Map to Subject → Chapter → Topic
└─ Create content-topic links
```

### Phase 7: Storage & Routing
```
Input: Fully processed content
├─ Store in database
│  ├─ Notes table
│  ├─ Questions table
│  ├─ Flashcards table
│  └─ Topic mappings
├─ Route to modules
│  ├─ Notes → Notes Module
│  ├─ MCQs → Quiz Module
│  └─ Questions → Exam Module
└─ Update job status → COMPLETED
```

---

## 3. DATA SCHEMAS

### PdfUpload
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  filename: String,
  originalName: String,
  fileSize: Number,
  fileType: String,
  cloudUrl: String,
  uploadedAt: Date,
  
  // Processing status
  status: String, // queued, extracting, parsing, classifying, enhancing, mapping, completed, failed
  currentStage: String,
  progress: Number, // 0-100
  
  // Extraction data
  pageCount: Number,
  rawExtractedText: String,
  textBlocks: [
    {
      type: String,
      content: String,
      pageNumber: Number,
      blockIndex: Number
    }
  ],
  
  // Processing metadata
  processingStartedAt: Date,
  completedAt: Date,
  errorLog: [String],
  
  // Subject context
  suggestedSubject: String,
  suggestedChapter: String
}
```

### ContentBlock
```javascript
{
  _id: ObjectId,
  pdfUploadId: ObjectId,
  userId: ObjectId,
  
  // Block structure
  type: String, // heading, paragraph, list, table, code, formula, question
  rawContent: String,
  cleanedContent: String,
  hierarchy: {
    level: Number, // 1-6 for headings
    parent: ObjectId // parent block
  },
  
  // Location
  pageNumber: Number,
  blockIndex: Number,
  
  // Classification
  classification: {
    category: String, // notes, mcq, question, formula, code, definition, table
    confidence: Number, // 0-1
    method: String, // rule-based, ai-based
  },
  
  // AI Enhancement
  enhancements: {
    summary: String,
    detailedExplanation: String,
    keyPoints: [String],
    difficulty: String, // easy, medium, hard
    generatedMCQs: [ObjectId], // refs to MCQ docs
    flashcards: [ObjectId] // refs to Flashcard docs
  },
  
  // Topic Mapping
  topicMapping: {
    subject: String,
    chapter: String,
    topic: String,
    confidence: Number
  },
  
  createdAt: Date
}
```

### ProcessedNote
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  contentBlockId: ObjectId,
  pdfUploadId: ObjectId,
  
  title: String,
  content: String,
  summary: String,
  keyPoints: [String],
  
  topicMapping: {
    subject: String,
    chapter: String,
    topic: String
  },
  
  source: String, // pdf-upload
  difficulty: String,
  
  createdAt: Date
}
```

### ProcessedMCQ
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  contentBlockId: ObjectId,
  pdfUploadId: ObjectId,
  
  question: String,
  options: [String],
  correctAnswer: Number,
  explanation: String,
  difficulty: String,
  
  topicMapping: {
    subject: String,
    chapter: String,
    topic: String
  },
  
  source: String, // rule-based, ai-generated, extracted
  
  createdAt: Date
}
```

### Flashcard
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  contentBlockId: ObjectId,
  pdfUploadId: ObjectId,
  
  question: String,
  answer: String,
  explanation: String,
  
  topicMapping: {
    subject: String,
    chapter: String,
    topic: String
  },
  
  difficulty: String,
  reviewCount: Number,
  lastReviewedAt: Date,
  
  createdAt: Date
}
```

---

## 4. SERVICE ARCHITECTURE

```
Services/
├── extractionService.js      # PDF → Text conversion
├── parsingService.js          # Text → Blocks
├── classificationService.js   # Blocks → Categories
├── aiService.js               # LLM integration
├── topicMappingService.js     # Content → Topics
├── storageService.js          # File management
└── databaseService.js         # DB operations
```

---

## 5. WORKER IMPLEMENTATION

Each worker is a BullMQ job consumer that processes jobs in sequence:

```
Worker Flow:
├─ Listen to job queue
├─ Fetch job details
├─ Execute processing step
├─ Update job progress
├─ Pass to next worker (or complete)
├─ Handle errors (retry/log)
└─ Loop
```

Workers can run on multiple instances for horizontal scaling.

---

## 6. ERROR HANDLING STRATEGY

```
Try → Fail → Log → Retry (with backoff) → Final Fail → Mark as FAILED
     ├─ Extraction fail: Mark bad PDF, log error
     ├─ Parsing fail: Use raw text fallback
     ├─ Classification fail: Use AI-only method
     ├─ AI fail: Use heuristic fallback
     └─ Storage fail: Retry with exponential backoff
```

**Retry Policy:**
- Attempt 1: Immediate
- Attempt 2: 60s delay
- Attempt 3: 300s delay
- Attempt 4: 900s delay
- After 4 attempts: Mark as failed

---

## 7. PERFORMANCE OPTIMIZATION

### Chunking Strategy
- Process large PDFs page-by-page
- Max chunk size: 5MB of text
- Parallel processing of independent chunks

### Caching
- Cache embeddings in Redis
- Cache topic mappings
- Cache LLM responses (same input → same output)

### Batching
- Batch LLM API calls (multiple blocks in one request)
- Reduce API latency
- Lower cost

### Streaming
- Stream intermediate results to client
- User sees progress in real-time
- Faster feedback

---

## 8. SCALABILITY

### Horizontal Scaling
```
Load Balancer
    ├─ API Instance 1
    ├─ API Instance 2
    └─ API Instance N

Queue (Redis)
    ├─ Extraction Worker Pool (N instances)
    ├─ Parsing Worker Pool (N instances)
    ├─ Classification Worker Pool (N instances)
    ├─ AI Worker Pool (N instances)
    └─ Topic Worker Pool (N instances)

Database (MongoDB)
    └─ Indexes on userId, pdfUploadId, topic
```

### Rate Limiting
- Per-user quotas (files/month)
- API endpoint rate limiting
- LLM API rate limiting

---

## 9. OUTPUT STRUCTURE

Final API response:

```json
{
  "pdfUpload": {
    "_id": "...",
    "filename": "chapter1.pdf",
    "status": "completed",
    "pageCount": 25
  },
  "processedContent": {
    "notes": [...],
    "mcqs": [...],
    "flashcards": [...],
    "topics": [...]
  },
  "stats": {
    "totalBlocks": 150,
    "notesCount": 45,
    "mcqCount": 52,
    "flashcardsCount": 28,
    "processingTimeMs": 45000
  }
}
```

---

## 10. BEST PRACTICES

1. **Idempotency** - Same job input → same output (safe retries)
2. **Monitoring** - Track processing metrics per stage
3. **Logging** - Detailed logs for debugging
4. **Circuit Breaker** - Graceful degradation on API failures
5. **Validation** - Validate at each stage
6. **Testing** - Unit tests for each service
7. **Documentation** - API docs + architecture
8. **Security** - Validate uploads, sanitize content
9. **Privacy** - Encrypt sensitive content, GDPR compliance
10. **Cost Optimization** - Batch requests, cache results

---

## 11. TECHNOLOGY STACK

- **Runtime:** Node.js 18+
- **Framework:** Next.js 16+
- **Queue:** BullMQ + Redis
- **Database:** MongoDB
- **Storage:** AWS S3 / Local filesystem
- **PDF Processing:** pdf-parse, Tesseract OCR
- **Vector DB:** Pinecone / Weaviate (optional)
- **LLM:** Google Gemini / OpenAI GPT
- **Caching:** Redis
- **Monitoring:** Winston logs + external service (Sentry)

---

## 12. IMPLEMENTATION ROADMAP

**Phase 1:** Core Infrastructure (Week 1)
- Job queue setup
- API endpoints
- Database schemas

**Phase 2:** Extraction & Parsing (Week 2)
- PDF extraction
- Text structuring
- Block detection

**Phase 3:** Classification & AI (Week 3)
- Rule-based classification
- AI enhancement
- MCQ generation

**Phase 4:** Topic Mapping & Storage (Week 4)
- Topic hierarchy integration
- Data persistence
- Module routing

**Phase 5:** Optimization & Scaling (Week 5)
- Performance tuning
- Error handling
- Monitoring

