import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paper_id: string }> }
) {
  try {
    const { paper_id } = await params;

    if (!/^\d+$/.test(paper_id)) {
      return NextResponse.json(
        { error: "Invalid paper ID." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `http://127.0.0.1:8000/api/papers/${paper_id}/citation-network`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Citation network API error:", error);

    return NextResponse.json(
      {
        error:
          "Could not connect to the citation service. Check that the Python API is running.",
      },
      { status: 502 }
    );
  }
}
