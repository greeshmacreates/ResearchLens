import { NextResponse } from "next/server";

const API_URL = "http://127.0.0.1:8000/api/reading-lists";

type RouteContext = {
  params: Promise<{ list_id: string }>;
};

async function proxy(request: Request, listId: string, method: "GET" | "DELETE") {
  try {
    const response = await fetch(`${API_URL}/${listId}`, {
      method,
      headers: {
        Cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { detail: "Unable to process reading list request." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, context: RouteContext) {
  const { list_id } = await context.params;

  return proxy(request, list_id, "GET");
}

export async function DELETE(request: Request, context: RouteContext) {
  const { list_id } = await context.params;

  return proxy(request, list_id, "DELETE");
}
