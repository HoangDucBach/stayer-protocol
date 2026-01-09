import { NextRequest } from "next/server";

// Proxy RPC calls to Casper node with authentication
const RPC_URL = "https://node.testnet.cspr.cloud/rpc";
const API_KEY = process.env.CASPER_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (API_KEY) {
      headers["Authorization"] = API_KEY;
    }

    const res = await fetch(RPC_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.text();

    return new Response(data, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
