import { API_BASE_URL } from "../config/app";
import type { ApiResponse } from "../types/api";
import { isApiResponse } from "../types/api";

type Primitive = string | number | boolean;

type RequestOptions = {
  query?: Record<string, Primitive | null | undefined>;
  body?: unknown;
  signal?: AbortSignal;
};

type TokenGetter = () => Promise<string | null>;

const buildUrl = (path: string, query?: RequestOptions["query"]): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
};

const unexpectedPayloadError = <T>(status: number): ApiResponse<T> => ({
  ok: false,
  status: 500,
  data: null,
  error: {
    code: "INVALID_API_RESPONSE",
    detail: `Respuesta inesperada de la API (HTTP ${status}).`
  }
});

export class ApiClient {
  private readonly getToken: TokenGetter;

  constructor(getToken: TokenGetter) {
    this.getToken = getToken;
  }

  async get<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path, options);
  }

  async post<T>(path: string, body?: unknown, options: Omit<RequestOptions, "body"> = {}): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, { ...options, body });
  }

  async put<T>(path: string, body?: unknown, options: Omit<RequestOptions, "body"> = {}): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, { ...options, body });
  }

  async delete<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path, options);
  }

  private async request<T>(method: string, path: string, options: RequestOptions): Promise<ApiResponse<T>> {
    const token = await this.getToken();

    const headers: HeadersInit = {
      Accept: "application/json"
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(buildUrl(path, options.query), {
        method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: options.signal
      });

      let payload: unknown = null;

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (isApiResponse<T>(payload)) {
        return payload;
      }

      if (!response.ok) {
        return {
          ok: false,
          status: 500,
          data: null,
          error: {
            code: "HTTP_ERROR",
            detail: `HTTP ${response.status}: ${response.statusText || "Error"}`
          }
        };
      }

      return unexpectedPayloadError<T>(response.status);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          ok: false,
          status: 500,
          data: null,
          error: {
            code: "REQUEST_ABORTED",
            detail: "La petición fue cancelada."
          }
        };
      }

      return {
        ok: false,
        status: 500,
        data: null,
        error: {
          code: "NETWORK_ERROR",
          detail: "No se pudo conectar con la API."
        }
      };
    }
  }
}
