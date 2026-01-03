import { csprCloudClient } from "@/libs/cspr-cloud";
import { Block, PaginatedResponse } from "@/types/cspr";
import { AxiosError } from "axios";
import { NextRequest } from "next/server";

// GET /blocks
// https://docs.cspr.cloud/rest-api/block/get-blocks

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hash = searchParams.get("hash");
    const height = searchParams.get("height");
    const proposer = searchParams.get("proposer_public_key");

    // Build query params
    const params: Record<string, string | number> = {
      page: 1,
      page_size: 1,
      order_by: "block_height",
      order_direction: "DESC",
    };

    if (hash) params.block_hash = hash;
    if (height) params.block_height = height;
    if (proposer) params.proposer_public_key = proposer;

    const result = await csprCloudClient.get<PaginatedResponse<Block>>(
      "/blocks",
      { params }
    );

    const blocks = result.data.data;

    if (blocks.length === 0) {
      return Response.json({ error: "Block not found" }, { status: 404 });
    }

    const block = blocks[0];

    return Response.json({
      data: {
        hash: block.hash,
        height: block.height,
        era_id: block.era_id,
        timestamp: block.timestamp,
        proposer: block.proposer,
        state_root_hash: block.state_root_hash,
        deploy_count: block.deploy_count,
        transfer_count: block.transfer_count,
        is_switch_block: block.is_switch_block,
      },
    });
  } catch (err: AxiosError | unknown) {
    console.error("Error fetching block:", err);
    if (err instanceof AxiosError) {
      const message =
        err.response?.data?.message || "Failed to fetch block";
      return Response.json(
        { error: message },
        { status: err.response?.status || 500 }
      );
    }
    const message = (err as Error).message || "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
