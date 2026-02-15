/**
 * HTTP API client for the VoyageAI Java backend.
 *
 * All requests go through the Vite proxy (/api -> localhost:8081)
 * so we don't need CORS configuration in development.
 */
import Cookies from 'js-cookie';

const BASE_URL = '/api';

class ApiClient {
  private getToken(): string | undefined {
    return Cookies.get('token');
  }

  private getHeaders(json = true): HeadersInit {
    const headers: HeadersInit = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (json) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: this.getHeaders(false),
    });
    if (!res.ok) {
      throw new ApiError(res.status, await res.text());
    }
    return res.json();
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new ApiError(res.status, await res.text());
    }
    return res.json();
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new ApiError(res.status, await res.text());
    }
    return res.json();
  }

  async delete(path: string): Promise<void> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(false),
    });
    if (!res.ok) {
      throw new ApiError(res.status, await res.text());
    }
  }

  /**
   * Create an SSE (Server-Sent Events) connection for real-time updates.
   * Returns the EventSource for the caller to attach listeners.
   */
  createSSE(path: string): EventSource {
    const token = this.getToken();
    const url = `${BASE_URL}${path}${token ? `?token=${token}` : ''}`;
    return new EventSource(url);
  }
}

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`API Error ${status}: ${body}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export const apiClient = new ApiClient();
