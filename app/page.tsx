
"use client";

import { FormEvent, useEffect, useState } from "react";

type Paper = {
  paper_id: number;
  title: string;
  publication_year: number | null;
  abstract: string;
  url: string | null;
  authors: string[];
  similarity: number;
};

type User = {
  user_id: number;
  name: string;
  email: string;
  role: "admin" | "researcher";
};

type ReadingList = {
  reading_list_id: number;
  list_name: string;
  description: string | null;
  paper_count: number;
};

type SearchResponse = {
  query: string;
  count: number;
  results: Paper[];
};

const suggestions = [
  "How do transformers understand language?",
  "Papers about image recognition",
  "How does retrieval-augmented generation work?",
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Paper[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [topicError, setTopicError] = useState("");

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [readingLists, setReadingLists] = useState<ReadingList[]>([]);
  const [selectedLists, setSelectedLists] = useState<Record<number, string>>({});
  const [savingPaperId, setSavingPaperId] = useState<number | null>(null);
  const [saveMessages, setSaveMessages] = useState<Record<number, string>>({});
  const [saveErrors, setSaveErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    async function loadTopics() {
      try {
        const response = await fetch("/api/topics");
        if (!response.ok) throw new Error("Could not load topics.");

        const data = await response.json();
        setTopics(Array.isArray(data.topics) ? data.topics : []);
        setTopicError("");
      } catch {
        setTopicError(
          "Topics could not be loaded. You can still search without a topic."
        );
      }
    }

    loadTopics();
  }, []);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user ?? null);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (!user) {
      setReadingLists([]);
      return;
    }

    async function loadReadingLists() {
      try {
        const response = await fetch("/api/reading-lists", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load reading lists.");
        }

        const data = await response.json();
        const lists: ReadingList[] = data.reading_lists ?? [];

        setReadingLists(lists);

        setSelectedLists((previous) => {
          const next = { ...previous };

          for (const paper of results) {
            if (
              !next[paper.paper_id] &&
              lists.length > 0
            ) {
              next[paper.paper_id] = String(lists[0].reading_list_id);
            }
          }

          return next;
        });
      } catch (err) {
        console.error("Reading list loading error:", err);
      }
    }

    loadReadingLists();
  }, [user, results]);

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        setUser(null);
        window.location.href = "/";
      } else {
        setError("Could not log out. Please try again.");
      }
    } catch {
      setError("Could not log out. Please try again.");
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const searchText = query.trim();

    if (!searchText) {
      setError("Please enter a research question first.");
      return;
    }

    const min = minYear.trim() ? Number(minYear) : null;
    const max = maxYear.trim() ? Number(maxYear) : null;

    if (
      (min !== null &&
        (!Number.isInteger(min) || min < 1500 || min > 2100)) ||
      (max !== null &&
        (!Number.isInteger(max) || max < 1500 || max > 2100))
    ) {
      setError("Please enter publication years between 1500 and 2100.");
      return;
    }

    if (min !== null && max !== null && min > max) {
      setError("The minimum year cannot be greater than the maximum year.");
      return;
    }

    setLoading(true);
    setError("");
    setHasSearched(true);
    setSearchedQuery(searchText);
    setResults([]);
    setSaveMessages({});
    setSaveErrors({});

    try {
      const payload = {
        query: searchText,
        limit: 5,
        min_year: min,
        max_year: max,
        topic: topic || null,
      };

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || data.error || "Search failed. Please try again."
        );
      }

      const searchData = data as SearchResponse;
      setResults(searchData.results ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while searching."
      );
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setMinYear("");
    setMaxYear("");
    setTopic("");
  }

  async function savePaper(paperId: number) {
    const listId = selectedLists[paperId];

    if (!user) {
      setSaveErrors((previous) => ({
        ...previous,
        [paperId]: "Please sign in to save research papers.",
      }));
      return;
    }

    if (!listId) {
      setSaveErrors((previous) => ({
        ...previous,
        [paperId]: "Please select a reading list first.",
      }));
      return;
    }

    setSavingPaperId(paperId);

    setSaveMessages((previous) => ({
      ...previous,
      [paperId]: "",
    }));

    setSaveErrors((previous) => ({
      ...previous,
      [paperId]: "",
    }));

    try {
      const response = await fetch(
        `/api/reading-lists/${listId}/papers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paper_id: paperId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not save this paper.");
      }

      const selectedList = readingLists.find(
        (list) => String(list.reading_list_id) === listId
      );

      setSaveMessages((previous) => ({
        ...previous,
        [paperId]: `Saved to ${selectedList?.list_name ?? "reading list"}!`,
      }));

      setReadingLists((previous) =>
        previous.map((list) =>
          String(list.reading_list_id) === listId
            ? { ...list, paper_count: list.paper_count + 1 }
            : list
        )
      );
    } catch (err) {
      setSaveErrors((previous) => ({
        ...previous,
        [paperId]:
          err instanceof Error ? err.message : "Something went wrong.",
      }));
    } finally {
      setSavingPaperId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
              R
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                ResearchLens
              </h1>
              <p className="text-xs text-slate-500">
                Research discovery, reimagined.
              </p>
            </div>
          </a>

          <div className="flex flex-wrap items-center justify-end gap-4">
            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
              <a href="#search" className="transition hover:text-indigo-600">
                Discover
              </a>
              <a
                href="#how-it-works"
                className="transition hover:text-indigo-600"
              >
                How it works
              </a>
              <span className="rounded-full bg-indigo-50 px-4 py-2 text-indigo-700">
                AI-powered search
              </span>
              {user && (
                <>
                  <a
                    href="/reading-lists"
                    className="transition hover:text-indigo-600"
                  >
                    My reading lists
                  </a>
                  <a
                    href="/analytics"
                    className="transition hover:text-indigo-600"
                  >
                    Analytics
                  </a>
                </>
              )}
              {user?.role === "admin" && (
                <a
                  href="/admin"
                  className="transition hover:text-indigo-600"
                >
                  Admin
                </a>
              )}
            </nav>

            {!authLoading &&
              (user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      {user.name}
                    </p>
                    <p className="text-xs capitalize text-slate-500">
                      {user.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <a
                    href="/login"
                    className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
                  >
                    Sign in
                  </a>
                  <a
                    href="/register"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Create account
                  </a>
                </div>
              ))}
          </div>
        </div>
      </header>

      <section
        id="search"
        className="relative overflow-hidden bg-white px-6 pb-16 pt-20 sm:pb-24 sm:pt-28"
      >
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-100/60 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Discover connections between research papers
          </div>

          <h2 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Find research that
            <br />
            <span className="text-indigo-600">thinks like you.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Explore research papers by meaning, not just keywords. Ask a
            question, discover relevant studies, and uncover connections across
            ideas.
          </p>

          <form className="mx-auto mt-10 max-w-3xl" onSubmit={handleSearch}>
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/60 sm:flex-row sm:items-center">
              <span className="hidden pl-3 text-xl text-slate-400 sm:block">
                ⌕
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ask a research question..."
                aria-label="Research question"
                className="min-w-0 flex-1 bg-transparent px-3 py-4 text-base outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-indigo-600 px-7 py-4 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Searching..." : "Find papers →"}
              </button>
            </div>

            <p className="mt-3 text-left text-xs text-slate-500 sm:pl-2">
              Search by research question, concept, or idea.
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-800">
                  Refine your search
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Optional filters to narrow down your research papers.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm font-medium text-slate-700">
                  From year
                  <input
                    type="number"
                    min="1500"
                    max="2100"
                    value={minYear}
                    onChange={(event) => setMinYear(event.target.value)}
                    placeholder="e.g. 2015"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  To year
                  <input
                    type="number"
                    min="1500"
                    max="2100"
                    value={maxYear}
                    onChange={(event) => setMaxYear(event.target.value)}
                    placeholder="e.g. 2025"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Research topic
                  <select
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">All topics</option>
                    {topics.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {topicError && (
                <p className="mt-3 text-xs text-amber-700">{topicError}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Filters apply when you click Find papers.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  Clear filters
                </button>
              </div>
            </div>
          </form>

          <div className="mx-auto mt-7 flex max-w-3xl flex-wrap items-center justify-center gap-2">
            <span className="mr-1 text-sm text-slate-500">Try:</span>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setQuery(suggestion)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </section>

      {(loading || error || hasSearched) && (
        <section
          id="results"
          className="mx-auto max-w-7xl scroll-mt-8 px-6 py-14"
          aria-live="polite"
        >
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Search results
            </p>
            <h3 className="mt-2 text-2xl font-bold sm:text-3xl">
              {loading ? "Finding relevant papers..." : "Papers for your research"}
            </h3>
            {searchedQuery && (
              <p className="mt-2 text-sm text-slate-500">
                Your question: &ldquo;{searchedQuery}&rdquo;
              </p>
            )}
          </div>

          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
              <p className="mt-4 text-slate-600">
                Comparing your question with research paper embeddings...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
              <h4 className="font-semibold">
                We couldn&apos;t complete your search
              </h4>
              <p className="mt-2 text-sm">{error}</p>
              <button
                type="button"
                onClick={() => {
                  document.querySelector("form")?.requestSubmit();
                }}
                className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-red-100"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && hasSearched && results.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <h4 className="text-lg font-semibold">
                No matching papers found
              </h4>
              <p className="mt-2 text-slate-500">
                Try a different question or broaden your filters.
              </p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <>
              <p className="mb-5 text-sm text-slate-500">
                Found {results.length} papers, ranked by semantic similarity.
              </p>

              <div className="space-y-5">
                {results.map((paper, index) => (
                  <article
                    key={paper.paper_id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:p-8"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        Match #{index + 1}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                        {paper.similarity.toFixed(2)}% similarity
                      </span>
                    </div>

                    <h4 className="mt-4 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
                      {paper.title}
                    </h4>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                      {paper.publication_year && (
                        <span>{paper.publication_year}</span>
                      )}
                      {paper.authors?.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{paper.authors.join(", ")}</span>
                        </>
                      )}
                    </div>

                    <p className="mt-5 text-sm leading-7 text-slate-600">
                      {paper.abstract}
                    </p>

                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        View paper <span aria-hidden="true">↗</span>
                      </a>
                    )}

                    <a
                      href={`/citations/${paper.paper_id}`}
                      className="mt-5 ml-5 inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Explore Citation Network →
                    </a>

                    <div className="mt-6 border-t border-slate-100 pt-5">
                      {user ? (
                        <>
                          <p className="mb-3 text-sm font-semibold text-slate-700">
                            Save this paper to a reading list
                          </p>

                          {readingLists.length > 0 ? (
                            <div className="flex flex-col gap-3 sm:flex-row">
                              <select
                                value={selectedLists[paper.paper_id] ?? ""}
                                onChange={(event) =>
                                  setSelectedLists((previous) => ({
                                    ...previous,
                                    [paper.paper_id]: event.target.value,
                                  }))
                                }
                                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                              >
                                {readingLists.map((list) => (
                                  <option
                                    key={list.reading_list_id}
                                    value={String(list.reading_list_id)}
                                  >
                                    {list.list_name}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => savePaper(paper.paper_id)}
                                disabled={savingPaperId === paper.paper_id}
                                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {savingPaperId === paper.paper_id
                                  ? "Saving..."
                                  : "＋ Save to Reading List"}
                              </button>
                            </div>
                          ) : (
                            <div className="rounded-xl bg-slate-50 p-4">
                              <p className="text-sm text-slate-600">
                                You haven't created a reading list yet.
                              </p>
                              <a
                                href="/reading-lists"
                                className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:underline"
                              >
                                Create your first reading list →
                              </a>
                            </div>
                          )}
                        </>
                      ) : (
                        <a
                          href="/login"
                          className="inline-flex rounded-xl border border-indigo-200 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                        >
                          Sign in to save this paper
                        </a>
                      )}

                      {saveMessages[paper.paper_id] && (
                        <p className="mt-3 text-sm font-medium text-green-700">
                          ✓ {saveMessages[paper.paper_id]}
                        </p>
                      )}

                      {saveErrors[paper.paper_id] && (
                        <p className="mt-3 text-sm font-medium text-red-600">
                          {saveErrors[paper.paper_id]}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Why ResearchLens
          </p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight">
            Research discovery beyond keywords.
          </h3>
          <p className="mt-4 leading-7 text-slate-600">
            ResearchLens combines PostgreSQL, full-text search, and vector
            embeddings to help identify research that is conceptually relevant
            to your question.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard
            number="01"
            title="Meaning-based discovery"
            description="Search using a research question or concept instead of relying only on exact keywords."
            tag="Semantic search"
          />
          <FeatureCard
            number="02"
            title="Refine your results"
            description="Narrow research papers by publication year and topic to explore relevant work."
            tag="Advanced filters"
          />
          <FeatureCard
            number="03"
            title="Organize your research"
            description="Save interesting papers into personal reading lists and revisit them whenever you need."
            tag="Reading lists"
          />
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-6 pb-20"
      >
        <div className="grid gap-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:grid-cols-2 md:p-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Behind the search
            </p>
            <h3 className="mt-3 text-3xl font-bold tracking-tight">
              How ResearchLens works
            </h3>
            <p className="mt-4 leading-7 text-slate-600">
              ResearchLens combines PostgreSQL, full-text search, and vector
              embeddings to help identify research that is conceptually relevant
              to your question.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            {[
              ["01", "Your question", "Describe what you want to research."],
              [
                "02",
                "Meaning-based matching",
                "Compare your question with paper embeddings.",
              ],
              [
                "03",
                "Relevant papers",
                "Explore the closest matches from the database.",
              ],
            ].map(([number, title, description]) => (
              <div key={number} className="flex gap-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700">
                  {number}
                </div>
                <div>
                  <h4 className="font-semibold">{title}</h4>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-[#f8f9fc]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-slate-700">ResearchLens</p>
          <p>Discover papers. Connect ideas. Explore knowledge.</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  number,
  title,
  description,
  tag,
}: {
  number: string;
  title: string;
  description: string;
  tag: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-indigo-600">{number}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {tag}
        </span>
      </div>
      <h4 className="mt-6 text-xl font-bold">{title}</h4>
      <p className="mt-3 leading-7 text-slate-600">{description}</p>
    </article>
  );
}

