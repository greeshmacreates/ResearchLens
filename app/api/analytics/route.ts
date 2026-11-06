import { NextRequest, NextResponse } from "next/server";

const API_URL = "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";

    const response = await fetch(`${API_URL}/api/analytics`, {
      method: "GET",
      headers: {
        Cookie: cookie,
      },
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Analytics API error:", error);

    return NextResponse.json(
      { detail: "Unable to retrieve research analytics." },
      { status: 500 }
    );
  }
}
