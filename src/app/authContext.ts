import { createContext } from "react";
import type { UserData } from "@/services/auth.service";

export interface AuthCtx {
    user: UserData | null;
    ready: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthCtx | null>(null);