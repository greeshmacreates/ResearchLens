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
    print("Loading embedding model...")
    model = SentenceTransformer(MODEL_NAME)

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT p.paper_id, p.title, p.abstract
                FROM papers AS p
                LEFT JOIN paper_embeddings AS e
                    ON e.paper_id = p.paper_id
                WHERE e.paper_id IS NULL
                ORDER BY p.paper_id;
            """)
            papers = cur.fetchall()

            if not papers:
                print("No papers found.")
                return

            for paper_id, title, abstract in papers:
                text = f"{title}\n{abstract or ''}"
                vector = model.encode(text, normalize_embeddings=True).tolist()

                cur.execute("""
                    INSERT INTO paper_embeddings
                        (paper_id, embedding, model_name, embedded_at)
                    VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (paper_id)
                    DO UPDATE SET
                        embedding = EXCLUDED.embedding,
                        model_name = EXCLUDED.model_name,
                        embedded_at = CURRENT_TIMESTAMP;
                """, (paper_id, vector, MODEL_NAME))

                print(f"Generated embedding for paper {paper_id}: {title}")

        conn.commit()

    print("All embeddings generated and saved successfully.")

if __name__ == "__main__":
    main()
