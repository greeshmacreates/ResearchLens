from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field, model_validator
from sentence_transformers import SentenceTransformer

import psycopg
import os
import re
import jwt

from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from pwdlib import PasswordHash
from fastapi import Request, Response
from pydantic import field_validator

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing from .env")

# Authentication configuration

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from .env")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

password_hasher = PasswordHash.recommended()

model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    print("Loading ResearchLens embedding model...")
    model = SentenceTransformer(MODEL_NAME)
    print("Embedding model loaded successfully.")
    yield


app = FastAPI(
    title="ResearchLens API",
    description="Semantic research paper discovery API",
    version="1.1.0",
    lifespan=lifespan,
)


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    limit: int = Field(default=5, ge=1, le=20)
    min_year: int | None = Field(default=None, ge=1500, le=2100)
    max_year: int | None = Field(default=None, ge=1500, le=2100)
    topic: str | None = Field(default=None, max_length=150)

    @model_validator(mode="after")
    def validate_year_range(self):
        if (
            self.min_year is not None
            and self.max_year is not None
            and self.min_year > self.max_year
        ):
            raise ValueError("min_year cannot be greater than max_year.")
        return self



class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Name must contain at least 2 characters.")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Please enter a valid email address.")
        return value


@app.post("/api/auth/register", status_code=201)
def register_user(request: RegisterRequest):
    password_hash = password_hasher.hash(request.password)

    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO users (name, email, password_hash, role)
                    VALUES (%s, %s, %s, 'researcher')
                    RETURNING user_id, name, email, role, created_at;
                    """,
                    (request.name, request.email, password_hash),
                )
                user = cur.fetchone()

        return {
            "message": "Account created successfully.",
            "user": {
                "user_id": user[0],
                "name": user[1],
                "email": user[2],
                "role": user[3],
                "created_at": user[4],
            },
        }

    except psycopg.errors.UniqueViolation as exc:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        ) from exc

    except psycopg.Error as exc:
        print(f"Registration database error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not create your account.",
        ) from exc




class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Please enter a valid email address.")
        return value



@app.post("/api/auth/login")
def login_user(request: LoginRequest, response: Response):
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT user_id, name, email, password_hash, role
                    FROM users
                    WHERE email = %s;
                    """,
                    (request.email,),
                )
                user = cur.fetchone()

        if not user or not password_hasher.verify(
            request.password, user[3]
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password.",
            )

        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

        token = jwt.encode(
            {
                "sub": str(user[0]),
                "role": user[4],
                "exp": expires_at,
            },
            JWT_SECRET_KEY,
            algorithm=JWT_ALGORITHM,
        )

        response.set_cookie(
            key="researchlens_token",
            value=token,
            httponly=True,
            secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
            samesite="lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
        )

        return {
            "message": "Login successful.",
            "user": {
                "user_id": user[0],
                "name": user[1],
                "email": user[2],
                "role": user[4],
            },
        }

    except HTTPException:
        raise

    except psycopg.Error as exc:
        print(f"Login database error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not complete login.",
        ) from exc




def get_current_user(request: Request):
    token = request.cookies.get("researchlens_token")

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Please log in to continue.",
        )

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )

        user_id = int(payload["sub"])

    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Your session is invalid or has expired.",
        )

    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT user_id, name, email, role
                    FROM users
                    WHERE user_id = %s;
                    """,
                    (user_id,),
                )
                user = cur.fetchone()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User account no longer exists.",
            )

        return {
            "user_id": user[0],
            "name": user[1],
            "email": user[2],
            "role": user[3],
        }

    except psycopg.Error as exc:
        print(f"Authentication database error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not verify your account.",
        ) from exc




def require_researcher(
    current_user: dict = Depends(get_current_user),
):
    """Allow authenticated researchers and administrators."""
    if current_user["role"] not in ("researcher", "admin"):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this resource.",
        )
    return current_user


def require_admin(
    current_user: dict = Depends(get_current_user),
):
    """Allow administrators only."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator privileges are required.",
        )
    return current_user


