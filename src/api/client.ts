const TOKEN_KEY = 'apple_invest_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage issues
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type');
    let json: any = null;
    if (contentType && contentType.includes('application/json')) {
      json = await res.json();
    }

    if (!res.ok) {
      return { error: json?.error || `Erro de rede (${res.status})` };
    }

    return { data: json };
  } catch (err: any) {
    return { error: err?.message || 'Falha na comunicação com o servidor.' };
  }
}
