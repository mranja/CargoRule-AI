# CargoRule AI

CargoRule AI is an AI-powered logistics compliance assistant that helps operations teams quickly identify the correct customs regulations, shipping policies, and carrier agreements for a specific shipment.

The application uses Retrieval-Augmented Generation (RAG) to retrieve relevant information from approved logistics documents and generate source-backed answers using an OpenAI-compatible API.

## Problem Statement

Logistics companies store large amounts of:

- Customs regulations
- Shipping policies
- Carrier agreements
- Import/export requirements
- Country-specific restrictions
- Documentation requirements

However, operations staff cannot reliably determine the correct rule for a specific shipment because information is spread across multiple documents and differs by country and carrier.

Manual searching is time-consuming and can lead to incorrect interpretation of policies.

## Solution

CargoRule AI provides a centralized platform where users can:

- Upload logistics documents
- Process and index documents
- Search using natural language
- Retrieve relevant regulations
- Generate AI-powered answers
- View the sources used for each answer
- Filter results by country and carrier

## Features

### Document Management

- Upload logistics documents
- Store document metadata
- Process and index documents
- Track document processing status
- Manage documents

### AI-Powered Question Answering

Users can ask questions such as:

- What documents are required to ship electronics from India to Germany?
- Can lithium batteries be shipped using Carrier X?
- What are the import requirements for Germany?

### RAG-Based Retrieval

The system retrieves relevant information from the company's approved documents before generating an answer.

```
User Question
      ↓
Question Embedding
      ↓
Vector Search
      ↓
Relevant Document Chunks
      ↓
RAG Context
      ↓
OpenAI-Compatible API
      ↓
Answer + Sources
```

### Source Attribution

Every AI-generated answer displays the relevant documents or sections used to generate the response.

### Filters

Users can filter information based on:

- Country
- Carrier
- Document Type
- Effective Date

### Query History

Users can view previous questions, answers, and sources.

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- Express.js
- TypeScript

### AI

- OpenAI-compatible API
- Embeddings
- Retrieval-Augmented Generation (RAG)

### Vector Database

- Vector database for storing document embeddings and metadata

### Tools

- Git
- GitHub
- npm

## System Architecture

```
                    ┌────────────────────┐
                    │      Next.js       │
                    │     Frontend       │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ TypeScript Backend │
                    │     Express.js     │
                    └─────────┬──────────┘
                              │
               ┌──────────────┴──────────────┐
               │                             │
               ▼                             ▼
      ┌──────────────────┐          ┌──────────────────┐
      │ Document         │          │ RAG Query        │
      │ Processing       │          │ Pipeline         │
      └────────┬─────────┘          └────────┬─────────┘
               │                             │
               ▼                             ▼
      ┌──────────────────┐          ┌──────────────────┐
      │ Text Extraction  │          │ Query Embedding  │
      │ + Chunking       │          └────────┬─────────┘
      └────────┬─────────┘                   │
               ▼                             │
      ┌──────────────────┐                   │
      │    Embeddings    │                   │
      └────────┬─────────┘                   │
               │                             │
               └──────────────┬──────────────┘
                              ▼
                    ┌────────────────────┐
                    │  Vector Database   │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Relevant Documents │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ OpenAI-Compatible  │
                    │       API          │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Answer + Sources   │
                    └────────────────────┘
```

## RAG Pipeline

### Document Ingestion

```
Document Upload
      ↓
Text Extraction
      ↓
Text Cleaning
      ↓
Chunking
      ↓
Embedding Generation
      ↓
Vector Database
```

### Question Answering

```
User Question
      ↓
Question Embedding
      ↓
Similarity Search
      ↓
Relevant Chunks
      ↓
Context Construction
      ↓
LLM
      ↓
Answer + Sources
```

## Project Structure

```
CargoRule-AI/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── config/
│   │   ├── types/
│   │   └── server.ts
│   │
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

## Team

| Member  | Role                              | Responsibilities                                                        |
|---------|-----------------------------------|---------------------------------------------------------------------------|
| Ranjan  | Frontend & Product Integration Lead | Next.js, TypeScript UI, dashboard, query interface, API integration     |
| Jaswa   | AI / RAG Engineer                 | Embeddings, chunking, retrieval, RAG pipeline, prompt engineering       |
| Rafeeq  | Backend & Vector Engineer         | Express.js APIs, vector database, metadata, authentication, backend      |

## Getting Started

### Clone the Repository

```bash
git clone <repository-url>
cd CargoRule-AI
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

### Backend

Open another terminal:

```bash
cd backend
npm install
npm run dev
```

## Environment Variables

### Backend `.env`

```
PORT=5000

OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=your_openai_compatible_base_url
EMBEDDING_MODEL=your_embedding_model

VECTOR_DB_URL=your_vector_database_url
VECTOR_DB_API_KEY=your_vector_database_api_key
```

### Frontend `.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> Never commit `.env` or `.env.local` files to GitHub.

## Example Use Case

**Question**

> Can I ship lithium batteries from India to Germany using Carrier X?

**Processing**

The system retrieves relevant:

- Germany customs regulations
- Carrier X agreements
- Dangerous goods policies
- Lithium battery shipping requirements

The retrieved information is provided to the LLM as context.

**Response**

Answer:

> The shipment may be permitted subject to the applicable packaging, labeling, documentation, and dangerous-goods requirements.

Sources:

- Germany Customs Regulation
- Carrier X Shipping Agreement
- Dangerous Goods Policy

## AI Grounding

CargoRule AI answers questions using information retrieved from the approved document collection.

When relevant information cannot be found, the system does not invent an answer. Example:

> I could not find sufficient information in the available documents to determine the applicable shipping requirement.

## Functional Requirements

- Document upload
- Document processing
- Text extraction
- Text chunking
- Embedding generation
- Vector storage
- Semantic search
- RAG-based question answering
- Source attribution
- Country filtering
- Carrier filtering
- Document management
- Query history
- Authentication

## Non-Functional Requirements

- Secure API key management
- Fast query response
- Scalable document storage
- Reliable error handling
- Maintainable TypeScript codebase
- Accurate source-based answers
- Responsive user interface

## Success Criteria

CargoRule AI should allow users to:

- Upload logistics documents
- Search regulations using natural language
- Retrieve relevant information
- Receive source-backed AI answers
- Filter results by country and carrier
- View previous queries
- Manage documents
- Handle cases where relevant information is unavailable

## License

This project is developed for educational and project purposes.