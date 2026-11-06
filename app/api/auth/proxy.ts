import { NextRequest, NextResponse } from "next/server";

const API_URL = "http://127.0.0.1:8000";

export async function proxyAuth(
  request: NextRequest,
  endpoint: string,
  method: "GET" | "POST"
) {
  try {
    const headers: Record<string, string> = {};

    const cookie = request.headers.get("cookie");
    if (cookie) headers["Cookie"] = cookie;

    let body: string | undefined;

    if (method === "POST") {
      body = await request.text();
      if (body) headers["Content-Type"] = "application/json";
    }

    const upstream = await fetch(
      `${API_URL}/api/auth/${endpoint}`,
      {
        method,
        headers,
        body,
        cache: "no-store",
      }
    );

    const data = await upstream.json();

    const response = NextResponse.json(data, {
      status: upstream.status,
    });

    for (const cookieValue of upstream.headers.getSetCookie()) {
      response.headers.append("Set-Cookie", cookieValue);
    }

    return response;
  } catch (error) {
    console.error("Authentication proxy error:", error);

    return NextResponse.json(
      { detail: "Could not connect to the authentication service." },
      { status: 502 }
    );
  }
}
