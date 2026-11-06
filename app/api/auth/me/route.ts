import { NextRequest } from "next/server";
import { proxyAuth } from "../proxy";

export async function GET(request: NextRequest) {
  return proxyAuth(request, "me", "GET");
}
