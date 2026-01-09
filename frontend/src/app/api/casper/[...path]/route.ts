import { NextRequest } from "next/server";

// Use cspr.cloud API for better token ownership support
const BASE = "https://api.testnet.cspr.cloud";
const API_KEY = process.env.CASPER_API_KEY;

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const search = req.nextUrl.search;

  const targetUrl = `${BASE}/${path}${search}`;

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  // Add authorization header if API key is available
  if (API_KEY) {
    headers["Authorization"] = API_KEY;
  }

  const res = await fetch(targetUrl, {
    headers,
    cache: "no-store",
  });

  const body = await res.text();

  return new Response(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
