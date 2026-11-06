
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Paper = {
  paper_id: number;
  title: string;
  publication_year: number | null;
  abstract: string | null;
  url: string | null;
  added_at: string;
  authors: string[];
};

type ReadingList = {
  reading_list_id: number;
  list_name: string;
  description: string | null;
  created_at: string;
};

export default function ReadingListDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-10 text-center text-slate-500">
          Loading reading list...
        </main>
      }
    >
      <ReadingListDetailsContent />
    </Suspense>
  );
}

function ReadingListDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const listId = params.list_id as string;

  const [list, setList] = useState<ReadingList | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paperId, setPaperId] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/reading-lists/${listId}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load reading list.");
      }

      setList(data.reading_list);
      setPapers(data.papers);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  async function addPaper(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionMessage("");
    setError("");

    const id = Number(paperId);

    if (!Number.isInteger(id) || id <= 0) {
      setError("Enter a valid paper ID.");
      return;
    }

    try {
      const response = await fetch(
        `/api/reading-lists/${listId}/papers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paper_id: id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to add paper.");
      }

      setPaperId("");
      setActionMessage("Paper added successfully!");
      await fetchDetails();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  async function removePaper(id: number) {
    if (!window.confirm("Remove this paper from the reading list?")) {
      return;
    }

    try {
      setError("");
      setActionMessage("");

      const response = await fetch(
        `/api/reading-lists/${listId}/papers/${id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to remove paper.");
      }

      setActionMessage("Paper removed successfully.");
      await fetchDetails();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  async function deleteList() {
    if (!window.confirm("Are you sure you want to delete this reading list?")) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(`/api/reading-lists/${listId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to delete reading list.");
      }

      router.push("/reading-lists");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-10 text-center text-slate-500">
        Loading reading list...
      </main>
    );
  }

  if (error && !list) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <p className="text-red-600">{error}</p>
        <Link href="/reading-lists" className="mt-4 inline-block text-indigo-600">
          ← Back to reading lists
        </Link>
      </main>
    );
  }

  if (!list) return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/reading-lists"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          ← Back to reading lists
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {list.list_name}
            </h1>
            <p className="mt-3 text-slate-600">
              {list.description || "Your personal research collection."}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              {papers.length} paper{papers.length === 1 ? "" : "s"} ·
              Created {new Date(list.created_at).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={deleteList}
            disabled={deleting}
            className="rounded-xl border border-red-200 px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete collection"}
          </button>
        </div>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold">Add a research paper</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter the paper ID from the ResearchLens search results.
          </p>

          <form onSubmit={addPaper} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              type="number"
              min="1"
              value={paperId}
              onChange={(e) => setPaperId(e.target.value)}
              placeholder="Enter paper ID"
              required
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
            />

            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
            >
              + Add paper
            </button>
          </form>

          {actionMessage && (
            <p className="mt-4 text-sm font-medium text-green-700">
              {actionMessage}
            </p>
          )}

          {error && (
            <p className="mt-4 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Saved papers</h2>
            <button
              onClick={fetchDetails}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-white"
            >
              Refresh
            </button>
          </div>

          {papers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="text-4xl">📚</div>
              <h3 className="mt-4 text-lg font-semibold">
                No papers saved yet
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Add papers using their ResearchLens paper IDs.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {papers.map((paper) => (
                <article
                  key={paper.paper_id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        Paper ID: {paper.paper_id}
                      </p>

                      <h3 className="mt-2 text-lg font-semibold">
                        {paper.title}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        {paper.authors?.join(", ") || "Author information unavailable"}
                        {paper.publication_year
                          ? ` · ${paper.publication_year}`
                          : ""}
                      </p>

                      {paper.abstract && (
                        <p className="mt-4 text-sm leading-6 text-slate-600">
                          {paper.abstract}
                        </p>
                      )}

                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
                        >
                          View publication →
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => removePaper(paper.paper_id)}
                      className="h-fit rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

