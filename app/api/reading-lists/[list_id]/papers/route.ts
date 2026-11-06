import { NextResponse } from "next/server";

const API_URL = "http://127.0.0.1:8000/api/reading-lists";

type RouteContext = {
  params: Promise<{ list_id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { list_id } = await context.params;
    const body = await request.json();

    const response = await fetch(
      `${API_URL}/${list_id}/papers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") ?? "",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { detail: "Unable to add paper to reading list." },
      { status: 500 }
    );
  }
}
