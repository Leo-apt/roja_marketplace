import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthCtx } from "./authContext";
import { AUTH_EXPIRED, authService, getSession, type UserData } from "@/services/auth.service";

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
        authService.me().catch(() => { /* 401 is handled via AUTH_EXPIRED */ }).finally(() => setReady(true));
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const s = await authService.login({ email, password });
        setUser(s.user);
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        await authService.register({ name, email, password });
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
    }, []);

    const value = useMemo<AuthCtx>(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}