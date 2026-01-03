import { NextRequest } from "next/server";

const BASE = process.env.CASPER_API_URL || "https://api.testnet.cspr.live";

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const search = req.nextUrl.search;

  const targetUrl = `${BASE}/${path}${search}`;

  const res = await fetch(targetUrl, {
    headers: {
      Accept: "application/json",
    },
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
