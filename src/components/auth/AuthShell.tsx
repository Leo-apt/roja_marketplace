import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field, inputCls } from "@/components/catalog/FormBits";

export function AuthShell({ title, subtitle, children, footer }: {
    title: string; subtitle: string; children: ReactNode; footer: ReactNode;
}) {
    return (
        <div className="grid min-h-screen place-items-center bg-page px-4 py-10">
            <div className="w-full max-w-[420px]">
                <div className="mb-6 flex items-center justify-center gap-[11px]">
                    <div className="grid size-[37px] place-items-center rounded-[9px] bg-brand text-[22px] font-extrabold text-white">R</div>
                    <div>
                        <strong className="text-lg tracking-[1.5px] text-ink">ROJA</strong>
                        <small className="block text-[10px] tracking-[0.8px] text-muted">BUSINESS CONSOLE</small>
                    </div>
                </div>
                <div className="rounded-2xl border border-line bg-white p-7 shadow-sm">
                    <h1 className="text-xl font-bold text-ink">{title}</h1>
                    <p className="mb-5 mt-1 text-xs text-muted">{subtitle}</p>
                    {children}
                </div>
                <p className="mt-4 text-center text-sm text-muted">{footer}</p>
            </div>
        </div>
    );
}

export function PasswordField({ label, value, onChange, error, autoComplete }: {
    label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <Field label={label} required error={error}>
            <div className="relative">
                <input className={`${inputCls} pr-10`} type={show ? "text" : "password"} value={value}
                    autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} />
                <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600">
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
            </div>
        </Field>
    );
}

export const Alert = ({ kind, children }: { kind: "error" | "success"; children: ReactNode }) => (
    <div role="alert" className={`mb-4 rounded-md px-3 py-2 text-xs ${kind === "error" ? "bg-badbg text-bad" : "bg-goodbg text-good"}`}>{children}</div>
);