BEGIN;

-- Sample research papers
INSERT INTO papers (title, abstract, publication_year, doi, url)
VALUES
(
    'Attention Is All You Need',
    'Introduces the Transformer architecture, using self-attention mechanisms for sequence modeling without recurrent neural networks.',
    2017,
    '10.48550/arXiv.1706.03762',
    'https://arxiv.org/abs/1706.03762'
),
(
    'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    'Presents BERT, a language representation model that learns bidirectional context through pre-training and can be fine-tuned for language tasks.',
    2018,
    '10.48550/arXiv.1810.04805',
    'https://arxiv.org/abs/1810.04805'
),
(
    'Deep Residual Learning for Image Recognition',
    'Introduces residual connections that enable the training of very deep neural networks for image recognition.',
    2015,
    '10.1109/CVPR.2016.90',
    'https://doi.org/10.1109/CVPR.2016.90'
),
(
    'A Survey on Knowledge Graphs',
    'Reviews knowledge graph representation, construction, reasoning, and applications for connecting structured information.',
    2021,
    '10.1007/s11280-020-00811-8',
    'https://doi.org/10.1007/s11280-020-00811-8'
),
(
    'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    'Combines a retriever with a language generator to improve knowledge-intensive natural language processing tasks.',
    2020,
    '10.48550/arXiv.2005.11401',
    'https://arxiv.org/abs/2005.11401'
);

-- Sample authors
INSERT INTO authors (author_name, affiliation)
VALUES
('Ashish Vaswani', 'Google'),
('Jacob Devlin', 'Google'),
('Kaiming He', 'Microsoft Research'),
('Aidan Hogan', 'Universidad de Chile'),
('Patrick Lewis', 'Facebook AI Research');

-- Connect authors to papers
INSERT INTO paper_authors (paper_id, author_id, author_order)
SELECT p.paper_id, a.author_id, x.author_order
FROM (
    VALUES
        ('Attention Is All You Need', 'Ashish Vaswani', 1),
        ('BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', 'Jacob Devlin', 1),
        ('Deep Residual Learning for Image Recognition', 'Kaiming He', 1),
        ('A Survey on Knowledge Graphs', 'Aidan Hogan', 1),
        ('Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', 'Patrick Lewis', 1)
) AS x(paper_title, author_name, author_order)
JOIN papers p ON p.title = x.paper_title
JOIN authors a ON a.author_name = x.author_name;

-- Sample research topics
INSERT INTO topics (topic_name, description)
VALUES
('Natural Language Processing', 'Methods for processing and understanding human language.'),
('Deep Learning', 'Machine learning using neural networks with multiple layers.'),
('Computer Vision', 'Methods for interpreting and analyzing visual information.'),
('Knowledge Graphs', 'Structured representations of entities and their relationships.'),
('Information Retrieval', 'Finding relevant information from large collections of data.');

-- Connect papers to topics
INSERT INTO paper_topics (paper_id, topic_id)
SELECT p.paper_id, t.topic_id
FROM (
    VALUES
        ('Attention Is All You Need', 'Natural Language Processing'),
        ('Attention Is All You Need', 'Deep Learning'),
        ('BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', 'Natural Language Processing'),
        ('BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', 'Deep Learning'),
        ('Deep Residual Learning for Image Recognition', 'Computer Vision'),
        ('Deep Residual Learning for Image Recognition', 'Deep Learning'),
        ('A Survey on Knowledge Graphs', 'Knowledge Graphs'),
        ('Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', 'Information Retrieval'),
        ('Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', 'Natural Language Processing')
) AS x(paper_title, topic_name)
JOIN papers p ON p.title = x.paper_title
JOIN topics t ON t.topic_name = x.topic_name;

-- Sample citation relationships
INSERT INTO citations (citing_paper_id, cited_paper_id)
SELECT citing.paper_id, cited.paper_id
FROM (
    VALUES
        (
            'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
            'Attention Is All You Need'
        ),
        (
            'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
            'Attention Is All You Need'
        ),
        (
            'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
            'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding'
        )
) AS x(citing_title, cited_title)
JOIN papers citing ON citing.title = x.citing_title
JOIN papers cited ON cited.title = x.cited_title;

COMMIT;
