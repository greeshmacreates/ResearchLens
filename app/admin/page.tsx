"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  total_users: number;
  researchers: number;
  admins: number;
  total_papers: number;
  total_topics: number;
  total_authors: number;
  total_citations: number;
  total_reading_lists: number;
  total_embeddings: number;
};

const statCards = [
  { key: "total_users", label: "Total Users", icon: "👥", description: "Registered accounts" },
  { key: "researchers", label: "Researchers", icon: "🎓", description: "Researcher accounts" },
  { key: "admins", label: "Administrators", icon: "🛡️", description: "Admin accounts" },
  { key: "total_papers", label: "Research Papers", icon: "📚", description: "Papers in database" },
  { key: "total_topics", label: "Research Topics", icon: "🏷️", description: "Available topics" },
  { key: "total_authors", label: "Authors", icon: "✍️", description: "Authors in database" },
  { key: "total_citations", label: "Citations", icon: "🔗", description: "Recorded paper citations" },
  { key: "total_reading_lists", label: "Reading Lists", icon: "📖", description: "Created reading lists" },
  { key: "total_embeddings", label: "Embeddings", icon: "🧠", description: "Generated paper vectors" },
] as const;

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function loadStats() {
    setRefreshing(true);
    setError("");

    try {
      const response = await fetch("/api/admin/stats", {
        cache: "no-store",
      });

      if (response.status === 401) {
        throw new Error("Please log in to access the admin dashboard.");
      }

      if (response.status === 403) {
        throw new Error("Access denied. Administrator privileges are required.");
      }

      if (!response.ok) {
        throw new Error("Could not load dashboard statistics.");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <Link href="/" className="text-2xl font-bold tracking-tight">
              Research<span className="text-indigo-600">Lens</span>
            </Link>
            <p className="mt-1 text-sm text-slate-500">Administration Portal</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
              Administrator
            </span>
            <Link
              href="/"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Control Center
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-slate-500">
              Monitor users, research content, and platform activity.
            </p>
          </div>

          <button
            onClick={loadStats}
            disabled={refreshing}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "↻ Refresh Statistics"}
          </button>
        </div>

        {loading && (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Loading dashboard statistics...
          </div>
        )}

        {error && (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-semibold text-red-700">Unable to load dashboard</h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button
              onClick={loadStats}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {stats && !loading && (
          <>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {statCards.map((card) => (
                <div
                  key={card.key}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">
                      {card.label}
                    </p>
                    <span className="text-2xl">{card.icon}</span>
                  </div>
                  <p className="mt-4 text-4xl font-bold tracking-tight">
                    {stats[card.key].toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>

            <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold">Platform Overview</h2>
              <p className="mt-2 text-sm text-slate-500">
                Your research discovery platform at a glance.
              </p>

              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-500">Paper Embedding Coverage</p>
                  <p className="mt-2 text-2xl font-bold">
                    {stats.total_papers === 0
                      ? "N/A"
                      : `${Math.round((stats.total_embeddings / stats.total_papers) * 100)}%`}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Papers with generated embeddings
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">User Accounts</p>
                  <p className="mt-2 text-2xl font-bold">
                    {stats.total_users}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Researchers and administrators
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Research Collection</p>
                  <p className="mt-2 text-2xl font-bold">
                    {stats.total_papers} Papers
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Across {stats.total_topics} research topics
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-sm text-slate-400">
          ResearchLens · Administration Portal
        </footer>
      </section>
    </main>
  );
}
