from sentence_transformers import SentenceTransformer
import psycopg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise RuntimeError('DATABASE_URL is missing from .env')

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def main():
    model = SentenceTransformer(MODEL_NAME)

    query_text = input("\nEnter your research question: ").strip()

    if not query_text:
        print("Please enter a non-empty search query.")
        return

    query_embedding = model.encode(
        query_text,
        normalize_embeddings=True
    ).tolist()

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    p.paper_id,
                    p.title,
                    p.publication_year,
                    p.abstract,
                    pe.embedding <=> %s::vector AS cosine_distance
                FROM paper_embeddings pe
                JOIN papers p
                    ON p.paper_id = pe.paper_id
                ORDER BY pe.embedding <=> %s::vector
                LIMIT 5;
                """,
                (query_embedding, query_embedding)
            )

            results = cur.fetchall()

    print("\n=== ResearchLens: Semantic Search Results ===")

    if not results:
        print("No papers with embeddings were found.")
        return

    for rank, (paper_id, title, year, abstract, distance) in enumerate(
        results, start=1
    ):
        similarity = (1 - distance) * 100

        print(f"\n{rank}. {title} ({year})")
        print(f"   Paper ID: {paper_id}")
        print(f"   Cosine similarity: {similarity:.2f}%")
        print(f"   Abstract: {abstract or 'No abstract available'}")


if __name__ == "__main__":
    main()
