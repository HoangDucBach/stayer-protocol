import { csprCloudClient } from "@/libs/cspr-cloud";
import { AuctionMetrics, SingleResponse } from "@/types/cspr";
import { AxiosError } from "axios";

// GET /auction-metrics
// https://docs.cspr.cloud/rest-api/auction-metrics/get-auction-metrics

export async function GET() {
  try {
    const result = await csprCloudClient.get<SingleResponse<AuctionMetrics>>(
      "/auction-metrics"
    );

    const auctionMetrics = result.data.data;
    const currentEra = auctionMetrics.era_id || auctionMetrics.current_era_id || 0;

    return Response.json({
      data: {
        currentEra,
        auctionMetrics,
      },
    });
  } catch (err: AxiosError | unknown) {
    console.error("Error fetching auction metrics:", err);
    if (err instanceof AxiosError) {
      const message =
        err.response?.data?.message || "Failed to fetch auction metrics";
      return Response.json(
        { error: message },
        { status: err.response?.status || 500 }
      );
    }
    const message = (err as Error).message || "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
