import { NextResponse } from "next/server";

const API_URL = "http://127.0.0.1:8000/api/reading-lists";

type RouteContext = {
  params: Promise<{
    list_id: string;
    paper_id: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { list_id, paper_id } = await context.params;

    const response = await fetch(
      `${API_URL}/${list_id}/papers/${paper_id}`,
      {
        method: "DELETE",
        headers: {
          Cookie: request.headers.get("cookie") ?? "",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { detail: "Unable to remove paper from reading list." },
      { status: 500 }
    );
  }
}