@app.get("/api/admin/stats")
def get_admin_stats(
    current_user: dict = Depends(require_admin),
):
    """Return live dashboard statistics. Administrators only."""
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        (SELECT COUNT(*) FROM users),
                        (SELECT COUNT(*) FROM users WHERE role = 'researcher'),
                        (SELECT COUNT(*) FROM users WHERE role = 'admin'),
                        (SELECT COUNT(*) FROM papers),
                        (SELECT COUNT(*) FROM topics),
                        (SELECT COUNT(*) FROM authors),
                        (SELECT COUNT(*) FROM citations),
                        (SELECT COUNT(*) FROM reading_lists),
                        (SELECT COUNT(*) FROM paper_embeddings);
                    """
                )
                row = cur.fetchone()

        return {
            "total_users": row[0],
            "researchers": row[1],
            "admins": row[2],
            "total_papers": row[3],
            "total_topics": row[4],
            "total_authors": row[5],
            "total_citations": row[6],
            "total_reading_lists": row[7],
            "total_embeddings": row[8],
        }

    except psycopg.Error as exc:
        print(f"Admin statistics error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve dashboard statistics.",
        ) from exc




class RoleUpdateRequest(BaseModel):
    role: str = Field(min_length=1, max_length=20)

    @field_validator("role")
    @classmethod
    def validate_role(cls, value):
        value = value.strip().lower()
        if value not in ("admin", "researcher"):
            raise ValueError("Role must be admin or researcher.")
        return value


@app.patch("/api/admin/users/{user_id}/role")
def update_user_role(
    user_id: int,
    request: RoleUpdateRequest,
    current_user: dict = Depends(require_admin),
):
    """Update a user's role. Administrators only."""

    if user_id == current_user["user_id"]:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role.",
        )

    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                # Prevent concurrent role changes from bypassing the last-admin check.
                cur.execute(
                    "LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE;"
                )

                cur.execute(
                    "SELECT role FROM users WHERE user_id = %s;",
                    (user_id,),
                )
                target = cur.fetchone()

                if target is None:
                    raise HTTPException(
                        status_code=404,
                        detail="User not found.",
                    )

                if target[0] == "admin" and request.role == "researcher":
                    cur.execute(
                        "SELECT COUNT(*) FROM users WHERE role = 'admin';"
                    )
                    admin_count = cur.fetchone()[0]

                    if admin_count <= 1:
                        raise HTTPException(
                            status_code=400,
                            detail="The last administrator cannot be demoted.",
                        )

                cur.execute(
                    """
                    UPDATE users
                    SET role = %s
                    WHERE user_id = %s
                    RETURNING user_id, name, email, role;
                    """,
                    (request.role, user_id),
                )
                updated = cur.fetchone()

        return {
            "message": "User role updated successfully.",
            "user": {
                "user_id": updated[0],
                "name": updated[1],
                "email": updated[2],
                "role": updated[3],
            },
        }

    except psycopg.Error as exc:
        print(f"Admin role update error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not update user role.",
        ) from exc


