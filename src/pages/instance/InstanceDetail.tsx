import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import { Check as CheckIcon, Copy, Pencil } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import Tabs from "@/components/shared/Tabs";
import Dropdownbox from "@/components/shared/Dropdownbox";
import DatePicker from "@/components/shared/DatePicker";
import { DCard, DetailShell, Grid, KV, NotFound, StatusBadge } from "@/components/catalog/DetailBits";
import { btn, Field, MoneyInput, Radio, TextArea, TextInput } from "@/components/catalog/FormBits";
import { instances, type Instance, type InstanceProduct } from "@/data/instances";
import type { Status } from "@/data/catalog";
import { statusFormOptions, usd } from "@/utils/catalog";

const BASE = "/instances";

/* ---------------- Products tab ---------------- */
function ProductsTab({ inst }: { inst: Instance }) {
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
        return <div className="py-10 text-center text-sm text-muted">No products are associated with this instance.</div>;
    }

    return (
        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
            <div role="tablist" aria-orientation="vertical" className="flex flex-col gap-1 md:border-r md:border-line md:pr-3">
                {items.map((p) => (
                    <button key={p.id} role="tab" aria-selected={p.id === selId} onClick={() => pick(p.id)}
                        className={`rounded-md px-3 py-2.5 text-left text-xs ${p.id === selId ? "bg-brandsoft font-semibold text-brand" : "text-[#3c4d66] hover:bg-gray-50"}`}>
                        {p.name}
                    </button>
                ))}
            </div>

            {sel && (
                <div className="min-w-0">
                    <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
                        <h3 className="truncate text-sm font-bold text-ink">{editing && draft ? draft.name || "Edit product" : sel.name}</h3>
                        {editing ? (
                            <div className="flex gap-2">
                                <button className={btn.cancel} onClick={reset}>Cancel</button>
                                <button className={btn.primary} onClick={save}>Save</button>
                            </div>
                        ) : (
                            <button className={btn.brand} onClick={startEdit}><Pencil className="size-4" /> Edit</button>
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
interface TokenRec { id: string; notes: string; created: string; expires: string; hint: string }

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

function TokenTab() {
    const [notes, setNotes] = useState("");
    const [exp, setExp] = useState<Exp>("30");
    const [custom, setCustom] = useState("");
    const [errors, setErrors] = useState({ notes: "", custom: "" });
    const [issued, setIssued] = useState<{ token: string; expires: string } | null>(null);
    const [list, setList] = useState<TokenRec[]>([
        { id: "t0", notes: "CI pipeline", created: "Oct 01, 2026", expires: "Dec 31, 2026", hint: "a91f" },
    ]);

    const generate = () => {
        const e = {
            notes: notes.trim() ? "" : "Notes are required",
            custom: exp === "custom" && !custom ? "Pick an expiration date" : "",
        };
        setErrors(e);
        if (e.notes || e.custom) return;
        const token = makeToken();
        const expires = expiryLabel(exp, custom);
        setList((l) => [{ id: `t${Date.now()}`, notes: notes.trim(), created: fmtDate(new Date()), expires, hint: token.slice(-4) }, ...l]);
        setIssued({ token, expires });
        setNotes(""); setExp("30"); setCustom("");
    };

    return (
        <div className="flex flex-col gap-4">
            <DCard title="Generate Token">
                <div className="flex flex-col gap-5">
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
                            <div className="mt-3 md:max-w-[50%]">
                                <DatePicker value={custom} minDate={TODAY} placeholder="Select date" onChange={setCustom} />
                            </div>
                        )}
                    </Field>
                    <div><button className={btn.primary} onClick={generate}>Generate Token</button></div>
                </div>
            </DCard>

            <DCard title="Generated Tokens">
                <div className="overflow-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr className="text-[#6a7790]">
                                <th className="border-b border-linesoft py-2 pr-3">Notes</th>
                                <th className="border-b border-linesoft py-2 pr-3">Created</th>
                                <th className="border-b border-linesoft py-2 pr-3">Expires</th>
                                <th className="border-b border-linesoft py-2">Token</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((t) => (
                                <tr key={t.id} className="text-[#3c4d66]">
                                    <td className="border-b border-linesoft py-2.5 pr-3">{t.notes}</td>
                                    <td className="whitespace-nowrap border-b border-linesoft py-2.5 pr-3">{t.created}</td>
                                    <td className="whitespace-nowrap border-b border-linesoft py-2.5 pr-3">{t.expires}</td>
                                    <td className="border-b border-linesoft py-2.5 font-mono">roja_••••••••{t.hint}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DCard>

            {issued && <TokenModal token={issued.token} expires={issued.expires} onDone={() => setIssued(null)} />}
        </div>
    );
}

/* ---------------- Page ---------------- */
export default function InstanceDetail() {
    const { id } = useParams();
    const inst = instances.find((i) => i.id === id);
    const [tab, setTab] = useState("products");
    if (!inst) return <NotFound backTo={BASE} />;

    return (
        <DetailShell backTo={BASE}>
            <section className="flex items-center gap-4 rounded-xl border border-line bg-white p-5">
                {inst.imageUrl
                    ? <img src={inst.imageUrl} alt={inst.name} className="size-14 rounded-lg object-cover" />
                    : <span className="grid size-14 place-items-center rounded-lg bg-brandsoft text-lg font-bold text-brand">{inst.name[0]}</span>}
                <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-bold text-ink">{inst.name}</h2>
                    <p className="text-xs text-muted">{inst.description || "No description"}</p>
                </div>
                <StatusBadge status={inst.status} />
            </section>

            <section className="rounded-xl border border-line bg-white">
                <Tabs tabs={[["products", "Products"], ["token", "Token Generation"]]} value={tab} onChange={setTab} label="Instance tabs" />
                {/* both tabs stay mounted so unsaved edits and the token form survive tab switches */}
                <div className="p-5">
                    <div className={tab === "products" ? "" : "hidden"}><ProductsTab inst={inst} /></div>
                    <div className={tab === "token" ? "" : "hidden"}><TokenTab /></div>
                </div>
            </section>
        </DetailShell>
    );
}