
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type ReadingList = {
  reading_list_id: number;
  list_name: string;
  description: string | null;
  created_at: string;
  paper_count: number;
};

export default function ReadingListsPage() {
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [listName, setListName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/reading-lists", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load reading lists.");
      }

      setLists(data.reading_lists);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  async function createList(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!listName.trim()) {
      setError("Please enter a reading list name.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/reading-lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          list_name: listName.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to create reading list.");
      }

      setListName("");
      setDescription("");
      setMessage("Reading list created successfully!");

      await fetchLists();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            ← Back to ResearchLens
          </Link>

          <h1 className="mt-5 text-4xl font-bold tracking-tight">
            My Reading Lists
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Organize research papers, save interesting discoveries,
            and build your personal research library.
          </p>
        </div>

        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold">
            Create a new reading list
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Give your collection a name and an optional description.
          </p>

          <form onSubmit={createList} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="listName"
                className="mb-2 block text-sm font-medium"
              >
                List name
              </label>

              <input
                id="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g. Machine Learning Research"
                maxLength={150}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium"
              >
                Description (optional)
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this collection about?"
                maxLength={2000}
                rows={3}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Creating..." : "+ Create Reading List"}
            </button>
          </form>

          {message && (
            <p className="mt-4 text-sm font-medium text-green-700">
              {message}
            </p>
          )}

          {error && (
            <p className="mt-4 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your collections</h2>
              <p className="mt-1 text-sm text-slate-500">
                {lists.length} reading list{lists.length === 1 ? "" : "s"}
              </p>
            </div>

            <button
              onClick={fetchLists}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-white"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-500">
              Loading your reading lists...
            </p>
          ) : lists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="text-4xl">📚</div>
              <h3 className="mt-4 text-lg font-semibold">
                No reading lists yet
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Create your first collection to start organizing papers.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {lists.map((list) => (
                <Link
                  key={list.reading_list_id}
                  href={`/reading-lists/${list.reading_list_id}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">📖</span>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {list.paper_count} papers
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold group-hover:text-indigo-700">
                    {list.list_name}
                  </h3>

                  <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">
                    {list.description || "No description provided."}
                  </p>

                  <p className="mt-5 text-xs text-slate-400">
                    Created{" "}
                    {new Date(list.created_at).toLocaleDateString()}
                  </p>

                  <p className="mt-4 text-sm font-semibold text-indigo-600">
                    Open collection →
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}


