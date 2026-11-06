BEGIN;

-- Add additional research papers.
-- Existing papers are preserved; duplicate DOIs are skipped.

INSERT INTO papers (title, abstract, publication_year, doi, url)
VALUES
(
    'Deep Learning',
    'A comprehensive review of deep learning methods, architectures, applications, and challenges in machine learning.',
    2015,
    '10.1038/nature14539',
    'https://doi.org/10.1038/nature14539'
),
(
    'ImageNet Classification with Deep Convolutional Neural Networks',
    'Demonstrates how deep convolutional neural networks can classify large-scale image datasets effectively.',
    2012,
    '10.1145/3065386',
    'https://doi.org/10.1145/3065386'
),
(
    'You Only Look Once: Unified, Real-Time Object Detection',
    'Presents an object detection system that predicts bounding boxes and class probabilities in a single evaluation.',
    2016,
    '10.1109/CVPR.2016.91',
    'https://doi.org/10.1109/CVPR.2016.91'
),
(
    'U-Net: Convolutional Networks for Biomedical Image Segmentation',
    'Introduces a U-shaped convolutional network for biomedical image segmentation with limited training data.',
    2015,
    '10.1007/978-3-319-24574-4_28',
    'https://doi.org/10.1007/978-3-319-24574-4_28'
),
(
    'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale',
    'Applies transformer architectures directly to image patches for image classification.',
    2021,
    '10.48550/arXiv.2010.11929',
    'https://arxiv.org/abs/2010.11929'
),
(
    'Language Models are Few-Shot Learners',
    'Studies large autoregressive language models and their ability to perform tasks from a few examples.',
    2020,
    '10.48550/arXiv.2005.14165',
    'https://arxiv.org/abs/2005.14165'
),
(
    'Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer',
    'Introduces the T5 framework, treating diverse natural language processing tasks as text-to-text problems.',
    2020,
    '10.48550/arXiv.1910.10683',
    'https://arxiv.org/abs/1910.10683'
),
(
    'RoBERTa: A Robustly Optimized BERT Pretraining Approach',
    'Investigates training choices that improve BERT performance, including data, training duration, and masking.',
    2019,
    '10.48550/arXiv.1907.11692',
    'https://arxiv.org/abs/1907.11692'
),
(
    'Improving Language Understanding by Generative Pre-Training',
    'Explores generative pre-training of language representations followed by task-specific fine-tuning.',
    2018,
    '10.48550/arXiv.1801.06146',
    'https://arxiv.org/abs/1801.06146'
),
(
    'Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks',
    'Presents a method for producing semantically meaningful sentence embeddings for similarity and clustering.',
    2019,
    '10.48550/arXiv.1908.10084',
    'https://arxiv.org/abs/1908.10084'
),
(
    'Efficient Estimation of Word Representations in Vector Space',
    'Introduces efficient neural approaches for learning continuous vector representations of words.',
    2013,
    '10.48550/arXiv.1301.3781',
    'https://arxiv.org/abs/1301.3781'
),
(
    'Distributed Representations of Words and Phrases and their Compositionality',
    'Improves word representations and introduces techniques for learning phrase representations.',
    2013,
    '10.48550/arXiv.1310.4546',
    'https://arxiv.org/abs/1310.4546'
),
(
    'The Anatomy of a Large-Scale Hypertextual Web Search Engine',
    'Describes the architecture of Google and its PageRank-based approach to ranking web pages.',
    1998,
    '10.1016/S0169-7552(98)00110-X',
    'https://doi.org/10.1016/S0169-7552(98)00110-X'
),
(
    'Learning to Rank for Information Retrieval',
    'Reviews machine learning approaches for ranking documents in information retrieval systems.',
    2009,
    '10.1561/1500000016',
    'https://doi.org/10.1561/1500000016'
),
(
    'BM25 and Beyond: Recent Advances in Information Retrieval',
    'Discusses probabilistic document ranking and improvements to traditional text retrieval techniques.',
    2011,
    '10.1561/1500000019',
    'https://doi.org/10.1561/1500000019'
),
(
    'Dense Passage Retrieval for Open-Domain Question Answering',
    'Introduces dense vector representations for retrieving passages relevant to natural language questions.',
    2020,
    '10.48550/arXiv.2004.04906',
    'https://arxiv.org/abs/2004.04906'
),
(
    'TransE: Translating Embeddings for Modeling Multi-relational Data',
    'Models relationships in knowledge graphs as translations between entity embeddings.',
    2013,
    '10.1007/978-3-642-41335-3_5',
    'https://doi.org/10.1007/978-3-642-41335-3_5'
),
(
    'Knowledge Graphs',
    'Surveys the concepts, construction, representation, and applications of knowledge graphs.',
    2021,
    '10.1007/s10115-020-01440-7',
    'https://doi.org/10.1007/s10115-020-01440-7'
),
(
    'A Survey on Knowledge Graphs: Representation, Acquisition, and Applications',
    'Reviews knowledge graph representation learning, construction, and applications across domains.',
    2022,
    '10.1109/TNNLS.2021.3070843',
    'https://doi.org/10.1109/TNNLS.2021.3070843'
),
(
    'Deep Residual Learning and Convolutional Neural Networks',
    'Discusses residual learning and convolutional neural network techniques for visual recognition.',
    2016,
    '10.48550/arXiv.1512.03385',
    'https://arxiv.org/abs/1512.03385'
)
ON CONFLICT DO NOTHING;