@app.get("/api/admin/users")
def list_users(
    current_user: dict = Depends(require_admin),
):
    """List registered users. Administrators only."""
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT user_id, name, email, role, created_at
                    FROM users
                    ORDER BY created_at DESC;
                    """
                )
                rows = cur.fetchall()

        return {
            "users": [
                {
                    "user_id": row[0],
                    "name": row[1],
                    "email": row[2],
                    "role": row[3],
                    "created_at": row[4],
                }
                for row in rows
            ]
        }

    except psycopg.Error as exc:
        print(f"Admin user listing error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve users.",
        ) from exc


@app.get("/api/auth/me")
def get_me(request: Request):
    user = get_current_user(request)
    return {"authenticated": True, "user": user}


@app.post("/api/auth/logout")
def logout_user(response: Response):
    response.delete_cookie(
        key="researchlens_token",
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="lax",
        path="/",
    )
    return {"message": "Logged out successfully."}


@app.get("/health")
def health():
    return {"status": "ok", "service": "ResearchLens API"}


@app.get("/api/topics")
def get_topics():
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT topic_name FROM topics ORDER BY topic_name;"
                )
                topics = [row[0] for row in cur.fetchall()]

        return {"topics": topics}

    except psycopg.Error as exc:
        print(f"Database error while fetching topics: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve research topics.",
        ) from exc


@app.post("/api/search")
def search_papers(request: SearchRequest):
    query_text = request.query.strip()

    if not query_text:
        raise HTTPException(
            status_code=422,
            detail="Please enter a research question.",
        )

    try:
        query_embedding = model.encode(
            query_text,
            normalize_embeddings=True,
        ).tolist()

        conditions = []
        params = []

        if request.min_year is not None:
            conditions.append("p.publication_year >= %s")
            params.append(request.min_year)

        if request.max_year is not None:
            conditions.append("p.publication_year <= %s")
            params.append(request.max_year)

        if request.topic:
            conditions.append(
                """
                EXISTS (
                    SELECT 1
                    FROM paper_topics pt_filter
                    JOIN topics t_filter
                      ON t_filter.topic_id = pt_filter.topic_id
                    WHERE pt_filter.paper_id = p.paper_id
                      AND LOWER(t_filter.topic_name) = LOWER(%s)
                )
                """
            )
            params.append(request.topic.strip())

        where_clause = (
            "WHERE " + " AND ".join(conditions)
            if conditions
            else ""
        )

        sql = f"""
            SELECT
                p.paper_id,
                p.title,
                p.publication_year,
                p.abstract,
                p.url,
                COALESCE(
                    array_agg(a.author_name ORDER BY pa.author_order)
                    FILTER (WHERE a.author_id IS NOT NULL),
                    ARRAY[]::text[]
                ) AS authors,
                pe.embedding <=> %s::vector AS cosine_distance
            FROM paper_embeddings pe
            JOIN papers p
              ON p.paper_id = pe.paper_id
            LEFT JOIN paper_authors pa
              ON pa.paper_id = p.paper_id
            LEFT JOIN authors a
              ON a.author_id = pa.author_id
            {where_clause}
            GROUP BY
                p.paper_id,
                p.title,
                p.publication_year,
                p.abstract,
                p.url,
                pe.embedding
            ORDER BY pe.embedding <=> %s::vector
            LIMIT %s;
        """

        params = [query_embedding, *params, query_embedding, request.limit]

        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                rows = cur.fetchall()

        results = [
            {
                "paper_id": row[0],
                "title": row[1],
                "publication_year": row[2],
                "abstract": row[3] or "No abstract available.",
                "url": row[4],
                "authors": row[5],
                "similarity": round((1 - row[6]) * 100, 2),
            }
            for row in rows
        ]

        return {
            "query": query_text,
            "count": len(results),
            "filters": {
                "min_year": request.min_year,
                "max_year": request.max_year,
                "topic": request.topic,
            },
            "results": results,
        }

    except psycopg.Error as exc:
        print(f"Database error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="The database search failed. Please try again.",
        ) from exc

    except Exception as exc:
        print(f"Search error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="The semantic search failed. Please try again.",
        ) from exc


class ReadingListCreateRequest(BaseModel):
    list_name: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=2000)

    @field_validator("list_name")
    @classmethod
    def validate_list_name(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("Reading list name cannot be empty.")
        return value


@app.get("/api/reading-lists")
def get_reading_lists(
    current_user: dict = Depends(require_researcher),
):
    """Retrieve the logged-in user's reading lists."""

    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        rl.reading_list_id,
                        rl.list_name,
                        rl.description,
                        rl.created_at,
                        COUNT(rlp.paper_id) AS paper_count
                    FROM reading_lists rl
                    LEFT JOIN reading_list_papers rlp
                        ON rlp.reading_list_id = rl.reading_list_id
                    WHERE rl.user_id = %s
                    GROUP BY rl.reading_list_id
                    ORDER BY rl.created_at DESC;
                    """,
                    (current_user["user_id"],),
                )
                rows = cur.fetchall()

        return {
            "count": len(rows),
            "reading_lists": [
                {
                    "reading_list_id": row[0],
                    "list_name": row[1],
                    "description": row[2],
                    "created_at": row[3],
                    "paper_count": row[4],
                }
                for row in rows
            ],
        }

    except psycopg.Error as exc:
        print(f"Reading list retrieval error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve reading lists.",
        ) from exc


@app.post("/api/reading-lists", status_code=201)
def create_reading_list(
    request: ReadingListCreateRequest,
    current_user: dict = Depends(require_researcher),
):
    """Create a reading list for the logged-in user."""

    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO reading_lists
                        (user_id, list_name, description)
                    VALUES (%s, %s, %s)
                    RETURNING
                        reading_list_id,
                        list_name,
                        description,
                        created_at;
                    """,
                    (
                        current_user["user_id"],
                        request.list_name,
                        request.description,
                    ),
                )
                row = cur.fetchone()

        return {
            "message": "Reading list created successfully.",
            "reading_list": {
                "reading_list_id": row[0],
                "list_name": row[1],
                "description": row[2],
                "created_at": row[3],
                "paper_count": 0,
            },
        }

    except psycopg.errors.UniqueViolation as exc:
        raise HTTPException(
            status_code=409,
            detail="You already have a reading list with this name.",
        ) from exc

    except psycopg.Error as exc:
        print(f"Reading list creation error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not create reading list.",
        ) from exc


