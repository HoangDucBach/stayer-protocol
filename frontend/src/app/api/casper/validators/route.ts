import { csprCloudClient } from "@/libs/cspr-cloud";
import {
  AuctionMetrics,
  PaginatedResponse,
  SingleResponse,
  Validator,
} from "@/types/cspr";
import { AxiosError } from "axios";
import { NextRequest } from "next/server";

// GET /validators
// https://docs.cspr.cloud/rest-api/validator/get-validators

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get query params
    const publicKey = searchParams.get("public_key");
    const isActive = searchParams.get("is_active");
    const eraId = searchParams.get("era_id");
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("page_size") || "100";
    const orderBy = searchParams.get("order_by") || "total_stake";
    const orderDirection = searchParams.get("order_direction") || "DESC";

    // If no era_id provided, get current era from auction-metrics
    let currentEraId = eraId;
    if (!currentEraId) {
      const auctionResult = await csprCloudClient.get<
        SingleResponse<AuctionMetrics>
      >("/auction-metrics");
      const metrics = auctionResult.data.data;
      currentEraId = String(metrics.era_id || metrics.current_era_id || 0);
    }

    // Build query params
    const params: Record<string, string> = {
      era_id: currentEraId,
      page,
      page_size: pageSize,
      order_by: orderBy,
      order_direction: orderDirection,
    };

    if (publicKey) params.public_key = publicKey;
    if (isActive !== null && isActive !== undefined) params.is_active = isActive;

    const result = await csprCloudClient.get<PaginatedResponse<Validator>>(
      "/validators",
      { params }
    );

    return Response.json({
      data: result.data.data,
      item_count: result.data.item_count,
      page_count: result.data.page_count,
      era_id: Number(currentEraId),
    });
  } catch (err: AxiosError | unknown) {
    console.error("Error fetching validators:", err);
    if (err instanceof AxiosError) {
      const message =
        err.response?.data?.message || "Failed to fetch validators";
      return Response.json(
        { error: message },
        { status: err.response?.status || 500 }
      );
    }
    const message = (err as Error).message || "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
