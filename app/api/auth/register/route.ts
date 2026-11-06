import { NextRequest } from "next/server";
import { proxyAuth } from "../proxy";

export async function POST(request: NextRequest) {
  return proxyAuth(request, "register", "POST");
}
