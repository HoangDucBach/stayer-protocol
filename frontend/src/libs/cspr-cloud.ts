import axios from "axios";

export const csprApiClient = axios.create({
  baseURL: '/api/casper',
  headers: {
    Accept: "application/json",
    Authorization: "55f79117-fc4d-4d60-9956-65423f39a06a",
  },
});
