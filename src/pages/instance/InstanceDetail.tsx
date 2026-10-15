import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import { Calendar, Check as CheckIcon, Clock, Copy, Globe, KeyRound, Layers, Pencil, Plus, RefreshCw, Settings, Trash2 } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import Drawer from "@/components/shared/Drawer";
import Dropdownbox from "@/components/shared/Dropdownbox";
import DatePicker from "@/components/shared/DatePicker";
import { DCard, Grid, KV, NotFound, StatusBadge } from "@/components/catalog/DetailBits";
import { btn, Field, MoneyInput, Radio, SearchField, TextArea, TextInput, Toggle } from "@/components/catalog/FormBits";
import type { Instance, InstanceProduct } from "@/data/instances";
import { entityService } from "@/services/entity.service";
import { subEntityService } from "@/services/sub-entity.service";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import type { Status } from "@/data/catalog";
import { statusFormOptions, usd } from "@/utils/catalog";
import EmptyState from "@/components/shared/EmptyState";

const BASE = "/instances";

/* ---------------- Products tab ---------------- */
function ProductsTab({ inst, subId, enabled, onToggle }: {
    inst: Instance; subId: string; enabled: Record<string, boolean>; onToggle: (productId: string, on: boolean) => void;
}) {
    const { toast } = useApp();
    const [items, setItems] = useState<InstanceProduct[]>(inst.products);
    const [selId, setSelId] = useState(inst.products[0]?.id ?? "");
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<InstanceProduct | null>(null);
    const [retailText, setRetailText] = useState("");
    const [err, setErr] = useState("");
    const sel = items.find((p) => p.id === selId);

    const reset = () => { setEditing(false); setDraft(null); setErr(""); };
    const pick = (id: string) => { setSelId(id); reset(); };
    const startEdit = () => { if (!sel) return; setDraft({ ...sel }); setRetailText(String(sel.retail)); setEditing(true); };
    const save = () => {
        if (!draft) return;
        if (!draft.name.trim()) { setErr("Product name is required"); return; }
        const next = { ...draft, name: draft.name.trim(), retail: Number(retailText) || 0 };
        setItems((l) => l.map((p) => (p.id === next.id ? next : p)));
        reset();
        toast("Product updated");
    };
    const upd = <K extends keyof InstanceProduct>(k: K, v: InstanceProduct[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

    if (!items.length) {
        return <EmptyState title="No products yet" message="No products are associated with this entity." />;
    }

    return (
        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
            <div className="md:border-r md:border-line md:pr-3">
                <h3 className="mb-3 border-b border-line px-1 pb-3 text-xs font-bold uppercase tracking-wide text-ink">Products</h3>
                <div role="tablist" aria-orientation="vertical" className="flex flex-col gap-1">
                    {items.map((p) => (
                        <button key={p.id} role="tab" aria-selected={p.id === selId} onClick={() => pick(p.id)}
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
                        <h3 className="truncate text-sm font-bold text-ink">{editing && draft ? draft.name || "Edit product" : sel.name}</h3>
                        {editing ? (
                            <div className="flex gap-2">
                                <button className={btn.cancel} onClick={reset}>Cancel</button>
                                <button className={btn.primary} onClick={save}>Save</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-ink">Active for this sub entity</span>
                                <Toggle label="Product active for this sub entity" on={enabled[`${subId}:${sel.id}`] ?? true}
                                    onChange={(v) => onToggle(sel.id, v)} />
                                <button className={btn.brand} onClick={startEdit}><Pencil className="size-4" /> Edit</button>
                            </div>
                        )}
                    </div>

                    {editing && draft ? (
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Product Name" required error={err}>
                                <TextInput value={draft.name} onChange={(e) => upd("name", e.target.value)} />
                            </Field>
                            <Field label="Category">
                                <TextInput value={draft.category} onChange={(e) => upd("category", e.target.value)} />
                            </Field>
                            <Field label="Retail Price">
                                <MoneyInput value={retailText} onChange={setRetailText} />
                            </Field>
                            <Field label="Discount">
                                <TextInput value={draft.discount} placeholder="e.g. 10% or No discount" onChange={(e) => upd("discount", e.target.value)} />
                            </Field>
                            <Field label="Status">
                                <Dropdownbox name="pstatus" value={draft.status} options={statusFormOptions} rounded="rounded-md" compact
                                    onChange={(e) => upd("status", e.target.value as Status)} />
                            </Field>
                            <Field label="Short Description" className="md:col-span-2">
                                <TextArea rows={3} value={draft.shortDescription} onChange={(e) => upd("shortDescription", e.target.value)} />
                            </Field>
                        </div>
                    ) : (
                        <Grid one>
                            <KV k="Product Name :">{sel.name}</KV>
                            <KV k="Category :">{sel.category}</KV>
                            <KV k="Retail Price :">{usd(sel.retail)}</KV>
                            <KV k="Discount :">{sel.discount}</KV>
                            <KV k="Status :"><StatusBadge status={sel.status} /></KV>
                            <KV k="Short Description :">{sel.shortDescription || "-"}</KV>
                        </Grid>
                    )}
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
interface TokenRec { notes: string; created: string; expires: string; expiresAt: string | null; hint: string }

const TODAY = new Date().toISOString().slice(0, 10);
const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const makeToken = () => {
    const b = new Uint8Array(24);
    crypto.getRandomValues(b);
    return "roja_" + Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
};
const expiryLabel = (exp: Exp, custom: string) => {
    if (exp === "never") return "Never";
    const d = exp === "custom" ? new Date(`${custom}T00:00:00`) : new Date(Date.now() + Number(exp) * 86400000);
    return fmtDate(d);
};

const expiryDate = (exp: Exp, custom: string): Date | null =>
    exp === "never" ? null : exp === "custom" ? new Date(`${custom}T00:00:00`) : new Date(Date.now() + Number(exp) * 86400000);
const daysLeftOf = (r: TokenRec) =>
    r.expiresAt ? Math.max(0, Math.ceil((new Date(r.expiresAt).getTime() - Date.now()) / 86400000)) : null;

function TokenDrawer({ subName, regenerate, onSave }: {
    subName: string; regenerate: boolean; onSave: (notes: string, exp: Exp, custom: string) => void;
}) {
    const [notes, setNotes] = useState("");
    const [exp, setExp] = useState<Exp>("30");
    const [custom, setCustom] = useState("");
    const [errors, setErrors] = useState({ notes: "", custom: "" });
    return (
        <Drawer
            title={regenerate ? "Regenerate Token" : "Generate Token"}
            kicker={`${subName} · sub entity`}
            width="min(460px, calc(100vw - 20px))"
            colored
            footer={(close) => (
                <>
                    <button className={btn.cancel} onClick={close}>Cancel</button>
                    <button className={btn.primary} onClick={() => {
                        const e = {
                            notes: notes.trim() ? "" : "Notes are required",
                            custom: exp === "custom" && !custom ? "Pick an expiration date" : "",
                        };
                        setErrors(e);
                        if (e.notes || e.custom) return;
                        onSave(notes.trim(), exp, custom);
                        close();
                    }}>{regenerate ? "Regenerate" : "Generate Token"}</button>
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

function TokenTab({ subs, tokens, onSave, onDelete }: {
    subs: SubEntity[]; tokens: Record<string, TokenRec>;
    onSave: (subId: string, r: TokenRec) => void; onDelete: (subId: string) => void;
}) {
    const { openDrawer, toast } = useApp();
    const [q, setQ] = useState("");
    const [issued, setIssued] = useState<{ token: string; expires: string } | null>(null);

    const generate = (s: SubEntity, notes: string, exp: Exp, custom: string) => {
        const token = makeToken();
        const d = expiryDate(exp, custom);
        const expires = expiryLabel(exp, custom);
        onSave(s.id, { notes, created: fmtDate(new Date()), expires, expiresAt: d ? d.toISOString() : null, hint: token.slice(-4) });
        setIssued({ token, expires });
    };
    const open = (s: SubEntity, regenerate: boolean) =>
        openDrawer(<TokenDrawer subName={s.name} regenerate={regenerate} onSave={(n, e, c) => generate(s, n, e, c)} />);

    const shown = subs.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase()));

    return (
        <div className="flex flex-col gap-4">
            <DCard title="Manage API tokens for your sub entities">
                <div className="max-w-[360px]"><SearchField value={q} placeholder="Search sub entities…" onChange={setQ} /></div>
            </DCard>

            {shown.length === 0 && (
                <div className="rounded-xl border border-line bg-white">
                    <EmptyState title="No sub entities found" />
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((s) => {
                    const t = tokens[s.id];
                    const left = t ? daysLeftOf(t) : null;
                    return (
                        <section key={s.id} className="flex h-full flex-col rounded-xl border border-line bg-white p-5">
                            <h3 className="mb-4 flex items-center gap-2 truncate text-sm font-bold text-ink">
                                <Globe className="size-4 shrink-0" /> <span className="truncate">{s.name}</span>
                            </h3>
                            {t ? (
                                <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-line">
                                    <div className="flex items-center justify-between bg-surfacealt px-4 py-3">
                                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><KeyRound className="size-4" /> Token</span>
                                        <span className="rounded-full bg-goodbg px-3 py-1 text-xs font-semibold text-good">Active</span>
                                    </div>
                                    <div className="flex flex-1 flex-col gap-2 px-4 py-3 text-xs text-muted">
                                        <span className="inline-flex items-center gap-2"><KeyRound className="size-3.5 shrink-0" /> <span className="truncate">{t.notes}</span></span>
                                        <span className="inline-flex items-center gap-2 font-mono">roja_••••••••{t.hint}</span>
                                        <span className="inline-flex items-center gap-2"><Calendar className="size-3.5 shrink-0" /> Created {t.created}</span>
                                        <span className="inline-flex items-center gap-2"><Clock className="size-3.5 shrink-0" /> {left == null ? "Never expires" : `${left} days left`}</span>
                                        <div className="mt-auto flex flex-wrap gap-2 pt-3">
                                            <button className={btn.secondary} onClick={() => open(s, true)}><RefreshCw className="size-4" /> Regenerate</button>
                                            <button className={btn.secondary} onClick={() => { onDelete(s.id); toast("Token deleted"); }}><Trash2 className="size-4" /> Delete</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button type="button" onClick={() => open(s, false)}
                                    className="flex min-h-[180px] w-full flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dotted border-brand bg-brandsoft text-sm font-bold text-brand transition hover:bg-white">
                                    <KeyRound className="size-5" /> Generate Token <Plus className="size-4" />
                                </button>
                            )}
                        </section>
                    );
                })}
            </div>

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
    const [tokens, setTokens] = useState<Record<string, TokenRec>>({});
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
                                    <button type="button" aria-label="Edit entity details" title="Edit"
                                        className="ml-2 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-white transition hover:bg-white/20"
                                        onClick={startInfoEdit}>
                                        <Pencil className="size-3.5" />
                                    </button>
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
                                <StatusBadge status={view.status} />
                                <button type="button" className={btn.brand} onClick={startInfoEdit}>
                                    <Pencil className="size-4" /> Edit
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div role="tablist" aria-label="Entity tabs" className="flex gap-1 bg-sidebar-border px-2 pt-2">
                    {([["entity", "Sub Entity", Layers], ["token", "Token Generation", KeyRound]] as const).map(([k, t, Icon]) => (
                        <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                            className={`inline-flex items-center gap-2 rounded-t-lg px-5 py-3 text-xs font-bold ${tab === k ? "bg-white text-ink" : "text-sidebar-group hover:bg-sidebar-hover hover:text-sidebar-text-active"}`}>
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
                        <TokenStatusLine name={subs.find((s) => s.id === subId)?.name ?? ""} rec={tokens[subId]} />
                        <section className="rounded-xl border border-line bg-white p-5">
                            <ProductsTab inst={inst} subId={subId} enabled={enabled}
                                onToggle={(pid, on) => setEnabled((m) => ({ ...m, [`${subId}:${pid}`]: on }))} />
                        </section>
                    </>
                )}
            </div>
            <div className={tab === "token" ? "" : "hidden"}>
                <TokenTab subs={subs} tokens={tokens}
                    onSave={(sid, r) => setTokens((m) => ({ ...m, [sid]: r }))}
                    onDelete={(sid) => setTokens((m) => { const n = { ...m }; delete n[sid]; return n; })} />
            </div>
        </div>
    );
}