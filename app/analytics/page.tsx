"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  total_papers: number;
  total_citations: number;
  total_authors: number;
  total_topics: number;
  publication_trends: {
    year: number;
    paper_count: number;
  }[];
  most_cited_papers: {
    paper_id: number;
    title: string;
    publication_year: number | null;
    citation_count: number;
  }[];
  productive_authors: {
    author_id: number;
    author_name: string;
    paper_count: number;
  }[];
  popular_topics: {
    topic_id: number;
    topic_name: string;
    paper_count: number;
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch("/api/analytics", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please log in to view research analytics.");
          }
          throw new Error("Unable to load analytics.");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading research analytics...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-md">
          <h1 className="text-xl font-bold text-slate-900">
            Analytics unavailable
          </h1>
          <p className="mt-3 text-slate-600">
            {error || "No analytics data available."}
          </p>
          <a
            href="/login"
            className="inline-block mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-white font-semibold"
          >
            Sign in
          </a>
        </div>
      </main>
    );
  }

  const maxYearCount = Math.max(
    ...data.publication_trends.map((item) => item.paper_count),
    1
  );

  const maxTopicCount = Math.max(
    ...data.popular_topics.map((item) => item.paper_count),
    1
  );

  const maxAuthorCount = Math.max(
    ...data.productive_authors.map((item) => item.paper_count),
    1
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold text-indigo-700">
            ResearchLens
          </a>
          <a
            href="/"
            className="text-sm font-semibold text-slate-600 hover:text-indigo-600"
          >
            ← Back to Search
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
            Research Intelligence
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Research Analytics
          </h1>
          <p className="mt-3 text-slate-600 max-w-2xl">
            Explore publication trends, influential research papers,
            productive authors and popular research areas in ResearchLens.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <p className="text-sm text-slate-500">Total Papers</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {data.total_papers}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <p className="text-sm text-slate-500">Total Citations</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {data.total_citations}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <p className="text-sm text-slate-500">Total Authors</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {data.total_authors}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <p className="text-sm text-slate-500">Research Topics</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {data.total_topics}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          <section className="bg-white rounded-2xl border border-slate-200 p-7">
            <h2 className="text-xl font-bold text-slate-900">
              Publication Trends
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Number of papers published each year
            </p>

            <div className="mt-8 space-y-4">
              {data.publication_trends.map((item) => (
                <div key={item.year}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">{item.year}</span>
                    <span className="font-semibold text-slate-800">
                      {item.paper_count}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{
                        width: `${(item.paper_count / maxYearCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-7">
            <h2 className="text-xl font-bold text-slate-900">
              Most Cited Papers
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Papers ranked by incoming citations
            </p>

            <div className="mt-6 space-y-4">
              {data.most_cited_papers.map((paper, index) => (
                <div
                  key={paper.paper_id}
                  className="flex gap-4 border-b border-slate-100 pb-4 last:border-0"
                >
                  <span className="w-8 h-8 shrink-0 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/citations/${paper.paper_id}`}
                      className="font-semibold text-slate-800 hover:text-indigo-600"
                    >
                      {paper.title}
                    </a>
                    <p className="text-xs text-slate-500 mt-1">
                      {paper.publication_year ?? "Year unavailable"}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-indigo-700 whitespace-nowrap">
                    {paper.citation_count} citations
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-7">
            <h2 className="text-xl font-bold text-slate-900">
              Productive Authors
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Authors with the most papers in the database
            </p>

            <div className="mt-7 space-y-5">
              {data.productive_authors.map((author, index) => (
                <div key={author.author_id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">
                      {index + 1}. {author.author_name}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {author.paper_count} papers
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-600 rounded-full"
                      style={{
                        width: `${(author.paper_count / maxAuthorCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-7">
            <h2 className="text-xl font-bold text-slate-900">
              Popular Research Topics
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Research areas ranked by associated papers
            </p>

            <div className="mt-7 space-y-5">
              {data.popular_topics.map((topic, index) => (
                <div key={topic.topic_id}>
                  <div className="flex justify-between items-center mb-2 gap-3">
                    <span className="text-sm font-medium text-slate-700">
                      {index + 1}. {topic.topic_name}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {topic.paper_count}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{
                        width: `${(topic.paper_count / maxTopicCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <p className="text-xs text-slate-400 text-center mt-10">
          Analytics are calculated from the research papers and relationships
          currently stored in the ResearchLens database.
        </p>
      </div>
    </main>
  );
}
