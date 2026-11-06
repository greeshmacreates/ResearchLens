-- ResearchLens database schema
-- PostgreSQL 17 + pgvector

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Users
CREATE TABLE users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'researcher'
        CHECK (role IN ('admin', 'researcher')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Research papers
CREATE TABLE papers (
    paper_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    abstract TEXT,
    publication_year INTEGER
        CHECK (publication_year BETWEEN 1500 AND 2100),
    doi VARCHAR(255) UNIQUE,
    url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Authors
CREATE TABLE authors (
    author_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    author_name VARCHAR(200) NOT NULL,
    affiliation TEXT
);

-- 4. Many-to-many relationship between papers and authors
CREATE TABLE paper_authors (
    paper_id BIGINT NOT NULL REFERENCES papers(paper_id)
        ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES authors(author_id)
        ON DELETE CASCADE,
    author_order INTEGER NOT NULL DEFAULT 1 CHECK (author_order > 0),
    PRIMARY KEY (paper_id, author_id),
    UNIQUE (paper_id, author_order)
);

-- 5. Research topics
CREATE TABLE topics (
    topic_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    topic_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT
);

-- 6. Many-to-many relationship between papers and topics
CREATE TABLE paper_topics (
    paper_id BIGINT NOT NULL REFERENCES papers(paper_id)
        ON DELETE CASCADE,
    topic_id BIGINT NOT NULL REFERENCES topics(topic_id)
        ON DELETE CASCADE,
    PRIMARY KEY (paper_id, topic_id)
);

-- 7. Citations between papers
CREATE TABLE citations (
    citing_paper_id BIGINT NOT NULL REFERENCES papers(paper_id)
        ON DELETE CASCADE,
    cited_paper_id BIGINT NOT NULL REFERENCES papers(paper_id)
        ON DELETE CASCADE,
    PRIMARY KEY (citing_paper_id, cited_paper_id),
    CHECK (citing_paper_id <> cited_paper_id)
);

-- 8. Paper embeddings for semantic similarity search
-- Vector dimension will be fixed after we choose the embedding model.
CREATE TABLE paper_embeddings (
    paper_id BIGINT PRIMARY KEY REFERENCES papers(paper_id)
        ON DELETE CASCADE,
    embedding VECTOR,
    model_name VARCHAR(150) NOT NULL,
    embedded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Reading lists owned by users
CREATE TABLE reading_lists (
    reading_list_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id)
        ON DELETE CASCADE,
    list_name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, list_name)
);

-- 10. Papers saved to reading lists
CREATE TABLE reading_list_papers (
    reading_list_id BIGINT NOT NULL
        REFERENCES reading_lists(reading_list_id) ON DELETE CASCADE,
    paper_id BIGINT NOT NULL REFERENCES papers(paper_id)
        ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (reading_list_id, paper_id)
);

-- Indexes to speed up common lookups and joins
CREATE INDEX idx_papers_publication_year ON papers(publication_year);
CREATE INDEX idx_papers_title ON papers USING GIN (to_tsvector('english', title));
CREATE INDEX idx_authors_name ON authors(author_name);
CREATE INDEX idx_paper_authors_author ON paper_authors(author_id);
CREATE INDEX idx_paper_topics_topic ON paper_topics(topic_id);
CREATE INDEX idx_citations_cited ON citations(cited_paper_id);
CREATE INDEX idx_reading_lists_user ON reading_lists(user_id);
CREATE INDEX idx_reading_list_papers_paper ON reading_list_papers(paper_id);
