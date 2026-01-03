import { csprCloudClient } from "@/libs/cspr-cloud";
import { Account, SingleResponse } from "@/types/cspr";
import { AxiosError } from "axios";
import { NextRequest } from "next/server";

// GET /accounts/{account_identifier}
// https://docs.cspr.cloud/rest-api/account/get-account

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const publicKey = searchParams.get("public_key") || searchParams.get("publicKey");
    const accountHash = searchParams.get("account_hash");

    const accountIdentifier = publicKey || accountHash;

    if (!accountIdentifier) {
      return Response.json(
        { error: "public_key or account_hash is required" },
        { status: 400 }
      );
    }

    const result = await csprCloudClient.get<SingleResponse<Account>>(
      `/accounts/${accountIdentifier}`
    );

    const account = result.data.data;
    const balance = account.balance || "0";
    const balanceBigInt = BigInt(balance);
    const formatted = (Number(balanceBigInt) / 1e9).toFixed(4);

    return Response.json({
      data: {
        ...account,
        balanceFormatted: formatted,
      },
    });
  } catch (err: AxiosError | unknown) {
    console.error("Error fetching account:", err);
    if (err instanceof AxiosError) {
      const message =
        err.response?.data?.message || "Failed to fetch account";
      return Response.json(
        { error: message },
        { status: err.response?.status || 500 }
      );
    }
    const message = (err as Error).message || "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