-- Add authors for the additional papers.
-- Existing author names are reused.

INSERT INTO authors (author_name, affiliation)
VALUES
    ('Yann LeCun', 'New York University'),
    ('Alex Krizhevsky', 'University of Toronto'),
    ('Ilya Sutskever', 'OpenAI'),
    ('Joseph Redmon', 'University of Washington'),
    ('Olaf Ronneberger', 'University of Freiburg'),
    ('Alexey Dosovitskiy', 'Google Research'),
    ('Tom Brown', 'OpenAI'),
    ('Colin Raffel', 'Google Research'),
    ('Yinhan Liu', 'Facebook AI'),
    ('Alec Radford', 'OpenAI'),
    ('Nils Reimers', 'Independent Researcher'),
    ('Tomas Mikolov', 'Google'),
    ('Sergey Brin', 'Stanford University'),
    ('Lawrence Page', 'Stanford University'),
    ('Christopher Manning', 'Stanford University'),
    ('Kenton Lee', 'Google Research'),
    ('Patrick Lewis', 'Facebook AI Research'),
    ('Antoine Bordes', 'Facebook AI Research'),
    ('Denny Vrandečić', 'Wikimedia Deutschland'),
    ('Aidan Hogan', 'Universidad de Chile'),
    ('Kaiming He', 'Microsoft Research')
ON CONFLICT DO NOTHING;

