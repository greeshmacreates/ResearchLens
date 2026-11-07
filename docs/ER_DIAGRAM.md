# ResearchLens — Entity Relationship Diagram

The ER diagram represents the database structure of ResearchLens and illustrates the entities, their attributes, primary keys, and relationships.

## Entities

The database consists of ten entities:

1. Users
2. Papers
3. Authors
4. Paper Authors
5. Topics
6. Paper Topics
7. Citations
8. Paper Embeddings
9. Reading Lists
10. Reading List Papers

## Relationships

- Users can create multiple reading lists.
- Reading lists can contain multiple papers.
- Papers and authors have a many-to-many relationship.
- Papers and topics have a many-to-many relationship.
- Papers can cite other papers.
- Each paper can have an associated vector embedding.

The junction tables implement the many-to-many relationships.

## Diagram

The ER diagram is provided separately as an image in the project submission.