@app.get("/api/reading-lists/{list_id}")
def get_reading_list_details(
    list_id: int,
    current_user: dict = Depends(require_researcher),
):
    """Retrieve a reading list and its papers."""

    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:

                # Verify that the list belongs to the logged-in user.
                cur.execute(
                    """
                    SELECT reading_list_id, list_name, description, created_at
                    FROM reading_lists
                    WHERE reading_list_id = %s
                    AND user_id = %s;
                    """,
                    (list_id, current_user["user_id"]),
                )

                reading_list = cur.fetchone()

                if not reading_list:
                    raise HTTPException(
                        status_code=404,
                        detail="Reading list not found.",
                    )

                # Retrieve all papers in the list.
                cur.execute(
                    """
                    SELECT
                        p.paper_id,
                        p.title,
                        p.publication_year,
                        p.abstract,
                        p.url,
                        rlp.added_at,
                        COALESCE(
                            (
                                SELECT array_agg(
                                    a.author_name::text
                                    ORDER BY pa.author_order
                                )
                                FROM paper_authors pa
                                JOIN authors a
                                    ON a.author_id = pa.author_id
                                WHERE pa.paper_id = p.paper_id
                            ),
                            ARRAY[]::text[]
                        ) AS authors
                    FROM reading_list_papers rlp
                    JOIN papers p
                        ON p.paper_id = rlp.paper_id
                    WHERE rlp.reading_list_id = %s
                    ORDER BY rlp.added_at DESC;
                    """,
                    (list_id,),
                )

                papers = cur.fetchall()

        return {
            "reading_list": {
                "reading_list_id": reading_list[0],
                "list_name": reading_list[1],
                "description": reading_list[2],
                "created_at": reading_list[3],
            },
            "paper_count": len(papers),
            "papers": [
                {
                    "paper_id": paper[0],
                    "title": paper[1],
                    "publication_year": paper[2],
                    "abstract": paper[3],
                    "url": paper[4],
                    "added_at": paper[5],
                    "authors": paper[6],
                }
                for paper in papers
            ],
        }

    except HTTPException:
        raise

    except psycopg.Error as exc:
        print(f"Reading list details error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve reading list details.",
        ) from exc


class AddPaperRequest(BaseModel):
    paper_id: int = Field(gt=0)


@app.post("/api/reading-lists/{list_id}/papers", status_code=201)
def add_paper_to_reading_list(
    list_id: int,
    request: AddPaperRequest,
    current_user: dict = Depends(require_researcher),
):
    """Add a paper to the user's reading list."""

    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:

                # Check whether the reading list belongs to this user.
                cur.execute(
                    """
                    SELECT reading_list_id
                    FROM reading_lists
                    WHERE reading_list_id = %s
                    AND user_id = %s;
                    """,
                    (list_id, current_user["user_id"]),
                )

                if not cur.fetchone():
                    raise HTTPException(
                        status_code=404,
                        detail="Reading list not found.",
                    )

                # Check whether the paper exists.
                cur.execute(
                    "SELECT paper_id FROM papers WHERE paper_id = %s;",
                    (request.paper_id,),
                )

                if not cur.fetchone():
                    raise HTTPException(
                        status_code=404,
                        detail="Paper not found.",
                    )

                # Add the paper to the reading list.
                cur.execute(
                    """
                    INSERT INTO reading_list_papers
                        (reading_list_id, paper_id)
                    VALUES (%s, %s);
                    """,
                    (list_id, request.paper_id),
                )

        return {
            "message": "Paper added to reading list successfully.",
            "reading_list_id": list_id,
            "paper_id": request.paper_id,
        }

    except HTTPException:
        raise

    except psycopg.errors.UniqueViolation as exc:
        raise HTTPException(
            status_code=409,
            detail="This paper is already in the reading list.",
        ) from exc

    except psycopg.Error as exc:
        print(f"Adding paper to reading list error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not add paper to reading list.",
        ) from exc


