// Endereço do servidor Spring Boot na rede local (use o IP do computador, não localhost, para testar no celular).
// Exemplo: 'http://192.168.1.100:8080/api/v1'
export const API_BASE_URL = 'http://10.120.250.2:8080/api/v1';

export class ApiError extends Error {
    status: number;
    body?: unknown;

    constructor(status: number, message?: string, body?: unknown) {
        super(message || `Erro na requisição HTTP (${status})`);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers as Record<string, string> | undefined),
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorBody: unknown = undefined;
        let errorMessage = `Erro HTTP ${response.status}`;
        try {
            const text = await response.text();
            if (text) {
                errorBody = JSON.parse(text);
                if (
                    typeof errorBody === 'object' &&
                    errorBody !== null &&
                    'mensagem' in errorBody &&
                    typeof (errorBody as { mensagem?: unknown }).mensagem === 'string'
                ) {
                    errorMessage = (errorBody as { mensagem: string }).mensagem;
                }
            }
        } catch {
            // Ignora erro de parse do corpo de erro
        }
        throw new ApiError(response.status, errorMessage, errorBody);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const text = await response.text();
    if (!text) {
        return undefined as T;
    }

    return JSON.parse(text) as T;
}

export function get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' });
}

export function post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export function put<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

export function del<T = void>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
}
