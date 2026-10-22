import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthCtx } from "./authContext";
import { AUTH_EXPIRED, authService, getSession, refreshTokens, type UserData } from "@/services/auth.service";

const IDLE_MS = 30 * 60 * 1000; // logout after 30 minutes with no activity
const ACTIVE_KEY = "roja_last_active"; // shared by all tabs
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData | null>(() => getSession()?.user ?? null);
    const [ready, setReady] = useState(() => !getSession());

    useEffect(() => {
        const onExpired = () => setUser(null);
        window.addEventListener(AUTH_EXPIRED, onExpired);
        return () => window.removeEventListener(AUTH_EXPIRED, onExpired);
    }, []);

    // On reload, verify the stored token (auto-refreshes if expired)
    useEffect(() => {
        if (!getSession()) return;
        authService.me()
            .then((me) => setUser((u) => (u ? { ...u, user_name: me.name } : u)))
            .catch(() => { /* 401 is handled via AUTH_EXPIRED */ })
            .finally(() => setReady(true));
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const s = await authService.login({ email, password });
        try { localStorage.setItem(ACTIVE_KEY, String(Date.now())); } catch { /* ignore */ }
        setUser(s.user);
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        await authService.register({ name, email, password });
    }, []);

    const logout = useCallback(async () => {
        try { localStorage.removeItem(ACTIVE_KEY); } catch { /* ignore */ }
        await authService.logout();
        setUser(null);
    }, []);

    // Re-reads the name from a fresh token (used after a profile save)
    const refreshUser = useCallback(async () => {
        await refreshTokens();
        const me = await authService.me();
        setUser((u) => (u ? { ...u, user_name: me.name } : u));
    }, []);

    // Idle timeout: logs out after IDLE_MS with no activity (all tabs share one clock)
    const loggedIn = !!user;
    useEffect(() => {
        if (!loggedIn) return;
        const read = () => {
            try { return Number(localStorage.getItem(ACTIVE_KEY)) || 0; } catch { return 0; }
        };
        const write = () => {
            try { localStorage.setItem(ACTIVE_KEY, String(Date.now())); } catch { /* ignore */ }
        };

        const last = read();
        if (last && Date.now() - last > IDLE_MS) { void logout(); return; } // away too long (closed browser)
        write();

        let lastWrite = Date.now();
        const onActivity = () => {
            const now = Date.now();
            if (now - lastWrite < 5000) return; // save at most every 5s
            lastWrite = now;
            write();
        };
        ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
        const timer = window.setInterval(() => {
            if (Date.now() - read() > IDLE_MS) void logout();
        }, 30_000);

        return () => {
            ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
            window.clearInterval(timer);
        };
    }, [loggedIn, logout]);

    const value = useMemo<AuthCtx>(() => ({ user, ready, login, register, logout, refreshUser }), [user, ready, login, register, logout, refreshUser]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}