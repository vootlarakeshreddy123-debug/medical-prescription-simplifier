/**
 * Safe API Fetch utility to handle structured API responses, status codes, and non-JSON payloads gracefully.
 */

export interface ApiError {
  code?: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  errorCode?: string;
  raw?: any;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';

    let parsedBody: any = null;
    let isJson = false;

    if (contentType.includes('application/json')) {
      parsedBody = await res.json().catch(() => null);
      isJson = true;
    } else {
      const text = await res.text().catch(() => '');
      if (text && text.trim().length > 0) {
        try {
          parsedBody = JSON.parse(text);
          isJson = true;
        } catch {
          isJson = false;
          parsedBody = text;
        }
      }
    }

    // Standard structured error handling
    if (parsedBody && typeof parsedBody === 'object') {
      // If server explicitly returned success: false
      if (parsedBody.success === false) {
        const errorObj = parsedBody.error;
        const errorMsg =
          typeof errorObj === 'object'
            ? errorObj?.message || errorObj?.code || 'Processing error'
            : typeof errorObj === 'string'
            ? errorObj
            : parsedBody.message || `Request failed with status ${res.status}`;

        const errorCode =
          typeof errorObj === 'object' ? errorObj?.code : undefined;

        return {
          ok: false,
          status: res.status,
          error: errorMsg,
          errorCode: errorCode,
          raw: parsedBody,
        };
      }

      // If server explicitly returned success: true
      if (parsedBody.success === true) {
        const resultData =
          parsedBody.data !== undefined ? (parsedBody.data as T) : (parsedBody as unknown as T);
        return {
          ok: true,
          status: res.status,
          data: resultData,
          raw: parsedBody,
        };
      }

      // If success boolean is not present, check HTTP status
      if (!res.ok) {
        const errorObj = parsedBody.error;
        const errorMsg =
          typeof errorObj === 'object'
            ? errorObj?.message || errorObj?.code || 'Request failed'
            : typeof errorObj === 'string'
            ? errorObj
            : parsedBody.message || `Request failed with status ${res.status}`;

        return {
          ok: false,
          status: res.status,
          error: errorMsg,
          errorCode: typeof errorObj === 'object' ? errorObj?.code : undefined,
          raw: parsedBody,
        };
      }

      // HTTP 200 OK without wrapper
      const unwrappedData =
        parsedBody.data !== undefined ? (parsedBody.data as T) : (parsedBody as unknown as T);
      return {
        ok: true,
        status: res.status,
        data: unwrappedData,
        raw: parsedBody,
      };
    }

    // Non-JSON or empty response
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: `Server responded with status ${res.status}.`,
        raw: parsedBody,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: (parsedBody as unknown as T) || ({} as T),
      raw: parsedBody,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Network communication error.',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

