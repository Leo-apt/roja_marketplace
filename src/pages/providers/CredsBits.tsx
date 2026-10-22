import { useState, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff, FlaskConical, Rocket, type LucideIcon } from "lucide-react";
import { Field, TextInput } from "@/components/catalog/FormBits";
import { textError } from "@/utils/validate";
import type { ProviderCreds } from "@/services/providers.service";

export type Mode = ProviderCreds["mode"];
export type CredValues = Omit<ProviderCreds, "mode">;
export type CredKey = keyof CredValues;
export type Has = { secret: boolean; refresh: boolean };

export const MODES: { value: Mode; label: string; icon: LucideIcon; bar: string; text: string }[] = [
    { value: "sandbox", label: "Sandbox", icon: FlaskConical, bar: "bg-amber-500", text: "text-amber-600" },
    { value: "live", label: "Live", icon: Rocket, bar: "bg-emerald-500", text: "text-emerald-600" },
];

export const blankCreds: CredValues = { apiUrl: "", tokenUrl: "", clientId: "", clientSecret: "", refreshToken: "", instanceUrl: "" };

// Limits: change here
export const CRED_FIELDS: { key: CredKey; label: string; secret?: boolean; url?: boolean; min: number; max: number }[] = [
    { key: "apiUrl", label: "API URL", url: true, min: 10, max: 300 },
    { key: "tokenUrl", label: "Token URL", url: true, min: 10, max: 300 },
    { key: "clientId", label: "Client ID", min: 3, max: 200 },
    { key: "clientSecret", label: "Client Secret", secret: true, min: 8, max: 500 },
    { key: "refreshToken", label: "Refresh Token", secret: true, min: 8, max: 1000 },
    { key: "instanceUrl", label: "Instance URL", url: true, min: 10, max: 300 },
];

const URL_RE = /^https?:\/\/\S+\.\S+$/;

// a saved secret can be left blank on edit (the backend keeps the old one)
const keptOf = (k: CredKey, has: Has) => (k === "clientSecret" && has.secret) || (k === "refreshToken" && has.refresh);

export function credsErrors(c: CredValues, has: Has) {
    const e: Partial<Record<CredKey, string>> = {};
    for (const f of CRED_FIELDS) {
        const v = c[f.key];
        if (!v.trim() && keptOf(f.key, has)) continue;
        const m = textError(f.label, v, f.min, f.max);
        if (m) e[f.key] = m;
        else if (f.url && !URL_RE.test(v.trim())) e[f.key] = `${f.label} must be a valid URL starting with http:// or https://`;
    }
    return e;
}

function Secret(props: InputHTMLAttributes<HTMLInputElement>) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <TextInput {...props} type={show ? "text" : "password"} autoComplete="new-password" className="pr-10" />
            <button type="button" aria-label={show ? "Hide" : "Show"} onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
        </div>
    );
}

/** The 6 open fields: no spaces allowed, max length, live errors come from `error`. */
export function CredsFields({ idPrefix, values, has, error, onChange, onTouch }: {
    idPrefix: string; values: CredValues; has: Has;
    error: (k: CredKey) => string;
    onChange: (k: CredKey, v: string) => void;
    onTouch: (k: CredKey) => void;
}) {
    return (
        <div className="grid gap-5 sm:grid-cols-2">
            {CRED_FIELDS.map((f) => {
                const common = {
                    id: `${idPrefix}-${f.key}`,
                    value: values[f.key],
                    maxLength: f.max,
                    onChange: (e: ChangeEvent<HTMLInputElement>) => onChange(f.key, e.target.value.replace(/\s/g, "")),
                    onBlur: () => onTouch(f.key),
                };
                return (
                    <Field key={f.key} label={f.label} required error={error(f.key)}>
                        {f.secret
                            ? <Secret {...common} placeholder={keptOf(f.key, has) ? "Saved. Leave blank to keep" : ""} />
                            : <TextInput {...common} autoComplete="off" placeholder={f.url ? "https://" : ""} />}
                    </Field>
                );
            })}
        </div>
    );
}

export function CredsView({ values, has }: { values: CredValues; has: Has }) {
    return (
        <div className="grid gap-4 rounded-xl border border-line bg-surfacealt p-4 sm:grid-cols-2">
            {CRED_FIELDS.map((f) => {
                const v = values[f.key] || (f.secret && keptOf(f.key, has) ? "••••••••" : "");
                return (
                    <div key={f.key} className="min-w-0">
                        <p className="text-xs font-semibold text-muted">{f.label}</p>
                        <p className="mt-1 break-all text-sm text-ink">{v || "N/A"}</p>
                    </div>
                );
            })}
        </div>
    );
}

export function CredsSkeleton() {
    return (
        <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                    <div className="skeleton h-3 w-24" />
                    <div className="skeleton h-10 w-full" />
                </div>
            ))}
        </div>
    );
}

/** Card with the thick Sandbox / Live heading; `action` sits in the top right corner. */
export function CredsCardShell({ mode, action, children }: { mode: Mode; action?: ReactNode; children: ReactNode }) {
    const m = MODES.find((x) => x.value === mode)!;
    const Icon = m.icon;
    return (
        <section className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
            <div className={`h-1 ${m.bar}`} />
            <div className="flex items-center justify-between gap-3 px-5 py-4">
                <h3 className="inline-flex items-center gap-2 text-lg font-extrabold text-ink">
                    <Icon className={`size-5 ${m.text}`} /> {m.label}
                </h3>
                {action}
            </div>
            <div className="px-5 pb-5">{children}</div>
        </section>
    );
}