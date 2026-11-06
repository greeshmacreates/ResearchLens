import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const query =
      typeof body.query === "string" ? body.query.trim() : "";

    const limit =
      typeof body.limit === "number" ? body.limit : 5;

    const min_year =
      typeof body.min_year === "number" ? body.min_year : null;

    const max_year =
      typeof body.max_year === "number" ? body.max_year : null;

    const topic =
      typeof body.topic === "string" && body.topic.trim()
        ? body.topic.trim()
        : null;

    if (!query) {
      return NextResponse.json(
        { error: "Please enter a research question." },
        { status: 400 }
      );
    }

    if (
      min_year !== null &&
      max_year !== null &&
      min_year > max_year
    ) {
      return NextResponse.json(
        { error: "Minimum year cannot exceed maximum year." },
        { status: 400 }
      );
    }

    const response = await fetch(
      "http://127.0.0.1:8000/api/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          limit,
          min_year,
          max_year,
          topic,
        }),
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("ResearchLens search API error:", error);

    return NextResponse.json(
      {
        error:
          "Could not connect to the search service. Check that the Python API is running.",
      },
      { status: 502 }
    );
  }
}
