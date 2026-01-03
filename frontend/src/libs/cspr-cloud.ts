import { CASPER_CLOUD_API_URL } from "@/configs/constants";
import axios from "axios";

export const csprCloudClient = axios.create({
  baseURL: CASPER_CLOUD_API_URL,
  headers: {
    Accept: "application/json",
    Authorization: "55f79117-fc4d-4d60-9956-65423f39a06a",
  },
});
