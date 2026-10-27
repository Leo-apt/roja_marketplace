import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Layers, KeyRound, Pencil, Save } from "lucide-react";
import { DSection, DTile, DTiles, NotFound, StatusBadge } from "@/components/catalog/DetailBits";
import { btn } from "@/components/catalog/FormBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { useApp } from "@/hooks/useApp";
import { providersService, type ProviderRec, type CredsView as SavedCreds } from "@/services/providers.service";
import {
    blankCreds, CRED_FIELDS, credsErrors, CredsCardShell, CredsFields, CredsSkeleton, CredsView, MODES,
    type CredKey, type CredValues, type Mode,
} from "./CredsBits";
import { fmtPhone } from "./List";

const BASE = "/catalog/providers";
const na = (v?: string) => (v ? v : "N/A");

function CredCard({ id, mode, initial }: { id: string; mode: Mode; initial: SavedCreds | null }) {
    const { toast, toastError } = useApp();
    const [has, setHas] = useState({ exists: !!initial, secret: !!initial?.hasSecret, refresh: !!initial?.hasRefresh });
    const [saved, setSaved] = useState<CredValues>(initial?.creds ?? blankCreds);
    const [c, setC] = useState<CredValues>(initial?.creds ?? blankCreds);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const loading = false; // data arrives with the provider
    const [editing, setEditing] = useState(!initial); // nothing saved yet: open the fields

    const errors = credsErrors(c, has);
    const err = (k: CredKey) => (touched[k] || submitted ? errors[k] ?? "" : "");
    const touch = (k: CredKey) => setTouched((p) => ({ ...p, [k]: true }));
    const set = (k: CredKey, v: string) => { setC((p) => ({ ...p, [k]: v })); touch(k); };
    const reset = () => { setC(saved); setTouched({}); setSubmitted(false); };
    const startEdit = () => { reset(); setEditing(true); };
    const cancel = () => { reset(); setEditing(!has.exists); };

    const save = async () => {
        setSubmitted(true);
        const first = CRED_FIELDS.find((f) => errors[f.key]);
        if (first) { document.getElementById(`cred-${mode}-${first.key}`)?.focus(); return; }
        setSaving(true);
        try {
            await providersService.saveCreds(id, { ...c, mode }, has.exists);
            const next: CredValues = { ...c, clientSecret: c.clientSecret || saved.clientSecret, refreshToken: c.refreshToken || saved.refreshToken };
            setHas({ exists: true, secret: has.secret || !!c.clientSecret, refresh: has.refresh || !!c.refreshToken });
            setSaved(next); setC(next);
            setTouched({}); setSubmitted(false);
            toast(has.exists ? "Credentials updated" : "Credentials saved");
            setEditing(false);
        } catch (e) { toastError(e instanceof Error ? e.message : "Save failed"); }
        finally { setSaving(false); }
    };

    return (
        <CredsCardShell mode={mode}
            action={!loading && has.exists && !editing ? (
                <button type="button" aria-label={`Edit ${mode} credentials`} title="Edit" onClick={startEdit}
                    className="grid size-9 place-items-center rounded-lg border border-line bg-white text-ink transition hover:border-brand hover:text-brand">
                    <Pencil className="size-4" />
                </button>
            ) : undefined}>
            {loading ? <CredsSkeleton /> : !editing ? <CredsView values={saved} has={has} /> : (
                <div className="flex flex-col gap-5">
                    <CredsFields idPrefix={`cred-${mode}`} values={c} has={has} error={err} onChange={set} onTouch={touch} />
                    <div className="flex justify-end gap-2">
                        <button className={btn.secondary} disabled={saving} onClick={cancel}>Cancel</button>
                        <button className={btn.primary} disabled={saving} onClick={() => void save()}>
                            <Save className="size-4" /> {saving ? (has.exists ? "Updating…" : "Saving…") : has.exists ? "Update" : "Save"}
                        </button>
                    </div>
                </div>
            )}
        </CredsCardShell>
    );
}

export default function ProvidersDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const [data, setData] = useState<{ rec: ProviderRec; sandbox: SavedCreds | null; live: SavedCreds | null } | null>(null);
    const [error, setError] = useState("");
    const [sp] = useSearchParams();
    const [tab, setTab] = useState<"overview" | "creds">(sp.get("tab") === "creds" ? "creds" : "overview");
    const [logoBad, setLogoBad] = useState(false);

    useEffect(() => {
        if (!id) return;
        let live = true;
        providersService.getWithCreds(id)
            .then((r) => { if (live) setData(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id]);

    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!id) return <NotFound backTo={BASE} />;
    if (!data || data.rec.id !== id) return <LoadingBox />;
    const rec = data.rec;

    return (
        <div className="flex flex-col gap-4">
            <section className="overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-bg">
                <div className="flex flex-wrap items-start gap-4 p-5">
                    {rec.logoUrl && !logoBad
                        ? <img src={rec.logoUrl} alt={rec.name} onError={() => setLogoBad(true)} className="size-14 rounded-lg bg-white object-contain" />
                        : <span className="grid size-14 place-items-center rounded-lg bg-brandsoft text-lg font-bold text-brand">{rec.name[0]}</span>}
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-base font-bold text-sidebar-text-active">{rec.name}</h2>
                        <p className="text-xs text-sidebar-group">{rec.providerId || "N/A"}</p>
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
                        <DTile label="Cell Phone No">{na(fmtPhone(rec.phone))}</DTile>
                        <DTile label="Status"><StatusBadge status={rec.status} /></DTile>
                        <DTile label="Created On">{na(rec.createdOn)}</DTile>
                        <DTile label="Last Updated On">{na(rec.updatedOn)}</DTile>
                        <DTile label="Created By">{na(rec.createdBy)}</DTile>
                        <DTile label="Last Updated By">{na(rec.updatedBy)}</DTile>
                    </DTiles>
                </DSection>
            </div>
            {tab === "creds" && (
                <div className="grid items-start gap-4 lg:grid-cols-2">
                    {MODES.map((m) => <CredCard key={m.value} id={rec.id} mode={m.value} initial={m.value === "sandbox" ? data.sandbox : data.live} />)}
                </div>
            )}
        </div>
    );
}