@app.delete("/api/reading-lists/{list_id}/papers/{paper_id}")
def remove_paper_from_reading_list(
    list_id: int,
    paper_id: int,
    current_user: dict = Depends(require_researcher),
):
    """Remove a paper from the user's reading list."""

    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    DELETE FROM reading_list_papers rlp
                    USING reading_lists rl
                    WHERE rlp.reading_list_id = rl.reading_list_id
                    AND rlp.reading_list_id = %s
                    AND rlp.paper_id = %s
                    AND rl.user_id = %s;
                    """,
                    (list_id, paper_id, current_user["user_id"]),
                )

                if cur.rowcount == 0:
                    raise HTTPException(
                        status_code=404,
                        detail="Paper or reading list not found.",
                    )

        return {
            "message": "Paper removed from reading list successfully.",
            "reading_list_id": list_id,
            "paper_id": paper_id,
        }

    except HTTPException:
        raise

    except psycopg.Error as exc:
        print(f"Removing paper error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not remove paper from reading list.",
        ) from exc


@app.delete("/api/reading-lists/{list_id}")
def delete_reading_list(
    list_id: int,
    current_user: dict = Depends(require_researcher),
):
    """Delete a reading list owned by the logged-in user."""

    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    DELETE FROM reading_lists
                    WHERE reading_list_id = %s
                    AND user_id = %s;
                    """,
                    (list_id, current_user["user_id"]),
                )

                if cur.rowcount == 0:
                    raise HTTPException(
                        status_code=404,
                        detail="Reading list not found.",
                    )

        return {
            "message": "Reading list deleted successfully.",
            "reading_list_id": list_id,
        }

    except HTTPException:
        raise

    except psycopg.Error as exc:
        print(f"Reading list deletion error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not delete reading list.",
        ) from exc


# --------------------------------------------------
# CITATION NETWORK API
# --------------------------------------------------

def get_citation_paper_details(cur, paper_id):
    cur.execute(
        """
        SELECT
            p.paper_id,
            p.title,
            p.publication_year,
            p.url,
            COALESCE(
                array_agg(a.author_name ORDER BY pa.author_order)
                FILTER (WHERE a.author_id IS NOT NULL),
                ARRAY[]::text[]
            ) AS authors
        FROM papers p
        LEFT JOIN paper_authors pa
            ON pa.paper_id = p.paper_id
        LEFT JOIN authors a
            ON a.author_id = pa.author_id
        WHERE p.paper_id = %s
        GROUP BY p.paper_id
        """,
        (paper_id,),
    )

    row = cur.fetchone()

    if not row:
        return None

    return {
        "paper_id": row[0],
        "title": row[1],
        "publication_year": row[2],
        "url": row[3],
        "authors": row[4],
    }


@app.get("/api/papers/{paper_id}/citations")
def get_paper_citations(paper_id: int):
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                paper = get_citation_paper_details(cur, paper_id)

                if not paper:
                    raise HTTPException(
                        status_code=404,
                        detail="Paper not found.",
                    )

                cur.execute(
                    """
                    SELECT cited_paper_id
                    FROM citations
                    WHERE citing_paper_id = %s
                    ORDER BY cited_paper_id
                    """,
                    (paper_id,),
                )

                cited_ids = [row[0] for row in cur.fetchall()]

                cited_papers = []

                for cited_id in cited_ids:
                    details = get_citation_paper_details(cur, cited_id)
                    if details:
                        cited_papers.append(details)

        return {
            "paper": paper,
            "citation_count": len(cited_papers),
            "cited_papers": cited_papers,
        }

    except HTTPException:
        raise
    except psycopg.Error as exc:
        print(f"Citation database error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve paper citations.",
        ) from exc


@app.get("/api/papers/{paper_id}/cited-by")
def get_papers_citing_paper(paper_id: int):
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                paper = get_citation_paper_details(cur, paper_id)

                if not paper:
                    raise HTTPException(
                        status_code=404,
                        detail="Paper not found.",
                    )

                cur.execute(
                    """
                    SELECT citing_paper_id
                    FROM citations
                    WHERE cited_paper_id = %s
                    ORDER BY citing_paper_id
                    """,
                    (paper_id,),
                )

                citing_ids = [row[0] for row in cur.fetchall()]

                citing_papers = []

                for citing_id in citing_ids:
                    details = get_citation_paper_details(cur, citing_id)
                    if details:
                        citing_papers.append(details)

        return {
            "paper": paper,
            "cited_by_count": len(citing_papers),
            "citing_papers": citing_papers,
        }

    except HTTPException:
        raise
    except psycopg.Error as exc:
        print(f"Cited-by database error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve citing papers.",
        ) from exc


