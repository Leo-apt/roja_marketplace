import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Layers, KeyRound, Pencil, Save } from "lucide-react";
import { DSection, DTile, DTiles, NotFound, StatusBadge } from "@/components/catalog/DetailBits";
import { btn, Field, Radio, TextInput } from "@/components/catalog/FormBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { useApp } from "@/hooks/useApp";
import { providersService, type ProviderCreds, type ProviderRec } from "@/services/providers.service";

const BASE = "/catalog/providers";
const na = (v?: string) => (v ? v : "N/A");
const emptyCreds: ProviderCreds = { mode: "live", apiUrl: "", tokenUrl: "", clientId: "", clientSecret: "", refreshToken: "", instanceUrl: "" };

function Secret({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <TextInput type={show ? "text" : "password"} value={value} className="pr-10" onChange={(e) => onChange(e.target.value)} />
            <button type="button" aria-label={show ? "Hide" : "Show"} onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
        </div>
    );
}

function Credentials({ id }: { id: string }) {
    const { toast } = useApp();
    const [saved, setSaved] = useState<ProviderCreds>(emptyCreds);
    const [c, setC] = useState<ProviderCreds>(emptyCreds);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;
        providersService.getCreds(id).then((r) => { if (live) { setSaved(r ?? emptyCreds); setC(r ?? emptyCreds); } }).finally(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, [id]);

    const set = <K extends keyof ProviderCreds>(k: K, v: ProviderCreds[K]) => {
        setC((p) => ({ ...p, [k]: v }));
        setErrors((p) => { const n = { ...p }; delete n[k]; return n; });
    };
    const save = async () => {
        const e: Record<string, string> = {};
        const req: [keyof ProviderCreds, string][] = [["apiUrl", "API URL"], ["tokenUrl", "Token URL"], ["clientId", "Client ID"], ["clientSecret", "Client Secret"], ["refreshToken", "Refresh Token"], ["instanceUrl", "Instance URL"]];
        for (const [k, label] of req) if (!c[k].trim()) e[k] = `${label} is required`;
        setErrors(e);
        if (Object.keys(e).length) return;
        setSaving(true);
        try { await providersService.saveCreds(id, c); setSaved(c); toast("Credentials saved"); }
        finally { setSaving(false); }
    };

    if (loading) return <LoadingBox />;
    return (
        <DSection title="Credentials">
            <div className="flex flex-col gap-5">
                <Field label="Mode" required>
                    <div className="flex gap-6 pt-1">
                        <Radio name="mode" label="Live" checked={c.mode === "live"} onChange={() => set("mode", "live")} />
                        <Radio name="mode" label="Sandbox" checked={c.mode === "sandbox"} onChange={() => set("mode", "sandbox")} />
                    </div>
                </Field>
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="API URL" required error={errors.apiUrl}><TextInput value={c.apiUrl} onChange={(e) => set("apiUrl", e.target.value)} /></Field>
                    <Field label="Token URL" required error={errors.tokenUrl}><TextInput value={c.tokenUrl} onChange={(e) => set("tokenUrl", e.target.value)} /></Field>
                    <Field label="Client ID" required error={errors.clientId}><TextInput value={c.clientId} onChange={(e) => set("clientId", e.target.value)} /></Field>
                    <Field label="Client Secret" required error={errors.clientSecret}><Secret value={c.clientSecret} onChange={(v) => set("clientSecret", v)} /></Field>
                    <Field label="Refresh Token" required error={errors.refreshToken}><Secret value={c.refreshToken} onChange={(v) => set("refreshToken", v)} /></Field>
                    <Field label="Instance URL" required error={errors.instanceUrl}><TextInput value={c.instanceUrl} onChange={(e) => set("instanceUrl", e.target.value)} /></Field>
                </div>
                <div className="flex justify-end gap-2">
                    <button className={btn.secondary} disabled={saving} onClick={() => { setC(saved); setErrors({}); }}>Cancel</button>
                    <button className={btn.primary} disabled={saving} onClick={() => void save()}>
                        <Save className="size-4" /> {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </DSection>
    );
}

export default function ProvidersDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const [rec, setRec] = useState<ProviderRec | null>(null);
    const [error, setError] = useState("");
    const [sp] = useSearchParams();
    const [tab, setTab] = useState<"overview" | "creds">(sp.get("tab") === "creds" ? "creds" : "overview");

    useEffect(() => {
        if (!id) return;
        let live = true;
        providersService.get(id)
            .then((r) => { if (live) setRec(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id]);

    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!id) return <NotFound backTo={BASE} />;
    if (!rec || rec.id !== id) return <LoadingBox />;

    return (
        <div className="flex flex-col gap-4">
            <section className="overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-bg">
                <div className="flex flex-wrap items-start gap-4 p-5">
                    {rec.logoUrl
                        ? <img src={rec.logoUrl} alt={rec.name} className="size-14 rounded-lg object-cover" />
                        : <span className="grid size-14 place-items-center rounded-lg bg-brandsoft text-lg font-bold text-brand">{rec.name[0]}</span>}
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-base font-bold text-sidebar-text-active">{rec.name}</h2>
                        <p className="text-xs text-sidebar-group">{rec.providerId}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <span className={`inline-flex h-8 w-24 items-center justify-center rounded-full text-xs font-bold capitalize text-white ${rec.status === "Active" ? "bg-good" : "bg-bad"}`}>{rec.status}</span>
                        <button type="button" className={`${btn.brand} !h-8 !min-h-0 w-24 justify-center !py-0`} onClick={() => nav(`${BASE}/${rec.id}/edit`)}>
                            <Pencil className="size-4" /> Edit
                        </button>
                    </div>
                </div>
                <div role="tablist" aria-label="Provider tabs" className="flex gap-1 bg-sidebar-border px-2 pt-2">
                    {([["overview", "Overview", Layers], ["creds", "Credentials", KeyRound]] as const).map(([k, t, Icon]) => (
                        <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                            className={`inline-flex items-center gap-2 rounded-t-lg border border-b-0 px-5 py-3 text-xs font-bold normal-case transition ${tab === k
                                ? "border-brand bg-brand text-white"
                                : "border-sidebar-active-border bg-white/60 text-sidebar-text-active hover:bg-white"}`}>
                            <Icon className="size-4" /> {t}
                        </button>
                    ))}
                </div>
            </section>

            <div className={tab === "overview" ? "" : "hidden"}>
                <DSection title="Overview">
                    <DTiles>
                        <DTile label="Company Name">{na(rec.name)}</DTile>
                        <DTile label="Email ID">{na(rec.email)}</DTile>
                        <DTile label="Cell Phone No">{na(rec.phone)}</DTile>
                        <DTile label="Status"><StatusBadge status={rec.status} /></DTile>
                        <DTile label="Created On">{na(rec.createdOn)}</DTile>
                        <DTile label="Last Updated On">{na(rec.updatedOn)}</DTile>
                        <DTile label="Created By">{na(rec.createdBy)}</DTile>
                        <DTile label="Last Updated By">{na(rec.updatedBy)}</DTile>
                    </DTiles>
                </DSection>
            </div>
            <div className={tab === "creds" ? "" : "hidden"}>
                <Credentials id={rec.id} />
            </div>
        </div>
    );
}