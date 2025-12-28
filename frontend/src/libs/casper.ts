import { CASPER_CLOUD_ENDPOINT } from "@/configs/constants";
import { HttpHandler, RpcClient } from "casper-js-sdk";

const rpcHandler = new HttpHandler(CASPER_CLOUD_ENDPOINT);
rpcHandler.setCustomHeaders({
  Authorization: "55f79117-fc4d-4d60-9956-65423f39a06a",
});

export const rpcClient = new RpcClient(rpcHandler);