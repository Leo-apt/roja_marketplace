import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useSearchParams } from "react-router-dom";
import { Calendar, Check as CheckIcon, ChevronRight, Clock, Copy, Globe, KeyRound, Layers, MousePointerClick, Package, Pencil, Percent, Plus, RefreshCw, Settings, Trash2 } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import Drawer from "@/components/shared/Drawer";
import Dropdownbox from "@/components/shared/Dropdownbox";
import DatePicker from "@/components/shared/DatePicker";
import { DCard, NotFound } from "@/components/catalog/DetailBits";
import { btn, Field, Radio, TextArea, TextInput } from "@/components/catalog/FormBits";
import type { Instance } from "@/data/instances";
import { productsService, type ProductRec } from "@/services/products.service";
import { entityService } from "@/services/entity.service";
import { subEntityService } from "@/services/sub-entity.service";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import type { Status } from "@/data/catalog";
import { statusFormOptions } from "@/utils/catalog";
import { apiKeyService, type Env, type TokenRec } from "@/services/api-key.service";
import { marginsService, type MarginRec } from "@/services/margins.service";
import EnvProductsDrawer from "@/components/catalog/EnvProductsDrawer";
import EnvMarginsDrawer from "@/components/catalog/EnvMarginsDrawer";
import credsIllustration from "@/assets/Empty-pana.svg";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const BASE = "/instances";
const ENVS: { value: Env; label: string }[] = [{ value: "sandbox", label: "Sandbox" }, { value: "live", label: "Live" }];

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

