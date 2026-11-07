# ResearchLens — Technology Justification

## 1. Project Overview

ResearchLens is a research paper discovery and knowledge mapping platform. It helps students and researchers discover papers that are semantically related to their research interests.

Traditional keyword-based search may fail to identify relevant papers when they use different terminology. ResearchLens addresses this limitation using semantic search powered by machine learning embeddings and vector similarity.

## 2. Technology Stack

### 2.1 PostgreSQL

**Purpose:** Primary relational database.

**Why it was selected:**
- Provides reliable relational data storage.
- Supports primary keys, foreign keys, unique constraints and check constraints.
- Supports complex SQL queries, joins, nested queries and recursive CTEs.
- Provides transactions, views, functions and triggers.
- Maintains data integrity through relational constraints.

**Usage in ResearchLens:** Stores users, research papers, authors, topics, citations, reading lists and their relationships.

### 2.2 pgvector

**Purpose:** Vector storage and similarity search extension for PostgreSQL.

**Why it was selected:**
- Stores high-dimensional numerical embeddings.
- Supports cosine-distance-based similarity search.
- Integrates vector operations directly into PostgreSQL.
- Supports HNSW indexing for efficient approximate nearest-neighbour search.

**Usage in ResearchLens:** Stores 384-dimensional paper embeddings generated using Sentence Transformers and retrieves semantically similar research papers.

**Important:** pgvector extends PostgreSQL with vector capabilities. It is not a separate NoSQL database.

### 2.3 Python

**Purpose:** Backend processing and machine learning integration.

**Why it was selected:**
- Provides libraries for machine learning and natural language processing.
- Integrates easily with PostgreSQL.
- Supports embedding generation and similarity-search workflows.
- Allows backend logic to be separated from the frontend.

**Usage in ResearchLens:** Handles paper embedding generation, database operations and semantic search processing.

### 2.4 Sentence Transformers

**Purpose:** Generate semantic embeddings from research paper text.

**Model used:** `sentence-transformers/all-MiniLM-L6-v2`

**Why it was selected:**
- Converts text into numerical vector representations.
- Captures semantic relationships between sentences and documents.
- Produces compact 384-dimensional embeddings.
- Supports efficient semantic similarity comparison.

**Usage in ResearchLens:** Converts research paper information and user search queries into embeddings for semantic retrieval.

### 2.5 FastAPI

**Purpose:** Python backend API framework.

**Why it was selected:**
- Provides a lightweight framework for building REST APIs.
- Supports request validation using Pydantic.
- Supports authentication and role-based access control through dependencies.
- Provides automatic API documentation.
- Integrates with Python machine learning libraries.

**Usage in ResearchLens:** Exposes endpoints for semantic search, authentication, reading lists, analytics, citation networks and administrative operations.

### 2.6 Next.js

**Purpose:** Frontend application framework.

**Why it was selected:**
- Supports React-based interactive interfaces.
- Provides file-based routing through the App Router.
- Supports frontend and server-side API routes.
- Integrates well with TypeScript.
- Makes it easier to build a structured, maintainable web application.

**Usage in ResearchLens:** Provides the user interface for searching papers, viewing results, managing reading lists, exploring citation networks and accessing analytics and administration features.

### 2.7 TypeScript

**Purpose:** Type-safe frontend development.

**Why it was selected:**
- Detects many programming errors during development.
- Provides type checking and better code maintainability.
- Improves code completion and developer experience.

**Usage in ResearchLens:** Used to implement the Next.js frontend and API route logic.

### 2.8 Tailwind CSS

**Purpose:** Frontend styling.

**Why it was selected:**
- Provides utility-based styling.
- Enables consistent interface design.
- Reduces the need to maintain large custom CSS files.
- Supports responsive layouts.

**Usage in ResearchLens:** Used to style the dashboard, search interface, paper cards, authentication pages and analytics views.

## 3. Overall Architecture

ResearchLens follows a layered architecture:

1. **Presentation Layer:** Next.js and TypeScript provide the user interface.
2. **API Layer:** Next.js API routes proxy frontend requests to the Python backend.
3. **Application Layer:** FastAPI handles business logic, authentication, validation and semantic search.
4. **Machine Learning Layer:** Sentence Transformers generates embeddings from paper text and search queries.
5. **Data Layer:** PostgreSQL stores relational information, while pgvector stores and searches vector embeddings.

## 4. Why This Technology Combination?

The technologies were selected to combine relational database management with semantic information retrieval.

PostgreSQL ensures structured storage and data integrity, while pgvector enables similarity-based retrieval. Sentence Transformers provides semantic representations of research papers. FastAPI connects the machine learning and database components through APIs, and Next.js provides an interactive web interface.

This combination allows ResearchLens to support both conventional database operations and semantic paper discovery within one integrated application.

## 5. Conclusion

The selected technologies provide a practical and scalable foundation for ResearchLens. The architecture combines relational database features, vector similarity search, machine learning-based text processing, REST API integration and a modern web interface to improve research paper discovery.