-- Connect new papers to authors.
INSERT INTO paper_authors (paper_id, author_id, author_order)
SELECT p.paper_id, a.author_id, 1
FROM (
    VALUES
        ('ImageNet Classification with Deep Convolutional Neural Networks', 'Alex Krizhevsky'),
        ('You Only Look Once: Unified, Real-Time Object Detection', 'Joseph Redmon'),
        ('U-Net: Convolutional Networks for Biomedical Image Segmentation', 'Olaf Ronneberger'),
        ('An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale', 'Alexey Dosovitskiy'),
        ('Language Models are Few-Shot Learners', 'Tom Brown'),
        ('Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer', 'Colin Raffel'),
        ('RoBERTa: A Robustly Optimized BERT Pretraining Approach', 'Yinhan Liu'),
        ('Improving Language Understanding by Generative Pre-Training', 'Alec Radford'),
        ('Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks', 'Nils Reimers'),
        ('Efficient Estimation of Word Representations in Vector Space', 'Tomas Mikolov'),
        ('Distributed Representations of Words and Phrases and their Compositionality', 'Tomas Mikolov'),
        ('The Anatomy of a Large-Scale Hypertextual Web Search Engine', 'Sergey Brin'),
        ('Learning to Rank for Information Retrieval', 'Christopher Manning'),
        ('BM25 and Beyond: Recent Advances in Information Retrieval', 'Christopher Manning'),
        ('Dense Passage Retrieval for Open-Domain Question Answering', 'Patrick Lewis'),
        ('TransE: Translating Embeddings for Modeling Multi-relational Data', 'Antoine Bordes'),
        ('A Survey on Knowledge Graphs: Representation, Acquisition, and Applications', 'Aidan Hogan')
) AS x(paper_title, author_name)
JOIN papers p ON p.title = x.paper_title
JOIN authors a ON a.author_name = x.author_name
ON CONFLICT DO NOTHING;

-- Assign topics to the additional papers.
INSERT INTO paper_topics (paper_id, topic_id)
SELECT p.paper_id, t.topic_id
FROM (
    VALUES
        ('Deep Learning', 'Deep Learning'),
        ('ImageNet Classification with Deep Convolutional Neural Networks', 'Computer Vision'),
        ('ImageNet Classification with Deep Convolutional Neural Networks', 'Deep Learning'),
        ('You Only Look Once: Unified, Real-Time Object Detection', 'Computer Vision'),
        ('You Only Look Once: Unified, Real-Time Object Detection', 'Deep Learning'),
        ('U-Net: Convolutional Networks for Biomedical Image Segmentation', 'Computer Vision'),
        ('U-Net: Convolutional Networks for Biomedical Image Segmentation', 'Deep Learning'),
        ('An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale', 'Computer Vision'),
        ('An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale', 'Deep Learning'),
        ('Language Models are Few-Shot Learners', 'Natural Language Processing'),
        ('Language Models are Few-Shot Learners', 'Deep Learning'),
        ('Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer', 'Natural Language Processing'),
        ('Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer', 'Deep Learning'),
        ('RoBERTa: A Robustly Optimized BERT Pretraining Approach', 'Natural Language Processing'),
        ('RoBERTa: A Robustly Optimized BERT Pretraining Approach', 'Deep Learning'),
        ('Improving Language Understanding by Generative Pre-Training', 'Natural Language Processing'),
        ('Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks', 'Natural Language Processing'),
        ('Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks', 'Information Retrieval'),
        ('Efficient Estimation of Word Representations in Vector Space', 'Natural Language Processing'),
        ('Distributed Representations of Words and Phrases and their Compositionality', 'Natural Language Processing'),
        ('The Anatomy of a Large-Scale Hypertextual Web Search Engine', 'Information Retrieval'),
        ('Learning to Rank for Information Retrieval', 'Information Retrieval'),
        ('BM25 and Beyond: Recent Advances in Information Retrieval', 'Information Retrieval'),
        ('Dense Passage Retrieval for Open-Domain Question Answering', 'Information Retrieval'),
        ('Dense Passage Retrieval for Open-Domain Question Answering', 'Natural Language Processing'),
        ('TransE: Translating Embeddings for Modeling Multi-relational Data', 'Knowledge Graphs'),
        ('Knowledge Graphs', 'Knowledge Graphs'),
        ('A Survey on Knowledge Graphs: Representation, Acquisition, and Applications', 'Knowledge Graphs'),
        ('Deep Residual Learning and Convolutional Neural Networks', 'Computer Vision'),
        ('Deep Residual Learning and Convolutional Neural Networks', 'Deep Learning')
) AS x(paper_title, topic_name)
JOIN papers p ON p.title = x.paper_title
JOIN topics t ON t.topic_name = x.topic_name
ON CONFLICT DO NOTHING;

COMMIT;
