export const BUSINESS_TIMEZONE = "America/Guayaquil";

const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787").trim();

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");
