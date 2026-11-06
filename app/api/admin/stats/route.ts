import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie");
    const headers: Record<string, string> = {};

    if (cookie) {
      headers["Cookie"] = cookie;
    }

    const upstream = await fetch(
      "http://127.0.0.1:8000/api/admin/stats",
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    );

    const data = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Admin statistics proxy error:", error);

    return NextResponse.json(
      { detail: "Could not connect to the admin service." },
      { status: 502 }
    );
  }
}
