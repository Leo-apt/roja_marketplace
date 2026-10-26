import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/hooks/useApp";
import Dropdownbox from "@/components/shared/Dropdownbox";
import { Alert } from "@/components/auth/AuthShell";
import { btn, Check, Field, inputCls, TextArea, TextInput } from "@/components/catalog/FormBits";
import { DCard } from "@/components/catalog/DetailBits";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import {
    docsService, METHODS, type DocHeader, type DocParam, type DocRec, type DocResponse, type Method,
} from "@/services/docs.service";
import { providersService } from "@/services/providers.service";

const BASE = "/tools/documents-manage";
const TYPES = ["String", "Number", "Boolean", "Object", "Array"];
const blankHeader: DocHeader = { field: "", type: "String", details: "" };
const blankParam: DocParam = { field: "", type: "String", required: false, details: "" };
const blankResp: DocResponse = { code: "", subject: "", details: "" };
type Opt = { value: string; label: string };

interface Form {
    name: string; service: string; method: Method; url: string; providerId: string; description: string;
    headers: DocHeader[]; body: DocParam[]; responses: DocResponse[];
    requestExample: string; responseExample: string; isActive: boolean;
}

function StepTitle({ n, children }: { n: number; children: ReactNode }) {
    return (
        <div className="mb-4 flex items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">{n}</span>
            <h3 className="text-sm font-bold uppercase tracking-wide text-ink">{children}</h3>
        </div>
    );
}

interface RowCol { key: string; label: string; kind?: "text" | "select" | "check"; options?: string[]; placeholder?: string }

