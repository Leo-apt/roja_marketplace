import { apiCall } from "./auth.service";
import type { TableId } from "@/pages/settings/columnPrefs";

// frontend table id -> backend table key
const TABLE_API: Record<TableId, string> = {
    products: "products",
    categories: "categories",
    bundles: "bundles",
    clients: "clients",
    "Engine configuration": "engine-configurations",
};

export interface ProfileView { id: string; name: string; email: string; phone: string | null; role: string; profileImageUrl?: string | null }
export interface PrefsView { theme: "light" | "dark" | "system"; language: string; currency: string; dateFormat: string; timeZone: string }
export interface ColumnView { key: string; label: string; locked: boolean; visible: boolean; order: number }
export interface ColumnsView { table: string; shown: number; total: number; columns: ColumnView[] }

export const settingsService = {
    getProfile: () =>
        apiCall<ProfileView>("/settings/profile").then((r) => r.data),
    // phone: null clears it (an empty string would fail the backend regex)
    updateProfile: (p: { name?: string; phone?: string | null }) =>
        apiCall<ProfileView>("/settings/profile", { method: "PATCH", body: JSON.stringify(p) }).then((r) => r.data),

    getPreferences: () =>
        apiCall<PrefsView>("/settings/preferences").then((r) => r.data),
    updatePreferences: (p: Partial<PrefsView>) =>
        apiCall<PrefsView>("/settings/preferences", { method: "PATCH", body: JSON.stringify(p) }).then((r) => r.data),

    getColumns: (t: TableId) =>
        apiCall<ColumnsView>(`/settings/columns/${TABLE_API[t]}`).then((r) => r.data),
    saveColumns: (t: TableId, columns: { key: string; visible: boolean }[]) =>
        apiCall<ColumnsView>(`/settings/columns/${TABLE_API[t]}`, { method: "PUT", body: JSON.stringify({ columns }) }).then((r) => r.data),
    resetColumns: (t: TableId) =>
        apiCall<ColumnsView>(`/settings/columns/${TABLE_API[t]}`, { method: "DELETE" }).then((r) => r.data),
};