function TokenDrawer({ entityName, envLabel, regenerate, defaultNote, onSave }: {
    entityName: string; envLabel: string; regenerate: boolean; defaultNote?: string;
    onSave: (notes: string, exp: Exp, custom: string) => Promise<void>;
}) {
    const [notes, setNotes] = useState(defaultNote ?? "");
    const [exp, setExp] = useState<Exp>("30");
    const [custom, setCustom] = useState("");
    const [errors, setErrors] = useState({ notes: "", custom: "" });
    const [saving, setSaving] = useState(false);
    return (
        <Drawer
            title={`${regenerate ? "Regenerate" : "Generate"} ${envLabel} Token`}
            kicker={`${entityName} · Environment`}
            width="min(460px, calc(100vw - 20px))"
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
                    {EXP_OPTIONS.filter((o) => !regenerate || o.value !== "never").map((o) => (
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

function TokenTab({ subs, tokens, loading, error, onRetry, onIssue, onRevoke, onCreateSub }: {
    subs: SubEntity[]; tokens: Record<string, Record<Env, TokenRec | null>>; loading: boolean; error: string; onRetry: () => void;
    onIssue: (sid: string, env: Env, notes: string, exp: Exp, custom: string) => Promise<{ token: string; expires: string }>;
    onRevoke: (sid: string, env: Env, keyId: string) => Promise<void>;
    onCreateSub: () => void;
}) {
    const { openDrawer, toast } = useApp();
    const [issued, setIssued] = useState<{ token: string; expires: string } | null>(null);
    const [delTarget, setDelTarget] = useState<{ s: SubEntity; env: Env } | null>(null);
    const [deleting, setDeleting] = useState(false);

    if (loading) return <LoadingBox />;
    if (error) return <ErrorBox message={error} onRetry={onRetry} />;

    const open = (s: SubEntity, env: Env, regenerate: boolean) =>
        openDrawer(<TokenDrawer entityName={s.name} envLabel={ENVS.find((x) => x.value === env)?.label ?? ""} regenerate={regenerate}
            defaultNote={undefined}
            onSave={async (n, e, c) => { setIssued(await onIssue(s.id, env, n, e, c)); }} />);
    const revoke = async () => {
        if (!delTarget) return;
        const { s, env } = delTarget;
        const token = tokens[s.id]?.[env];
        if (!token) { setDelTarget(null); return; }
        setDeleting(true);
        try { await onRevoke(s.id, env, token.id); toast("Token deleted"); setDelTarget(null); }
        catch (e) { toast(e instanceof Error ? e.message : "Delete failed"); }
        finally { setDeleting(false); }
    };

    return (
        <div className="flex flex-col gap-4">
            <DCard title="Manage the API tokens for each Environment">
                <p className="text-sm text-muted">Each Environment can have one active Sandbox token and one active Live token. Regenerate to replace the current one.</p>
            </DCard>

            {subs.length === 0 && (
                <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dotted border-brand bg-brandsoft px-6 py-10 text-center">
                    <KeyRound className="size-8 text-brand" />
                    <div>
                        <h3 className="text-sm font-bold text-ink">Create an environment first</h3>
                        <p className="mt-1 text-xs text-muted">Tokens are generated per Environment, with a Sandbox and a Live token each.</p>
                        <p className="mt-2 text-xs font-semibold text-brand">Once it is created, you will be redirected to the Environment tab.</p>
                    </div>
                    <button className={btn.navy} onClick={onCreateSub}>
                        <Plus className="size-4" /> New Environment
                    </button>
                </div>
            )}

            {subs.map((s) => (
                <section key={s.id} className="rounded-xl border border-line bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 truncate text-sm font-bold text-ink">
                        <Globe className="size-4 shrink-0" /> <span className="truncate">{s.name}</span>
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {ENVS.map((en) => {
                            const token = tokens[s.id]?.[en.value] ?? null;
                            const left = token ? daysLeftOf(token) : null;
                            const expired = !!token?.expiresAt && left === 0;
                            return (
                                <div key={en.value}>
                                    {token ? (
                                        <div className="overflow-hidden rounded-xl border border-line">
                                            <div className="flex items-center justify-between bg-surfacealt px-4 py-3">
                                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><KeyRound className="size-4" /> {en.label} Token</span>
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
                                                    <button className={btn.info} onClick={() => open(s, en.value, true)}><RefreshCw className="size-4" /> Regenerate</button>
                                                    <button className={btn.danger} onClick={() => setDelTarget({ s, env: en.value })}><Trash2 className="size-4" /> Delete</button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={() => open(s, en.value, false)}
                                            className="flex min-h-[180px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dotted border-brand bg-brandsoft text-sm font-bold text-brand transition hover:bg-white">
                                            <KeyRound className="size-5" /> Generate {en.label} Token <Plus className="size-4" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}

            {issued && <TokenModal token={issued.token} expires={issued.expires} onDone={() => setIssued(null)} />}
            <ConfirmDialog
                isOpen={!!delTarget}
                onClose={() => !deleting && setDelTarget(null)}
                onConfirm={() => void revoke()}
                loading={deleting}
                type="delete"
                title="Delete token"
                message={delTarget ? `Delete the ${delTarget.env === "live" ? "Live" : "Sandbox"} token for ${delTarget.s.name}? Apps using it will stop working.` : ""}
                confirmText="Delete"
            />
        </div>
    );
}

/* ---------------- Summary cards ---------------- */
function EnvSummaryCards({ name, total, picked, margined, recs, onProducts, onMargins }: {
    name: string; total: number; picked: number; margined: number; recs?: Record<Env, TokenRec | null>;
    onProducts: () => void; onMargins: () => void;
}) {
    const clickable = "group flex flex-col gap-3 rounded-xl border border-line bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30";
    const tile = "grid size-10 shrink-0 place-items-center rounded-lg bg-brandsoft text-brand";
    const label = "text-xs font-bold uppercase tracking-wide text-muted";
    const hint = (
        <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-brand">
            Click to manage <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
    );
    return (
        <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1.5 text-xs text-muted">
                <MousePointerClick className="size-3.5" /> The Products and Margins cards are clickable. Click one to open it.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
                <button type="button" onClick={onProducts} className={clickable}>
                    <span className="flex items-center gap-3"><span className={tile}><Package className="size-5" /></span><span className={label}>Manage Products</span></span>
                    <span className="text-3xl font-bold text-ink">{picked}<span className="ml-2 text-sm font-medium text-muted">of {total} available</span></span>
                    {hint}
                </button>
                <button type="button" onClick={onMargins} className={clickable}>
                    <span className="flex items-center gap-3"><span className={tile}><Percent className="size-5" /></span><span className={label}>Margin Settings</span></span>
                    <span className="text-3xl font-bold text-ink">{margined}<span className="ml-2 text-sm font-medium text-muted">of {picked} selected</span></span>
                    {hint}
                </button>
                <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5">
                    <span className="flex items-center gap-3"><span className={tile}><KeyRound className="size-5" /></span><span className={label}>{name} Token Details</span></span>
                    <div className="flex flex-col gap-2 text-xs">
                        {ENVS.map((en) => {
                            const rec = recs?.[en.value];
                            const left = rec ? daysLeftOf(rec) : null;
                            return (
                                <span key={en.value} className="inline-flex items-center gap-1.5">
                                    <span className={`size-2 rounded-full ${rec ? "bg-good" : "bg-gray-300"}`} />
                                    <span className="font-semibold text-ink">{en.label}:</span>
                                    <span className="text-muted">{!rec ? "Not generated yet" : left == null ? "Never expires" : `${left} days left`}</span>
                                </span>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}

/* ---------------- Summary cards skeleton ---------------- */
function EnvSummarySkeleton() {
    return (
        <div className="flex flex-col gap-2">
            <div className="skeleton h-4 w-72 max-w-full" />
            <div className="grid gap-4 md:grid-cols-3">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5">
                        <div className="flex items-center gap-3">
                            <div className="skeleton size-10 shrink-0" />
                            <div className="skeleton h-4 w-32" />
                        </div>
                        <div className="skeleton h-9 w-40" />
                        <div className="skeleton h-4 w-28" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ---------------- Environment drawer (create + edit) ---------------- */
interface SubEntity { id: string; name: string; description: string }

function SubEntityDrawer({ initial, onSave }: { initial?: SubEntity; onSave: (name: string, description: string) => Promise<void> }) {
    const [name, setName] = useState(initial?.name ?? "");
    const [desc, setDesc] = useState(initial?.description ?? "");
    const [err, setErr] = useState("");
    const [saving, setSaving] = useState(false);
    return (
        <Drawer
            title={initial ? "Edit Environment" : "New Environment"}
            kicker="Environment"
            width="min(420px, calc(100vw - 20px))"
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
            <Field label="Environment Name" required error={err}>
                <TextInput value={name} placeholder="e.g. Local" onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Description">
                <TextArea rows={4} value={desc} placeholder="What is this Environment used for?" onChange={(e) => setDesc(e.target.value)} />
            </Field>
        </Drawer>
    );
}

/* ---------------- Page ---------------- */
export default function InstanceDetail() {
    const { id } = useParams();
    const { openDrawer, toast, toastError } = useApp();
    const [inst, setInst] = useState<Instance | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadErr, setLoadErr] = useState("");
    const load = useCallback(async (iid: string) => {
        setLoading(true);
        setLoadErr("");
        try { setInst(await entityService.get(iid)); }
        catch (e) { setLoadErr(e instanceof Error ? e.message : "Failed to load client"); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { if (id) void load(id); }, [id, load]);
    const [sp] = useSearchParams();
    const [tab, setTab] = useState(sp.get("tab") === "token" ? "token" : "entity");
    const [subs, setSubs] = useState<SubEntity[]>([]);
    const [subId, setSubId] = useState("");
    const [subsLoading, setSubsLoading] = useState(true);
    const [subsErr, setSubsErr] = useState("");


    const [switching, setSwitching] = useState(false);
    useEffect(() => {
        if (!switching) return;
        const t = window.setTimeout(() => setSwitching(false), 500);
        return () => window.clearTimeout(t);
    }, [switching]);
    const pickSub = (sid: string) => {
        if (sid === subId) return; // same tab: nothing to reload
        setSubId(sid);
        setSwitching(true);
    };
    const loadSubs = useCallback(async (eid: string) => {
        setSubsLoading(true);
        setSubsErr("");
        try {
            const list = await subEntityService.list(eid);
            setSubs(list);
            setSubId((cur) => (list.some((s) => s.id === cur) ? cur : list[0]?.id ?? ""));
        } catch (e) {
            setSubsErr(e instanceof Error ? e.message : "Failed to load environments");
        } finally {
            setSubsLoading(false);
        }
    }, []);
    useEffect(() => { if (id) void loadSubs(id); }, [id, loadSubs]);
    const [allProducts, setAllProducts] = useState<ProductRec[]>([]);
    const [margins, setMargins] = useState<MarginRec[]>([]);
    const [picked, setPicked] = useState<Record<string, string[]>>({}); // mock: subId -> product ids
    useEffect(() => {
        productsService.list().then(setAllProducts).catch(() => toastError("Failed to load products"));
        marginsService.list().then(setMargins).catch(() => toastError("Failed to load margins"));
    }, [toastError]);
    const [tokens, setTokens] = useState<Record<string, Record<Env, TokenRec | null>>>({});
    const [tokenLoading, setTokenLoading] = useState(true);
    const [tokenErr, setTokenErr] = useState("");
    const loadTokens = useCallback(async (list: SubEntity[]) => {
        setTokenLoading(true);
        setTokenErr("");
        try {
            const recs = await Promise.all(list.map((s) => apiKeyService.active(s.id)));
            setTokens(Object.fromEntries(list.map((s, i) => [s.id, recs[i]])));
        } catch (e) { setTokenErr(e instanceof Error ? e.message : "Failed to load tokens"); }
        finally { setTokenLoading(false); }
    }, []);
    // runs after the Environment list loads, not when one is added
    useEffect(() => { if (!subsLoading) void loadTokens(subs); }, [subsLoading]); // eslint-disable-line react-hooks/exhaustive-deps
    const [info, setInfo] = useState<Partial<Pick<Instance, "name" | "description" | "status">>>({});
    const [editingInfo, setEditingInfo] = useState(false);
    const [infoDraft, setInfoDraft] = useState<{ name: string; description: string; status: Status } | null>(null);
    const [infoErr, setInfoErr] = useState("");
    if (loading) return <LoadingBox />;
    if (loadErr) return <ErrorBox message={loadErr} onRetry={() => id && void load(id)} backTo={BASE} />;
    if (!inst) return <NotFound backTo={BASE} />;
    const view = { ...inst, ...info };
    const envName = subs.find((s) => s.id === subId)?.name ?? view.name;
    const pickedIds = picked[subId] ?? [];
    const marginedIds = new Set(margins.map((m) => m.productId));
    const marginedCount = pickedIds.filter((pid) => marginedIds.has(pid)).length;
    const openProducts = () => openDrawer(
        <EnvProductsDrawer envName={envName} products={allProducts} initial={pickedIds}
            onSave={(ids) => { setPicked((m) => ({ ...m, [subId]: ids })); toast("Products saved"); }} />);
    const openMargins = () => {
        if (!pickedIds.length) { toastError("Select products first"); return; }
        openDrawer(
            <EnvMarginsDrawer envName={envName} products={allProducts.filter((p) => pickedIds.includes(p.id))} margins={margins}
                onSaved={(recs) => setMargins((l) => [...l.filter((x) => !recs.some((r) => r.productId === x.productId)), ...recs])} />);
    };
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
            toast("Client details updated");
        } catch (e) {
            setInfoErr(e instanceof Error ? e.message : "Update failed"); // duplicate name shows under the field
        }
    };

    const addSub = async (name: string, description: string) => {
        const s = await subEntityService.create(inst.id, { name, description });
        setSubs((l) => [...l, s]);
        setSubId(s.id);
        setTokens((m) => ({ ...m, [s.id]: { sandbox: null, live: null } }));
        toast("Environment created");
    };
    const editSub = async (sid: string, name: string, description: string) => {
        const s = await subEntityService.update(sid, { name, description });
        setSubs((l) => l.map((x) => (x.id === sid ? s : x)));
        toast("Environment updated");
    };

    const issueToken = async (sid: string, env: Env, notes: string, exp: Exp, custom: string) => {
        const b = { note: notes, expiresInDays: toDays(exp, custom) };
        const cur = tokens[sid]?.[env];
        const r = cur ? await apiKeyService.regenerate(cur.id, b) : await apiKeyService.create(sid, env, b);
        setTokens((m) => ({ ...m, [sid]: { ...(m[sid] ?? { sandbox: null, live: null }), [env]: r.rec } }));
        return { token: r.key, expires: r.rec.expires };
    };
    const revokeToken = async (sid: string, env: Env, keyId: string) => {
        await apiKeyService.revoke(keyId);
        setTokens((m) => ({ ...m, [sid]: { ...(m[sid] ?? { sandbox: null, live: null }), [env]: null } }));
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
                                <Field label="Client Name" required error={infoErr}>
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
                <div role="tablist" aria-label="Client tabs" className="flex gap-1 bg-sidebar-border px-2 pt-2">
                    {([["entity", "Environments", Layers], ["token", "Token Generation", KeyRound]] as const).map(([k, t, Icon]) => (
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
                <section className={`${subs.length === 0 ? "hidden" : "flex"} w-full min-w-0 items-center gap-2 rounded-xl border border-line bg-white p-3`}>
                    <div className="thin-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1">
                        {subs.map((s) => {
                            const active = s.id === subId;
                            return (
                                <div key={s.id} className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border text-xs font-semibold ${active ? "border-action bg-action text-white" : "border-line bg-surfacealt text-muted"}`}>
                                    <button type="button" className="px-3 py-2" onClick={() => pickSub(s.id)}>{s.name}</button>
                                    <button type="button" aria-label={`Edit ${s.name}`} title="Edit" className="py-2 pr-2.5"
                                        onClick={() => { pickSub(s.id); openDrawer(<SubEntityDrawer initial={s} onSave={(n, d) => editSub(s.id, n, d)} />); }}>
                                        <Settings className="size-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    <button className={`${btn.navy} shrink-0`} onClick={() => openDrawer(<SubEntityDrawer onSave={addSub} />)}>
                        <Plus className="size-4" /> New Environment
                    </button>
                </section>

                {subsLoading ? <LoadingBox /> : subsErr ? (
                    <ErrorBox message={subsErr} onRetry={() => void loadSubs(inst.id)} />
                ) : subs.length === 0 ? (
                    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dotted border-brand bg-brandsoft px-6 py-10 text-center">
                        <Layers className="size-8 text-brand" />
                        <div>
                            <h3 className="text-sm font-bold text-ink">No environments yet</h3>
                            <p className="mt-1 text-xs text-muted">Create an environment to manage its products and tokens.</p>
                        </div>
                        <button className={btn.navy} onClick={() => openDrawer(<SubEntityDrawer onSave={addSub} />)}>
                            <Plus className="size-4" /> New Environment
                        </button>
                    </div>
                ) : (
                    <>
                        {switching ? <EnvSummarySkeleton /> : (
                            <EnvSummaryCards name={envName} total={allProducts.length} picked={pickedIds.length} margined={marginedCount}
                                recs={tokens[subId]} onProducts={openProducts} onMargins={openMargins} />
                        )}
                        <section className="flex flex-col items-center gap-4 rounded-xl border border-line bg-white px-6 py-10 text-center">
                            <img src={credsIllustration} alt="Environment credentials" className="h-48 w-auto max-w-full" />
                            <div>
                                <h3 className="text-sm font-bold text-ink">Environment credentials will appear here</h3>
                                <p className="mt-1 text-xs text-muted">Credentials for {envName} will be available in this section soon.</p>
                            </div>
                        </section>
                    </>
                )}
            </div>
            <div className={tab === "token" ? "" : "hidden"}>
                <TokenTab subs={subs} tokens={tokens} loading={tokenLoading} error={tokenErr}
                    onRetry={() => void loadTokens(subs)} onIssue={issueToken} onRevoke={revokeToken}
                    onCreateSub={() => openDrawer(<SubEntityDrawer onSave={async (n, d) => { await addSub(n, d); setTab("entity"); }} />)} />
            </div>
        </div>
    );
}