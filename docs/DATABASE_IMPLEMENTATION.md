# Database Implementation — ResearchLens

## 1. Overview

ResearchLens uses PostgreSQL as its primary relational database and the pgvector extension to store and search vector embeddings.

The database stores research paper metadata, authors, topics, citations, user accounts, reading lists, and paper embeddings.

## 2. Database Tables

The database contains the following ten tables:

| Table | Purpose | Primary Key |
|---|---|---|
| users | Stores registered users and their roles | user_id |
| papers | Stores research paper metadata | paper_id |
| authors | Stores author information | author_id |
| paper_authors | Connects papers and authors | paper_id, author_id |
| topics | Stores research topics | topic_id |
| paper_topics | Connects papers and topics | paper_id, topic_id |
| citations | Stores citation relationships between papers | citing_paper_id, cited_paper_id |
| paper_embeddings | Stores vector representations of papers | paper_id |
| reading_lists | Stores user-created reading lists | reading_list_id |
| reading_list_papers | Connects reading lists and papers | reading_list_id, paper_id |

## 3. Keys and Relationships

- Each paper has a unique paper_id.
- Each author has a unique author_id.
- Each topic has a unique topic_id.
- A paper can have multiple authors, and an author can contribute to multiple papers. This many-to-many relationship is implemented using paper_authors.
- A paper can belong to multiple topics. This relationship is implemented using paper_topics.
- The citations table connects citing papers with cited papers.
- Each paper has an associated embedding in paper_embeddings.
- Each user can create multiple reading lists.
- Each reading list can contain multiple papers. This relationship is implemented using reading_list_papers.

Foreign keys maintain referential integrity between related tables.

## 4. Constraints and Data Integrity

The database uses the following constraints:

- PRIMARY KEY constraints uniquely identify records.
- FOREIGN KEY constraints maintain relationships between tables.
- NOT NULL constraints ensure required values are provided.
- UNIQUE constraints prevent duplicate values such as user email addresses and topic names.
- CHECK constraints validate publication years, user roles, and citation relationships.
- Composite primary keys prevent duplicate relationships in junction tables.
- ON DELETE CASCADE is used for selected dependent records.

The users table supports two roles:
- researcher
- admin

## 5. SQL Implementation

The SQL implementation is organized into the following files:

| File | Purpose |
|---|---|
| schema.sql | Creates database tables, keys, and constraints |
| seed.sql | Inserts initial sample records |
| extra_papers.sql | Inserts additional research papers and related data |
| dml_operations.sql | Demonstrates INSERT, SELECT, UPDATE, and DELETE |
| advanced_queries.sql | Contains nested, correlated, recursive, join, and CTE queries |
| views.sql | Creates the paper_summary view |
| functions.sql | Defines the search_papers_by_year function |
| triggers.sql | Defines the paper timestamp update trigger |

## 6. Advanced Database Concepts

### 6.1 Views

The paper_summary view combines paper information with author names, topics, and citation counts.

It simplifies access to information that would otherwise require multiple joins and aggregation operations.

### 6.2 Stored Function

The search_papers_by_year function retrieves papers within a specified publication-year range.

It validates the input range before executing the query.

### 6.3 Triggers

The trg_update_paper_timestamp trigger automatically updates the updated_at column whenever a paper record is modified.

### 6.4 Indexing

The database uses:

- B-tree indexes for structured lookups such as publication year.
- GIN indexes for full-text searching.
- HNSW indexing for efficient vector similarity search.

### 6.5 Full-Text Search

PostgreSQL full-text search indexes paper titles and abstracts using a GIN index.

This supports text-based searching of research paper content.

### 6.6 Nested and Correlated Queries

Nested queries use the result of one query inside another query.

Correlated queries refer to values from the outer query while evaluating the inner query.

### 6.7 Recursive CTE

A recursive Common Table Expression is used to traverse citation relationships between research papers.

It helps explore connected papers through multiple citation levels.

### 6.8 Window Functions

The project uses the RANK() window function to rank topics based on the number of associated papers.

## 7. Vector Database Implementation

ResearchLens uses PostgreSQL with the pgvector extension.

The paper_embeddings table stores:

- paper_id: Reference to the corresponding paper.
- embedding: A 384-dimensional vector.
- model_name: Name of the embedding model.
- embedded_at: Timestamp of embedding generation.

The project uses the sentence-transformers/all-MiniLM-L6-v2 model to generate embeddings.

The HNSW index uses vector_cosine_ops to support efficient cosine-distance similarity searches.

PostgreSQL remains the relational database; pgvector adds vector storage and similarity-search capabilities.

## 8. Vector Operations

The project demonstrates the following operations on vector records:

- INSERT: Add a paper embedding.
- READ: Retrieve stored embeddings and perform similarity searches.
- UPDATE: Modify embedding metadata.
- DELETE: Remove an embedding.

Temporary demonstration records are used inside a transaction and rolled back so that the original dataset remains unchanged.

## 9. Database and Backend Integration

The Python FastAPI backend connects to PostgreSQL using the database connection configuration stored in the environment file.

The backend provides API endpoints for:

- Semantic paper search.
- Topic retrieval.
- Authentication.
- Reading-list management.
- Citation network retrieval.
- Analytics.
- Administrative user management.

The Next.js frontend communicates with the backend through API routes.

## 10. Conclusion

The ResearchLens database combines relational data management, advanced SQL operations, full-text search, indexing, and vector similarity search.

These features support semantic research-paper discovery while maintaining structured metadata, relationships, and user-specific data.
