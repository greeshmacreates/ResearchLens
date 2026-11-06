import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await context.params;

    if (!/^\d+$/.test(user_id)) {
      return NextResponse.json(
        { detail: "Invalid user ID." },
        { status: 400 }
      );
    }

    const cookie = request.headers.get("cookie");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (cookie) {
      headers.Cookie = cookie;
    }

    const body = await request.text();

    const upstream = await fetch(
      `http://127.0.0.1:8000/api/admin/users/${user_id}/role`,
      {
        method: "PATCH",
        headers,
        body,
        cache: "no-store",
      }
    );

    const data = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });

  } catch (error) {
    console.error("Role update proxy error:", error);

    return NextResponse.json(
      { detail: "Unable to update user role." },
      { status: 502 }
    );
  }
}
