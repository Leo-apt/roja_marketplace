import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import { Calendar, Check as CheckIcon, Clock, Copy, Globe, KeyRound, Layers, Pencil, Plus, RefreshCw, Settings, Trash2 } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import Drawer from "@/components/shared/Drawer";
import Dropdownbox from "@/components/shared/Dropdownbox";
import DatePicker from "@/components/shared/DatePicker";
import { DCard, Grid, KV, NotFound, StatusBadge } from "@/components/catalog/DetailBits";
import { btn, Field, Radio, TextArea, TextInput, Toggle } from "@/components/catalog/FormBits";
import type { Instance } from "@/data/instances";
import { productsService, type ProductRec } from "@/services/products.service";
import { entityService } from "@/services/entity.service";
import { subEntityService } from "@/services/sub-entity.service";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import type { Status } from "@/data/catalog";
import { statusFormOptions, usd } from "@/utils/catalog";
import EmptyState from "@/components/shared/EmptyState";
import { apiKeyService, type TokenRec } from "@/services/api-key.service";

const BASE = "/instances";

/* ---------------- Products tab ---------------- */
function ProductsTab({ subId, enabled, onToggle }: {
    subId: string; enabled: Record<string, boolean>; onToggle: (productId: string, on: boolean) => void;
}) {
    const [items, setItems] = useState<ProductRec[]>([]);
    const [selId, setSelId] = useState("");
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const load = useCallback(async () => {
        setLoading(true);
        setErr("");
        try {
            const list = await productsService.list();
            setItems(list);
            setSelId((cur) => (list.some((p) => p.id === cur) ? cur : list[0]?.id ?? ""));
        } catch (e) { setErr(e instanceof Error ? e.message : "Failed to load products"); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { void load(); }, [load]);
    const sel = items.find((p) => p.id === selId);
    const discount = !sel || !sel.discountType || !sel.discountValue ? "No discount"
        : sel.discountType === "percent" ? `${sel.discountValue}%` : usd(sel.discountValue);

    if (loading) return <LoadingBox />;
    if (err) return <ErrorBox message={err} onRetry={() => void load()} />;
    if (!items.length) {
        return <EmptyState title="No products yet" message="No products are available." />;
    }

    return (
        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
            <div className="md:border-r md:border-line md:pr-3">
                <h3 className="mb-3 border-b border-line px-1 pb-3 text-xs font-bold uppercase tracking-wide text-ink">Products</h3>
                <div role="tablist" aria-orientation="vertical" className="thin-scrollbar flex max-h-[420px] flex-col gap-1 overflow-y-auto">
                    {items.map((p) => (
                        <button key={p.id} role="tab" aria-selected={p.id === selId} onClick={() => setSelId(p.id)}
                            className={`rounded-md px-3 py-2.5 text-left text-xs ${p.id === selId ? "bg-brandsoft font-semibold text-brand" : "text-[#3c4d66] hover:bg-gray-50"}`}>
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>

            {sel && (
                <div className="min-w-0">
                    <h3 className="mb-3 border-b border-line px-1 pb-3 text-xs font-bold uppercase tracking-wide text-ink">Product Details</h3>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="truncate text-sm font-bold text-ink">{sel.name}</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-ink">Active for this sub entity</span>
                            <Toggle label="Product active for this sub entity" on={enabled[`${subId}:${sel.id}`] ?? true}
                                onChange={(v) => onToggle(sel.id, v)} />
                        </div>
                    </div>

                    <Grid one>
                        <KV k="Product Name :">{sel.name}</KV>
                        <KV k="Category :">{sel.categoryName}</KV>
                        <KV k="Retail Price :">{sel.retail != null ? usd(sel.retail) : "-"}</KV>
                        <KV k="Discount :">{discount}</KV>
                        <KV k="Status :"><StatusBadge status={sel.status} /></KV>
                        <KV k="Short Description :">{sel.shortDescription || "-"}</KV>
                    </Grid>
                </div>
            )}
        </div>
    );
}

/* ---------------- One-time token modal ---------------- */
function TokenModal({ token, expires, onDone }: { token: string; expires: string; onDone: () => void }) {
    const [copied, setCopied] = useState(false);
    const closing = useRef(false);

    useEffect(() => {
        // extra history entry: the browser Back button only removes this one and we push it again
        const keep = () => window.history.pushState(window.history.state, "", window.location.href);
        const onPop = () => { if (!closing.current) keep(); };
        const onUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
        keep();
        window.addEventListener("popstate", onPop);
        window.addEventListener("beforeunload", onUnload);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("popstate", onPop);
            window.removeEventListener("beforeunload", onUnload);
            document.body.style.overflow = "";
        };
    }, []);

    const done = () => { closing.current = true; window.history.back(); onDone(); };
    const copy = async () => {
        try { await navigator.clipboard.writeText(token); setCopied(true); } catch { setCopied(false); }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
            <div role="alertdialog" aria-modal="true" aria-labelledby="token-title" className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="h-1 bg-amber-500" />
                <div className="flex flex-col gap-4 p-6">
                    <h3 id="token-title" className="text-lg font-bold text-ink">Save your token now</h3>
                    <p className="rounded-md bg-warnbg px-3 py-2 text-sm text-warn">
                        This token is generated only once. Copy it and store it safely. You will not be able to see it again.
                    </p>
                    <div className="break-all rounded-md border border-line bg-surfacealt p-3 font-mono text-xs text-ink">{token}</div>
                    <div className="flex items-center justify-between text-xs text-muted">
                        <span>Expires: <b className="text-ink">{expires}</b></span>
                        <button className={btn.secondary} onClick={copy}>
                            {copied ? <CheckIcon className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy"}
                        </button>
                    </div>
                    <button className={`${btn.primary} w-full`} onClick={done}>Okay</button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

/* ---------------- Token tab ---------------- */
type Exp = "7" | "30" | "60" | "90" | "custom" | "never";
const EXP_OPTIONS: { value: Exp; label: string }[] = [
    { value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "60", label: "60 days" },
    { value: "90", label: "90 days" }, { value: "custom", label: "Custom" }, { value: "never", label: "Never" },
];

const TODAY = new Date().toISOString().slice(0, 10);
const daysLeftOf = (r: TokenRec) =>
    r.expiresAt ? Math.max(0, Math.ceil((new Date(r.expiresAt).getTime() - Date.now()) / 86400000)) : null;

const toDays = (exp: Exp, custom: string): number | undefined => {
    if (exp === "never") return undefined;
    if (exp !== "custom") return Number(exp);
    const ms = new Date(`${custom}T00:00:00`).getTime() - new Date(`${TODAY}T00:00:00`).getTime();
    return Math.ceil(ms / 86400000);
};

function TokenDrawer({ entityName, regenerate, defaultNote, onSave }: {
    entityName: string; regenerate: boolean; defaultNote?: string;
    onSave: (notes: string, exp: Exp, custom: string) => Promise<void>;
}) {
    const [notes, setNotes] = useState(defaultNote ?? "");
    const [exp, setExp] = useState<Exp>("30");
    const [custom, setCustom] = useState("");
    const [errors, setErrors] = useState({ notes: "", custom: "" });
    const [saving, setSaving] = useState(false);
    return (
        <Drawer
            title={regenerate ? "Regenerate Token" : "Generate Token"}
            kicker={`${entityName} · entity`}
            width="min(460px, calc(100vw - 20px))"
            colored
            footer={(close) => (
                <>
                    <button className={btn.cancel} onClick={close} disabled={saving}>Cancel</button>
                    <button className={`${btn.primary} disabled:opacity-60`} disabled={saving} onClick={async () => {
                        let customErr = "";
                        if (exp === "custom") {
                            if (!custom) customErr = "Pick an expiration date";
                            else {
                                const d = toDays(exp, custom) ?? 0;
                                if (d < 1 || d > 365) customErr = "Pick a date within the next 365 days";
                            }
                        }
                        const e = { notes: notes.trim() ? "" : "Notes are required", custom: customErr };
                        setErrors(e);
                        if (e.notes || e.custom) return;
                        setSaving(true);
                        try {
                            await onSave(notes.trim(), exp, custom);
                            close();
                        } catch (x) {
                            setErrors({ notes: x instanceof Error ? x.message : "Failed", custom: "" });
                        } finally {
                            setSaving(false);
                        }
                    }}>{saving ? "Saving…" : regenerate ? "Regenerate" : "Generate Token"}</button>
                </>
            )}
        >
            <Field label="Notes" required error={errors.notes}>
                <TextArea rows={3} value={notes} placeholder="What is this token used for?" onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <Field label="Expiration" required error={errors.custom}>
                <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
                    {EXP_OPTIONS.map((o) => (
                        <Radio key={o.value} name="exp" label={o.label} checked={exp === o.value} onChange={() => setExp(o.value)} />
                    ))}
                </div>
                {exp === "custom" && (
                    <div className="mt-3">
                        <DatePicker value={custom} minDate={TODAY} placeholder="Select date" onChange={setCustom} />
                    </div>
                )}
            </Field>
        </Drawer>
    );
}

function TokenTab({ entityName, token, loading, error, onRetry, onIssue, onRevoke }: {
    entityName: string; token: TokenRec | null; loading: boolean; error: string; onRetry: () => void;
    onIssue: (notes: string, exp: Exp, custom: string) => Promise<{ token: string; expires: string }>;
    onRevoke: (keyId: string) => Promise<void>;
}) {
    const { openDrawer, toast } = useApp();
    const [issued, setIssued] = useState<{ token: string; expires: string } | null>(null);

    if (loading) return <LoadingBox />;
    if (error) return <ErrorBox message={error} onRetry={onRetry} />;

    const left = token ? daysLeftOf(token) : null;
    const expired = !!token?.expiresAt && left === 0;
    const open = (regenerate: boolean) =>
        openDrawer(<TokenDrawer entityName={entityName} regenerate={regenerate} defaultNote={token?.notes}
            onSave={async (n, e, c) => { setIssued(await onIssue(n, e, c)); }} />);
    const revoke = async () => {
        if (!token) return;
        try { await onRevoke(token.id); toast("Token deleted"); }
        catch (e) { toast(e instanceof Error ? e.message : "Delete failed"); }
    };

    return (
        <div className="flex flex-col gap-4">
            <DCard title="Manage the API token for this entity">
                <p className="text-sm text-muted">An entity can have one active token. Regenerate it to replace the current one.</p>
            </DCard>

            <section className="max-w-md rounded-xl border border-line bg-white p-5">
                <h3 className="mb-4 flex items-center gap-2 truncate text-sm font-bold text-ink">
                    <Globe className="size-4 shrink-0" /> <span className="truncate">{entityName}</span>
                </h3>
                {token ? (
                    <div className="overflow-hidden rounded-xl border border-line">
                        <div className="flex items-center justify-between bg-surfacealt px-4 py-3">
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><KeyRound className="size-4" /> Token</span>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${expired ? "bg-badbg text-bad" : "bg-goodbg text-good"}`}>
                                {expired ? "Expired" : "Active"}
                            </span>
                        </div>
                        <div className="flex flex-col gap-2 px-4 py-3 text-xs text-muted">
                            <span className="inline-flex items-center gap-2"><KeyRound className="size-3.5 shrink-0" /> <span className="truncate">{token.notes || "-"}</span></span>
                            <span className="inline-flex items-center gap-2 font-mono">{token.prefix}••••••••</span>
                            <span className="inline-flex items-center gap-2"><Calendar className="size-3.5 shrink-0" /> Created {token.created}</span>
                            <span className="inline-flex items-center gap-2"><Clock className="size-3.5 shrink-0" /> {left == null ? "Never expires" : expired ? "Expired" : `${left} days left`}</span>
                            <div className="flex flex-wrap gap-2 pt-3">
                                <button className={btn.info} onClick={() => open(true)}><RefreshCw className="size-4" /> Regenerate</button>
                                <button className={btn.danger} onClick={() => void revoke()}><Trash2 className="size-4" /> Delete</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button type="button" onClick={() => open(false)}
                        className="flex min-h-[180px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dotted border-brand bg-brandsoft text-sm font-bold text-brand transition hover:bg-white">
                        <KeyRound className="size-5" /> Generate Token <Plus className="size-4" />
                    </button>
                )}
            </section>

            {issued && <TokenModal token={issued.token} expires={issued.expires} onDone={() => setIssued(null)} />}
        </div>
    );
}

/* ---------------- Token status line ---------------- */
function TokenStatusLine({ name, rec }: { name: string; rec?: TokenRec }) {
    const left = rec ? daysLeftOf(rec) : null;
    return (
        <section className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-white px-5 py-3 text-xs">
            <strong className="text-ink">{name} Token Details -</strong>
            <span className="inline-flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${rec ? "bg-good" : "bg-gray-300"}`} />
                <KeyRound className="size-3.5 text-muted" />
                <span className="text-muted">{!rec ? "Not generated yet" : left == null ? "Never expires" : `${left} days left`}</span>
            </span>
        </section>
    );
}

/* ---------------- Sub entity drawer (create + edit) ---------------- */
interface SubEntity { id: string; name: string; description: string }

function SubEntityDrawer({ initial, onSave }: { initial?: SubEntity; onSave: (name: string, description: string) => Promise<void> }) {
    const [name, setName] = useState(initial?.name ?? "");
    const [desc, setDesc] = useState(initial?.description ?? "");
    const [err, setErr] = useState("");
    const [saving, setSaving] = useState(false);
    return (
        <Drawer
            title={initial ? "Edit Sub Entity" : "New Sub Entity"}
            kicker="Sub entity"
            width="min(420px, calc(100vw - 20px))"
            colored
            footer={(close) => (
                <>
                    <button className={btn.cancel} onClick={close} disabled={saving}>Cancel</button>
                    <button className={`${btn.primary} disabled:opacity-60`} disabled={saving} onClick={async () => {
                        if (!name.trim()) { setErr("Name is required"); return; }
                        setSaving(true);
                        try {
                            await onSave(name.trim(), desc.trim());
                            close();
                        } catch (e) {
                            setErr(e instanceof Error ? e.message : "Save failed");
                        } finally {
                            setSaving(false);
                        }
                    }}>{saving ? "Saving…" : initial ? "Save" : "Create"}</button>
                </>
            )}
        >
            <Field label="Sub Entity Name" required error={err}>
                <TextInput value={name} placeholder="e.g. Local" onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Description">
                <TextArea rows={4} value={desc} placeholder="What is this sub entity used for?" onChange={(e) => setDesc(e.target.value)} />
            </Field>
        </Drawer>
    );
}

/* ---------------- Page ---------------- */
export default function InstanceDetail() {
    const { id } = useParams();
    const { openDrawer, toast } = useApp();
    const [inst, setInst] = useState<Instance | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadErr, setLoadErr] = useState("");
    const load = useCallback(async (iid: string) => {
        setLoading(true);
        setLoadErr("");
        try { setInst(await entityService.get(iid)); }
        catch (e) { setLoadErr(e instanceof Error ? e.message : "Failed to load entity"); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { if (id) void load(id); }, [id, load]);
    const [tab, setTab] = useState("entity");
    const [subs, setSubs] = useState<SubEntity[]>([]);
    const [subId, setSubId] = useState("");
    const [subsLoading, setSubsLoading] = useState(true);
    const [subsErr, setSubsErr] = useState("");
    const loadSubs = useCallback(async (eid: string) => {
        setSubsLoading(true);
        setSubsErr("");
        try {
            const list = await subEntityService.list(eid);
            setSubs(list);
            setSubId((cur) => (list.some((s) => s.id === cur) ? cur : list[0]?.id ?? ""));
        } catch (e) {
            setSubsErr(e instanceof Error ? e.message : "Failed to load sub entities");
        } finally {
            setSubsLoading(false);
        }
    }, []);
    useEffect(() => { if (id) void loadSubs(id); }, [id, loadSubs]);
    const [enabled, setEnabled] = useState<Record<string, boolean>>({});
    const [token, setToken] = useState<TokenRec | null>(null);
    const [tokenLoading, setTokenLoading] = useState(true);
    const [tokenErr, setTokenErr] = useState("");
    const loadToken = useCallback(async (eid: string) => {
        setTokenLoading(true);
        setTokenErr("");
        try { setToken(await apiKeyService.active(eid)); }
        catch (e) { setTokenErr(e instanceof Error ? e.message : "Failed to load token"); }
        finally { setTokenLoading(false); }
    }, []);
    useEffect(() => { if (id) void loadToken(id); }, [id, loadToken]);
    const [info, setInfo] = useState<Partial<Pick<Instance, "name" | "description" | "status">>>({});
    const [editingInfo, setEditingInfo] = useState(false);
    const [infoDraft, setInfoDraft] = useState<{ name: string; description: string; status: Status } | null>(null);
    const [infoErr, setInfoErr] = useState("");
    if (loading) return <LoadingBox />;
    if (loadErr) return <ErrorBox message={loadErr} onRetry={() => id && void load(id)} backTo={BASE} />;
    if (!inst) return <NotFound backTo={BASE} />;
    const view = { ...inst, ...info };
    const startInfoEdit = () => {
        setInfoDraft({ name: view.name, description: view.description ?? "", status: view.status });
        setInfoErr("");
        setEditingInfo(true);
    };
    const cancelInfoEdit = () => { setEditingInfo(false); setInfoDraft(null); setInfoErr(""); };
    const saveInfo = async () => {
        if (!infoDraft) return;
        if (!infoDraft.name.trim()) { setInfoErr("Name is required"); return; }
        try {
            await entityService.update(inst.id, {
                name: infoDraft.name.trim(),
                description: infoDraft.description.trim(),
                status: infoDraft.status,
            });
            setInfo({ name: infoDraft.name.trim(), description: infoDraft.description.trim(), status: infoDraft.status });
            cancelInfoEdit();
            toast("Entity details updated");
        } catch (e) {
            setInfoErr(e instanceof Error ? e.message : "Update failed"); // duplicate name shows under the field
        }
    };

    const addSub = async (name: string, description: string) => {
        const s = await subEntityService.create(inst.id, { name, description });
        setSubs((l) => [...l, s]);
        setSubId(s.id);
        toast("Sub entity created");
    };
    const editSub = async (sid: string, name: string, description: string) => {
        const s = await subEntityService.update(sid, { name, description });
        setSubs((l) => l.map((x) => (x.id === sid ? s : x)));
        toast("Sub entity updated");
    };

    const issueToken = async (notes: string, exp: Exp, custom: string) => {
        const b = { note: notes, expiresInDays: toDays(exp, custom) };
        const r = token ? await apiKeyService.regenerate(token.id, b) : await apiKeyService.create(inst.id, b);
        setToken(r.rec);
        return { token: r.key, expires: r.rec.expires };
    };
    const revokeToken = async (keyId: string) => {
        await apiKeyService.revoke(keyId);
        setToken(null);
    };

    return (
        <div className="flex flex-col gap-4">
            <section className="overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-bg">
                <div className="flex flex-wrap items-start gap-4 p-5">
                    {inst.imageUrl
                        ? <img src={inst.imageUrl} alt={view.name} className="size-14 rounded-lg object-cover" />
                        : <span className="grid size-14 place-items-center rounded-lg bg-brandsoft text-lg font-bold text-brand">{view.name[0]}</span>}

                    <div className="min-w-0 flex-1">
                        {editingInfo && infoDraft ? (
                            <div className="grid gap-4 rounded-xl border border-line bg-surfacealt p-4 md:grid-cols-2">
                                <Field label="Entity Name" required error={infoErr}>
                                    <TextInput value={infoDraft.name} onChange={(e) => setInfoDraft((d) => d && { ...d, name: e.target.value })} />
                                </Field>
                                <Field label="Status">
                                    <Dropdownbox name="istatus" value={infoDraft.status} options={statusFormOptions} rounded="rounded-md" compact
                                        onChange={(e) => setInfoDraft((d) => d && { ...d, status: e.target.value as Status })} />
                                </Field>
                                <Field label="Description" className="md:col-span-2">
                                    <TextArea rows={3} value={infoDraft.description} onChange={(e) => setInfoDraft((d) => d && { ...d, description: e.target.value })} />
                                </Field>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4">
                                    <h2 className="truncate text-base font-bold text-sidebar-text-active">{view.name}</h2>
                                </div>
                                <p className="text-xs text-sidebar-group">{view.description || "No description"}</p>
                            </>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        {editingInfo ? (
                            <>
                                <button className={btn.cancel} onClick={cancelInfoEdit}>Cancel</button>
                                <button className={btn.primary} onClick={() => void saveInfo()}>Save</button>
                            </>
                        ) : (
                            <>
                                <span className={`inline-flex h-8 w-24 items-center justify-center rounded-full text-xs font-bold capitalize text-white ${view.status === "Active" ? "bg-good" : "bg-bad"}`}>
                                    {view.status}
                                </span>
                                <button type="button" className={`${btn.brand} !h-8 !min-h-0 w-24 justify-center !py-0`} onClick={startInfoEdit}>
                                    <Pencil className="size-4" /> Edit
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div role="tablist" aria-label="Entity tabs" className="flex gap-1 bg-sidebar-border px-2 pt-2">
                    {([["entity", "Sub Entity", Layers], ["token", "Token Generation", KeyRound]] as const).map(([k, t, Icon]) => (
                        <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                            className={`inline-flex items-center gap-2 rounded-t-lg border border-b-0 px-5 py-3 text-xs font-bold normal-case transition ${tab === k
                                ? "border-brand bg-brand text-white"
                                : "border-sidebar-active-border bg-white/60 text-sidebar-text-active hover:bg-white"}`}>
                            <Icon className="size-4" /> {t}
                        </button>
                    ))}
                </div>
            </section>

            {/* both tabs stay mounted so unsaved edits and the token form survive tab switches */}
            <div className={tab === "entity" ? "flex flex-col gap-4" : "hidden"}>
                <section className="flex w-full min-w-0 items-center gap-2 rounded-xl border border-line bg-white p-3">
                    <div className="thin-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1">
                        {subs.map((s) => {
                            const active = s.id === subId;
                            return (
                                <div key={s.id} className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border text-xs font-semibold ${active ? "border-action bg-action text-white" : "border-line bg-surfacealt text-muted"}`}>
                                    <button type="button" className="px-3 py-2" onClick={() => setSubId(s.id)}>{s.name}</button>
                                    <button type="button" aria-label={`Edit ${s.name}`} title="Edit" className="py-2 pr-2.5"
                                        onClick={() => openDrawer(<SubEntityDrawer initial={s} onSave={(n, d) => editSub(s.id, n, d)} />)}>
                                        <Settings className="size-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    <button className={`${btn.navy} shrink-0`} onClick={() => openDrawer(<SubEntityDrawer onSave={addSub} />)}>
                        <Plus className="size-4" /> New Sub Entity
                    </button>
                </section>

                {subsLoading ? <LoadingBox /> : subsErr ? (
                    <ErrorBox message={subsErr} onRetry={() => void loadSubs(inst.id)} />
                ) : subs.length === 0 ? (
                    <div className="rounded-xl border border-line bg-white">
                        <EmptyState title="No sub entities yet" message='Click "New Sub Entity" to add one.' />
                    </div>
                ) : (
                    <>
                        <TokenStatusLine name={view.name} rec={token ?? undefined} />
                        <section className="rounded-xl border border-line bg-white p-5">
                            <ProductsTab subId={subId} enabled={enabled}
                                onToggle={(pid, on) => setEnabled((m) => ({ ...m, [`${subId}:${pid}`]: on }))} />
                        </section>
                    </>
                )}
            </div>
            <div className={tab === "token" ? "" : "hidden"}>
                <TokenTab entityName={view.name} token={token} loading={tokenLoading} error={tokenErr}
                    onRetry={() => void loadToken(inst.id)} onIssue={issueToken} onRevoke={revokeToken} />
            </div>
        </div>
    );
}