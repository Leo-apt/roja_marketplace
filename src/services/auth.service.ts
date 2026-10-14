const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "");
const KEY = "roja_session";
export const AUTH_EXPIRED = "auth:expired";

export interface Tokens { access_token: string; refresh_token: string }
export interface UserData { user_name: string; user_email: string; user_role: string; user_status: boolean }
export interface Session { tokens: Tokens; user: UserData }
interface LoginResponse { userData: UserData; token: Tokens }
export interface RegisterPayload { name: string; email: string; password: string }
export interface LoginPayload { email: string; password: string }

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

/* ---------- session storage ---------- */
export const getSession = (): Session | null => {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
        return null;
    }
};
const saveSession = (s: Session) => localStorage.setItem(KEY, JSON.stringify(s));
export const clearSession = () => localStorage.removeItem(KEY);

/* ---------- low-level request ---------- */
async function toError(res: Response) {
    let msg = res.statusText || "Request failed";
    try {
        const b = await res.json();
        msg = Array.isArray(b.message) ? b.message.join(", ") : (b.message ?? msg);
        if (Array.isArray(b.missing)) msg += ": " + b.missing.join(", ");
    } catch { /* keep default */ }
    return new ApiError(res.status, msg);
}

async function raw<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${BASE}${path}`, {
            ...init,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(init.headers as Record<string, string> | undefined),
            },
        });
    } catch {
        throw new ApiError(0, "Cannot reach the server. Please try again.");
    }
    if (!res.ok) throw await toError(res);
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (body && typeof body === "object" && typeof body.success === "boolean") {
        if (!body.success) {
            let m = Array.isArray(body.message) ? body.message.join(", ") : body.message || "Request failed";
            if (Array.isArray(body.missing)) m += ": " + body.missing.join(", ");
            throw new ApiError(res.status, m);
        }
    }
    return body as T; // keep the { success, message, data, meta } wrapper; apiCall and the auth calls read .data
}

/* ---------- refresh (single-flight) ---------- */
let refreshing: Promise<Tokens | null> | null = null;

async function doRefresh(refreshToken: string): Promise<Tokens | null> {
    try {
        const t = (await raw<Wrapped<Tokens>>("/auth/refresh-token", { method: "POST", body: JSON.stringify({ refreshToken }) })).data;
        const s = getSession();
        if (s) saveSession({ ...s, tokens: t });
        return t;
    } catch {
        return null;
    }
}

export function refreshTokens(): Promise<Tokens | null> {
    const rt = getSession()?.tokens.refresh_token;
    if (!rt) return Promise.resolve(null);
    if (!refreshing) refreshing = doRefresh(rt).finally(() => { refreshing = null; });
    return refreshing;
}

/** Use this for every protected API call: adds the Bearer token and retries once after a refresh. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    try {
        return await raw<T>(path, init, getSession()?.tokens.access_token);
    } catch (e) {
        if (!(e instanceof ApiError) || e.status !== 401) throw e;
        const fresh = await refreshTokens();
        if (!fresh) {
            clearSession();
            window.dispatchEvent(new Event(AUTH_EXPIRED));
            throw e;
        }
        return raw<T>(path, init, fresh.access_token);
    }
}

export interface Wrapped<T> {
    success: boolean;
    message?: string;
    data: T;
    meta?: { total: number; page: number; limit: number; totalPages: number };
}

// success true -> return the response; success false -> throw so the page shows the message
export async function apiCall<T>(path: string, init: RequestInit = {}): Promise<Wrapped<T>> {
    const r = await apiFetch<Wrapped<T>>(path, init);
    if (!r.success) throw new Error(r.message || "Request failed");
    return r;
}

/* ---------- auth endpoints ---------- */
export const authService = {
    /** Backend returns tokens on register; we ignore them so the user must log in next. */
    async register(p: RegisterPayload): Promise<void> {
        await raw<Tokens>("/auth/user-register", { method: "POST", body: JSON.stringify(p) });
    },

    async login(p: LoginPayload): Promise<Session> {
        const r = (await raw<Wrapped<LoginResponse>>("/auth/login", { method: "POST", body: JSON.stringify(p) })).data;
        if (!r?.token?.access_token || !r.userData) throw new ApiError(500, "Unexpected login response from the server");
        const s: Session = { tokens: r.token, user: r.userData };
        saveSession(s);
        return s;
    },

    async logout(): Promise<void> {
        const t = getSession()?.tokens;
        clearSession();
        if (!t) return;
        try {
            await raw("/auth/logout", { method: "POST", body: "{}" }, t.access_token);
        } catch { /* already logged out locally */ }
    },

    me: () => apiCall<{ id: string; email: string; role: string }>("/auth/me").then((r) => r.data),
};