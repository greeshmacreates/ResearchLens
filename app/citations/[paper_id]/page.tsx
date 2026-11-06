"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Paper = {
  paper_id: number;
  title: string;
  publication_year: number | null;
  url: string | null;
  authors: string[];
};

type CitationEdge = {
  source: number;
  target: number;
};

type CitationNetwork = {
  root_paper_id: number;
  node_count: number;
  edge_count: number;
  nodes: Paper[];
  edges: CitationEdge[];
};

function ReadingCitationNetwork() {
  const params = useParams();
  const router = useRouter();

  const paperId = String(params.paper_id);

  const [network, setNetwork] = useState<CitationNetwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNetwork() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/papers/${paperId}/citation-network`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || data.error || "Could not load citation network.");
        }

        if (!cancelled) {
          setNetwork(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNetwork();

    return () => {
      cancelled = true;
    };
  }, [paperId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading citation network...</p>
      </main>
    );
  }

  if (error || !network) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <button
          onClick={() => router.push("/")}
          className="text-indigo-600 font-medium"
        >
          ← Back to ResearchLens
        </button>

        <div className="max-w-xl mx-auto mt-24 rounded-2xl bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-bold text-slate-800">
            Unable to load citation network
          </h1>
          <p className="mt-3 text-slate-500">{error}</p>
        </div>
      </main>
    );
  }

  const rootPaper = network.nodes.find(
    (paper) => paper.paper_id === network.root_paper_id
  );

  const connectedPapers = network.nodes.filter(
    (paper) => paper.paper_id !== network.root_paper_id
  );

  const positions = [
    { x: 180, y: 130 },
    { x: 680, y: 130 },
    { x: 180, y: 390 },
    { x: 680, y: 390 },
    { x: 430, y: 80 },
    { x: 430, y: 440 },
    { x: 100, y: 260 },
    { x: 760, y: 260 },
  ];

  const rootPosition = { x: 430, y: 260 };

  const nodePositions = new Map<number, { x: number; y: number }>();

  nodePositions.set(network.root_paper_id, rootPosition);

  connectedPapers.forEach((paper, index) => {
    nodePositions.set(
      paper.paper_id,
      positions[index % positions.length]
    );
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-2xl font-bold tracking-tight text-indigo-700"
          >
            ResearchLens
          </button>

          <button
            onClick={() => router.push("/")}
            className="text-sm font-medium text-slate-600 hover:text-indigo-600"
          >
            ← Back to Search
          </button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Knowledge Mapping
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Citation Network
          </h1>

          <p className="mt-2 text-slate-500">
            Explore how research papers are connected through citations.
          </p>
        </div>

        {rootPaper && (
          <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-3xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Selected Research Paper
                </span>

                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  {rootPaper.title}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {rootPaper.authors.join(", ") || "Author information unavailable"}
                  {rootPaper.publication_year
                    ? ` • ${rootPaper.publication_year}`
                    : ""}
                </p>
              </div>

              {rootPaper.url && (
                <a
                  href={rootPaper.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  View Paper ↗
                </a>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-white border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Connected Papers</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {network.node_count - 1}
            </p>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Citation Connections</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {network.edge_count}
            </p>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Total Network Nodes</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {network.node_count}
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">
                Citation Graph
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Select a paper node to explore its network.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-600" />
                Selected paper
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-400" />
                Connected paper
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-xl bg-slate-50">
            <svg
              viewBox="0 0 860 520"
              className="w-full min-w-[650px]"
              role="img"
              aria-label="Interactive citation network graph"
            >
              <defs>
                <marker
                  id="citation-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <path
                    d="M0,0 L0,6 L8,3 z"
                    fill="#818cf8"
                  />
                </marker>
              </defs>

              {network.edges.map((edge, index) => {
                const source = nodePositions.get(edge.source);
                const target = nodePositions.get(edge.target);

                if (!source || !target) return null;

                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const offset = 112;

                const startX = source.x + (dx / length) * offset;
                const startY = source.y + (dy / length) * offset;
                const endX = target.x - (dx / length) * offset;
                const endY = target.y - (dy / length) * offset;

                return (
                  <line
                    key={`${edge.source}-${edge.target}-${index}`}
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="#818cf8"
                    strokeWidth="2.5"
                    markerEnd="url(#citation-arrow)"
                  />
                );
              })}

              {network.nodes.map((paper) => {
                const position = nodePositions.get(paper.paper_id);

                if (!position) return null;

                const isRoot =
                  paper.paper_id === network.root_paper_id;

                return (
                  <g
                    key={paper.paper_id}
                    onClick={() =>
                      router.push(`/citations/${paper.paper_id}`)
                    }
                    className="cursor-pointer"
                  >
                    <title>{paper.title}</title>

                    <rect
                      x={position.x - 112}
                      y={position.y - 55}
                      width="224"
                      height="110"
                      rx="16"
                      fill={isRoot ? "#4f46e5" : "#38bdf8"}
                      stroke={isRoot ? "#312e81" : "#0284c7"}
                      strokeWidth="3"
                    />

                    <text
                      x={position.x}
                      y={position.y - 29}
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {`Paper ${paper.paper_id}`}
                    </text>

                    <text
                      x={position.x}
                      y={position.y - 7}
                      textAnchor="middle"
                      fill="white"
                      fontSize="10"
                    >
                      {paper.title.length > 30
                        ? `${paper.title.slice(0, 27)}...`
                        : paper.title}
                    </text>

                    <text
                      x={position.x}
                      y={position.y + 25}
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                    >
                      {paper.publication_year || "Year N/A"}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="text-xs text-slate-400 mt-3">
            Arrows point from the citing paper to the paper it references.
            This graph displays direct, one-hop citation connections.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Connected Research Papers
          </h2>

          {connectedPapers.length === 0 ? (
            <div className="rounded-xl bg-white border border-slate-200 p-8 text-center text-slate-500">
              No direct citation connections are available for this paper yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connectedPapers.map((paper) => (
                <article
                  key={paper.paper_id}
                  className="rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300 hover:shadow-sm transition"
                >
                  <p className="text-xs font-semibold text-indigo-600">
                    PAPER ID: {paper.paper_id}
                  </p>

                  <h3 className="mt-2 font-semibold text-slate-900">
                    {paper.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {paper.authors.join(", ") || "Author information unavailable"}
                    {paper.publication_year
                      ? ` • ${paper.publication_year}`
                      : ""}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-4">
                    <button
                      onClick={() =>
                        router.push(`/citations/${paper.paper_id}`)
                      }
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Explore Network →
                    </button>

                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                      >
                        View Paper ↗
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default function CitationNetworkPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          Loading citation network...
        </main>
      }
    >
      <ReadingCitationNetwork />
    </Suspense>
  );
}