@app.get("/api/papers/{paper_id}/citation-network")
def get_citation_network(paper_id: int):
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                root_paper = get_citation_paper_details(cur, paper_id)

                if not root_paper:
                    raise HTTPException(
                        status_code=404,
                        detail="Paper not found.",
                    )

                cur.execute(
                    """
                    SELECT citing_paper_id, cited_paper_id
                    FROM citations
                    WHERE citing_paper_id = %s
                       OR cited_paper_id = %s
                    ORDER BY citing_paper_id, cited_paper_id
                    """,
                    (paper_id, paper_id),
                )

                edges = cur.fetchall()

                connected_ids = {paper_id}

                for citing_id, cited_id in edges:
                    connected_ids.add(citing_id)
                    connected_ids.add(cited_id)

                nodes = []

                for connected_id in sorted(connected_ids):
                    details = get_citation_paper_details(
                        cur, connected_id
                    )
                    if details:
                        nodes.append(details)

        return {
            "root_paper_id": paper_id,
            "node_count": len(nodes),
            "edge_count": len(edges),
            "nodes": nodes,
            "edges": [
                {
                    "source": citing_id,
                    "target": cited_id,
                }
                for citing_id, cited_id in edges
            ],
        }

    except HTTPException:
        raise
    except psycopg.Error as exc:
        print(f"Citation network database error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve citation network.",
        ) from exc



@app.get("/api/analytics")
def get_research_analytics(
    current_user: dict = Depends(require_researcher),
):
    """Return research analytics for authenticated users."""

    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:

                # 1. Publication trends
                cur.execute("""
                    SELECT publication_year, COUNT(*) AS paper_count
                    FROM papers
                    WHERE publication_year IS NOT NULL
                    GROUP BY publication_year
                    ORDER BY publication_year;
                """)

                publication_trends = [
                    {
                        "year": row[0],
                        "paper_count": row[1],
                    }
                    for row in cur.fetchall()
                ]

                # 2. Most cited papers
                cur.execute("""
                    SELECT
                        p.paper_id,
                        p.title,
                        p.publication_year,
                        COUNT(c.citing_paper_id) AS citation_count
                    FROM papers p
                    LEFT JOIN citations c
                        ON p.paper_id = c.cited_paper_id
                    GROUP BY
                        p.paper_id,
                        p.title,
                        p.publication_year
                    ORDER BY citation_count DESC, p.paper_id
                    LIMIT 10;
                """)

                most_cited_papers = [
                    {
                        "paper_id": row[0],
                        "title": row[1],
                        "publication_year": row[2],
                        "citation_count": row[3],
                    }
                    for row in cur.fetchall()
                ]

                # 3. Most productive authors
                cur.execute("""
                    SELECT
                        a.author_id,
                        a.author_name,
                        COUNT(DISTINCT pa.paper_id) AS paper_count
                    FROM authors a
                    JOIN paper_authors pa
                        ON a.author_id = pa.author_id
                    GROUP BY a.author_id, a.author_name
                    ORDER BY paper_count DESC, a.author_name
                    LIMIT 10;
                """)

                productive_authors = [
                    {
                        "author_id": row[0],
                        "author_name": row[1],
                        "paper_count": row[2],
                    }
                    for row in cur.fetchall()
                ]

                # 4. Popular research topics
                cur.execute("""
                    SELECT
                        t.topic_id,
                        t.topic_name,
                        COUNT(DISTINCT pt.paper_id) AS paper_count
                    FROM topics t
                    LEFT JOIN paper_topics pt
                        ON t.topic_id = pt.topic_id
                    GROUP BY t.topic_id, t.topic_name
                    ORDER BY paper_count DESC, t.topic_name
                    LIMIT 10;
                """)

                popular_topics = [
                    {
                        "topic_id": row[0],
                        "topic_name": row[1],
                        "paper_count": row[2],
                    }
                    for row in cur.fetchall()
                ]

        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        (SELECT COUNT(*) FROM papers),
                        (SELECT COUNT(*) FROM citations),
                        (SELECT COUNT(*) FROM authors),
                        (SELECT COUNT(*) FROM topics);
                """)
                totals = cur.fetchone()

        return {
            "total_papers": totals[0],
            "total_citations": totals[1],
            "total_authors": totals[2],
            "total_topics": totals[3],
            "publication_trends": publication_trends,
            "most_cited_papers": most_cited_papers,
            "productive_authors": productive_authors,
            "popular_topics": popular_topics,
        }

    except psycopg.Error as exc:
        print(f"Research analytics error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve research analytics.",
        ) from exc