// one editable table (Headers / Body / Response codes)
function RowsEditor<T extends object>({ title, rows, cols, blank, addLabel, onChange }: {
    title: string; rows: T[]; cols: RowCol[]; blank: T; addLabel: string; onChange: (r: T[]) => void;
}) {
    const val = (r: T, k: string) => (r as Record<string, unknown>)[k];
    const patch = (i: number, k: string, v: string | boolean) =>
        onChange(rows.map((r, n) => (n === i ? { ...r, [k]: v } : r)));
    const th = "border-b border-linesoft bg-surfacealt px-3 py-2 text-left text-xs font-bold text-th-text";
    return (
        <div className="mt-5">
            <h4 className="mb-2 text-sm font-semibold text-ink">{title}</h4>
            {rows.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-line">
                    <table className="w-full border-collapse text-xs">
                        <thead>
                            <tr>
                                {cols.map((c) => <th key={c.key} className={th}>{c.label}</th>)}
                                <th className={`${th} w-20`} />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={i}>
                                    {cols.map((c) => (
                                        <td key={c.key} className="min-w-[130px] border-b border-linesoft px-2 py-2 align-middle">
                                            {c.kind === "select" ? (
                                                <select className={inputCls} value={String(val(r, c.key) ?? "")} onChange={(e) => patch(i, c.key, e.target.value)}>
                                                    {c.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            ) : c.kind === "check" ? (
                                                <Check label="Required" checked={!!val(r, c.key)} onChange={(on) => patch(i, c.key, on)} />
                                            ) : (
                                                <TextInput value={String(val(r, c.key) ?? "")} placeholder={c.placeholder} onChange={(e) => patch(i, c.key, e.target.value)} />
                                            )}
                                        </td>
                                    ))}
                                    <td className="border-b border-linesoft px-2 py-2 text-center">
                                        <button type="button" className="text-xs font-semibold text-bad hover:underline" onClick={() => onChange(rows.filter((_, n) => n !== i))}>Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <button type="button" className={`${btn.secondary} mt-2`} onClick={() => onChange([...rows, { ...blank }])}>{addLabel}</button>
        </div>
    );
}

function DocForm({ initial, providers }: { initial?: DocRec; providers: Opt[] }) {
    const nav = useNavigate();
    const { toast } = useApp();
    const isEdit = !!initial;
    const [f, setF] = useState<Form>({
        name: initial?.name ?? "", service: initial?.service ?? "", method: initial?.method ?? "POST", url: initial?.url ?? "",
        providerId: initial?.providerId ?? "", description: initial?.description ?? "",
        headers: initial?.headers.length ? initial.headers : [{ ...blankHeader }],
        body: initial?.body.length ? initial.body : [{ ...blankParam }],
        responses: initial?.responses.length ? initial.responses : [{ ...blankResp }],
        requestExample: initial?.requestExample ?? "", responseExample: initial?.responseExample ?? "",
        isActive: initial?.isActive ?? true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);
    const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

    const submit = async () => {
        const e: Record<string, string> = {};
        if (f.name.trim().length < 3) e.name = "API name must be at least 3 characters";
        if (!f.url.trim()) e.url = "URL is required";
        setErrors(e);
        setApiError("");
        if (Object.keys(e).length) return;
        setSaving(true);
        try {
            const input = {
                ...f,
                providerId: f.providerId || null,
                headers: f.headers.filter((h) => h.field.trim()),
                body: f.body.filter((b) => b.field.trim()),
                responses: f.responses.filter((r) => r.code.trim()),
            };
            if (initial) await docsService.update(initial.id, input);
            else await docsService.create(input);
            toast(isEdit ? "Documentation updated" : "Documentation created");
            nav(BASE);
        } catch (err) {
            setApiError(err instanceof Error ? err.message : "Save failed");
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <DCard title={isEdit ? "EDIT API DOCUMENTATION" : "ADD API DOCUMENTATION"}>
                {apiError && <Alert kind="error">{apiError}</Alert>}
                <StepTitle n={1}>API details</StepTitle>
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Service">
                        <TextInput value={f.service} maxLength={100} placeholder="e.g. SMS" onChange={(e) => set("service", e.target.value)} />
                    </Field>
                    <Field label="Provider">
                        <Dropdownbox name="provider" value={f.providerId || "none"} rounded="rounded-md" compact
                            options={[{ value: "none", label: "General (no provider)" }, ...providers]}
                            onChange={(e) => set("providerId", e.target.value === "none" ? "" : e.target.value)} />
                    </Field>
                    <Field label="API Name" required error={errors.name}>
                        <TextInput value={f.name} maxLength={100} placeholder="e.g. Create customer" onChange={(e) => set("name", e.target.value)} />
                    </Field>
                    <Field label="Method" required>
                        <Dropdownbox name="method" value={f.method} rounded="rounded-md" compact
                            options={METHODS.map((m) => ({ value: m, label: m }))}
                            onChange={(e) => set("method", e.target.value as Method)} />
                    </Field>
                    <Field label="URL" required error={errors.url}>
                        <TextInput value={f.url} maxLength={500} placeholder="/public/payments/create-customer" onChange={(e) => set("url", e.target.value)} />
                    </Field>
                </div>
                <div className="mt-5">
                    <Field label="Description">
                        <TextArea rows={3} maxLength={1000} value={f.description} onChange={(e) => set("description", e.target.value)} />
                    </Field>
                </div>

                <div className="mt-6 border-t border-line pt-5">
                    <StepTitle n={2}>Parameters</StepTitle>
                    <RowsEditor<DocHeader> title="Headers" rows={f.headers} blank={blankHeader} addLabel="Add header"
                        onChange={(r) => set("headers", r)}
                        cols={[
                            { key: "field", label: "Field", placeholder: "x-api-key" },
                            { key: "type", label: "Type", kind: "select", options: TYPES },
                            { key: "details", label: "Details" },
                        ]} />
                    <RowsEditor<DocParam> title="Body parameters" rows={f.body} blank={blankParam} addLabel="Add body parameter"
                        onChange={(r) => set("body", r)}
                        cols={[
                            { key: "field", label: "Field", placeholder: "email" },
                            { key: "type", label: "Type", kind: "select", options: TYPES },
                            { key: "required", label: "Required", kind: "check" },
                            { key: "details", label: "Details" },
                        ]} />
                    <RowsEditor<DocResponse> title="Response codes" rows={f.responses} blank={blankResp} addLabel="Add response code"
                        onChange={(r) => set("responses", r)}
                        cols={[
                            { key: "code", label: "Code", placeholder: "200" },
                            { key: "subject", label: "Meaning", placeholder: "Customer created" },
                        ]} />
                </div>

                <div className="mt-6 border-t border-line pt-5">
                    <StepTitle n={3}>Examples & status</StepTitle>
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Request example">
                            <TextArea rows={8} maxLength={10000} value={f.requestExample} onChange={(e) => set("requestExample", e.target.value)} />
                        </Field>
                        <Field label="Response example">
                            <TextArea rows={8} maxLength={10000} value={f.responseExample} onChange={(e) => set("responseExample", e.target.value)} />
                        </Field>
                    </div>
                    <div className="mt-5">
                        <Check label="Active (shown on the Documents page)" checked={f.isActive} onChange={(on) => set("isActive", on)} />
                    </div>
                </div>
            </DCard>
            <div className="flex justify-end gap-2">
                <button className={btn.cancel} onClick={() => nav(BASE)} disabled={saving}>Cancel</button>
                <button className={btn.primary} onClick={submit} disabled={saving}>{saving ? "Saving…" : "Submit"}</button>
            </div>
        </div>
    );
}

export default function DocsManage() {
    const { id } = useParams();
    const isAdmin = useIsAdmin();
    const [data, setData] = useState<{ rec?: DocRec; providers: Opt[] } | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isAdmin) return;
        let live = true;
        Promise.all([providersService.listPage(1, 1000), id ? docsService.get(id) : Promise.resolve(undefined)])
            .then(([ps, rec]) => {
                if (!live) return;
                setData({
                    rec,
                    providers: ps.rows.map((p) => ({ value: p.id, label: p.providerId ? `${p.name} - ${p.providerId}` : p.name })),
                });
            })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id, isAdmin]);

    if (!isAdmin) return <AdminNotice />;
    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!data || (id && data.rec?.id !== id)) return <LoadingBox />;
    return <DocForm key={id ?? "new"} initial={data.rec} providers={data.providers} />;
}