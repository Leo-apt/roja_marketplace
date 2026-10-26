// Tools > Documents: full-screen API docs. Opens in its own tab, outside the app layout.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, ChevronRight, Copy, Link2 } from "lucide-react";
import { docsService, type DocRec } from "@/services/docs.service";

const SAVED = "docs-active-id";

interface Prov { name: string; docs: DocRec[] }
interface Svc { name: string; providers: Prov[] }
const svcOf = (d: DocRec) => d.service || "General";
const provOf = (d: DocRec) => d.providerName || "General";

const buildTree = (docs: DocRec[]): Svc[] => {
    const out: Svc[] = [];
    for (const d of docs) {
        let s = out.find((x) => x.name === svcOf(d));
        if (!s) { s = { name: svcOf(d), providers: [] }; out.push(s); }
        let p = s.providers.find((x) => x.name === provOf(d));
        if (!p) { p = { name: provOf(d), docs: [] }; s.providers.push(p); }
        p.docs.push(d);
    }
    return out;
};

// ---- JSON colours (same idea as the old page): keys purple, strings green, true/false blue ----
const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)|([{}[\],])/g;

function Highlight({ text }: { text: string }) {
    return (
        <>
            {text.split("\n").map((line, i) => {
                // a line like "200 :" is a status label
                if (/^\s*\d{3}\s*:?\s*$/.test(line)) return <div key={i} className="whitespace-pre text-code-status">{line}</div>;
                const out: ReactNode[] = [];
                let last = 0;
                let n = 0;
                for (const m of line.matchAll(TOKEN)) {
                    const at = m.index ?? 0;
                    if (at > last) out.push(line.slice(last, at));
                    if (m[1]) {
                        const isKey = !!m[2];
                        out.push(<span key={n++} className={isKey ? "font-semibold text-code-key" : "text-code-string"}>{m[1]}</span>);
                        if (m[2]) out.push(<span key={n++} className="text-code-punct">{m[2]}</span>);
                    } else if (m[3]) out.push(<span key={n++} className="text-code-bool">{m[3]}</span>);
                    else if (m[4]) out.push(<span key={n++} className="text-code-number">{m[4]}</span>);
                    else out.push(<span key={n++} className="text-code-punct">{m[5]}</span>);
                    last = at + m[0].length;
                }
                if (last < line.length) out.push(line.slice(last));
                return <div key={i} className="min-h-[1.5em] whitespace-pre">{out}</div>;
            })}
        </>
    );
}

function CodeBlock({ text }: { text: string }) {
    return (
        <pre className="thin-scrollbar overflow-x-auto rounded-xl bg-docs-deep p-5 font-mono text-xs leading-6 text-docs-text/90 border border-line">
            <Highlight text={text} />
        </pre>
    );
}

const th = "border border-line bg-surfacealt px-4 py-3 text-left text-sm font-bold text-ink";
const td = "border border-line px-4 py-3 align-top text-sm text-td-text";

export default function ToolsDocuments() {
    const [docs, setDocs] = useState<DocRec[] | null>(null);
    const [error, setError] = useState("");
    const [openSvc, setOpenSvc] = useState("");
    const [openProv, setOpenProv] = useState("");
    const [activeId, setActiveId] = useState("");
    const [copied, setCopied] = useState(false);

    // show one doc and open its service + provider in the menu
    const show = (d: DocRec) => {
        setOpenSvc(svcOf(d));
        setOpenProv(`${svcOf(d)}|${provOf(d)}`);
        setActiveId(d.id);
        try { localStorage.setItem(SAVED, d.id); } catch { /* storage unavailable */ }
    };

    useEffect(() => {
        docsService.all()
            .then((r) => {
                const list = r.filter((d) => d.isActive).reverse(); // oldest first
                setDocs(list);
                let saved = "";
                try { saved = localStorage.getItem(SAVED) ?? ""; } catch { /* ignore */ }
                const start = list.find((d) => d.id === saved) ?? list[0];
                if (start) show(start);
            })
            .catch((e) => setError(e instanceof Error ? e.message : "Failed to load documents"));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const tree = useMemo(() => buildTree(docs ?? []), [docs]);

    // click a service: open it and show its first provider's first API
    const toggleSvc = (s: Svc) => {
        if (openSvc === s.name) { setOpenSvc(""); return; }
        show(s.providers[0].docs[0]);
    };
    // click a provider: open it and show its first API
    const toggleProv = (s: Svc, p: Prov) => {
        const key = `${s.name}|${p.name}`;
        if (openProv === key) { setOpenProv(""); return; }
        setOpenProv(key);
        show(p.docs[0]);
    };

    if (error) return <p className="p-8 text-sm text-bad" role="alert">{error}</p>;
    if (!docs) return <p className="p-8 text-sm text-muted">Loading documentation…</p>;
    if (docs.length === 0) return <p className="p-8 text-sm text-muted">No documentation has been published yet.</p>;

    const d = docs.find((x) => x.id === activeId) ?? docs[0];
    const copy = () => navigator.clipboard.writeText(d.url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
    const h3 = "mb-3 text-xl font-semibold uppercase text-label";

    return (
        <div className="grid min-h-screen bg-card text-ink lg:h-screen lg:grid-cols-[260px_minmax(0,1fr)_minmax(300px,30%)]">
            {/* ───── left menu ───── */}
            <aside className="thin-scrollbar bg-docs-bg text-docs-text lg:h-screen lg:overflow-y-auto border-r border-line">
                <div className="border-b border-docs-line px-5 py-6">
                    <h2 className="text-3xl font-bold">API Docs</h2>
                </div>
                <div className="flex flex-col gap-2 border-b border-docs-line px-5 py-5 text-sm">
                    <div className="font-semibold">API Documentation</div>
                    <div><b className="text-docs-muted">Version:</b> 1.0.0</div>
                    <div><b className="text-docs-muted">Last Updated:</b> {d.updatedOn}</div>
                </div>
                <p className="flex items-center gap-2 px-5 py-5 text-sm font-semibold uppercase tracking-wider text-docs-muted">
                    <Link2 className="size-4" /> API Endpoints
                </p>
                {tree.map((s) => {
                    const sOpen = openSvc === s.name;
                    return (
                        <div key={s.name}>
                            <button type="button" aria-expanded={sOpen} onClick={() => toggleSvc(s)}
                                className={`flex w-full items-center justify-between px-5 py-3.5 text-left text-base font-medium text-docs-text bg-docs-svc" : "hover:bg-docs-hover"}`}>
                                {s.name}
                                {sOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                            </button>
                            {sOpen && s.providers.map((p) => {
                                const pOpen = openProv === `${s.name}|${p.name}`;
                                return (
                                    <div key={p.name}>
                                        <button type="button" aria-expanded={pOpen} onClick={() => toggleProv(s, p)}
                                            className={`flex w-full items-center justify-between px-8 py-3 text-left text-sm font-medium text-docs-text ${pOpen ? "bg-docs-prov" : "hover:bg-docs-hover"}`}>
                                            {p.name}
                                            {pOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                                        </button>
                                        {pOpen && p.docs.map((x) => (
                                            <button key={x.id} type="button" onClick={() => show(x)}
                                                className={`block w-full truncate py-2.5 pl-12 pr-4 text-left text-sm ${x.id === d.id ? "bg-docs-api font-medium text-docs-api-text" : "text-docs-text/90 hover:bg-docs-hover"}`}>
                                                {x.name}
                                            </button>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </aside>

            {/* ───── middle: details ───── */}
            <main className="thin-scrollbar min-w-0 px-5 py-8 lg:h-screen lg:overflow-y-auto lg:px-8">
                <h1 className="text-2xl font-semibold tracking-tight">{d.name}</h1>
                {d.description && <p className="mt-2 text-base leading-7 text-muted">{d.description}</p>}

                <h2 className="mt-8 border-b border-line pb-2 text-xl font-semibold">Endpoint</h2>
                <p className="mt-4 text-muted">To use this API, make a call to the following URL:</p>
                <div className="mt-4 flex items-stretch overflow-hidden rounded-lg border border-line">
                    <span className="grid place-items-center bg-docs-method px-5 text-sm font-bold text-white">{d.method}</span>
                    <code className="min-w-0 flex-1 break-all bg-surfacealt px-4 py-3 font-mono text-sm text-ink">{d.url}</code>
                    <button type="button" onClick={copy} aria-label="Copy URL"
                        className="grid w-12 place-items-center border-l border-line bg-card text-brand hover:bg-brandsoft">
                        {copied ? <Check className="size-4 text-good" /> : <Copy className="size-4" />}
                    </button>
                </div>

                {d.headers.length > 0 && (
                    <section className="mt-10">
                        <h3 className={h3}>Headers</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse"><thead><tr><th className={th}>Field</th><th className={th}>Type</th><th className={th}>Description</th></tr></thead>
                                <tbody>{d.headers.map((h, i) => <tr key={i}><td className={td}>{h.field}</td><td className={td}>{h.type}</td><td className={td}>{h.details || "-"}</td></tr>)}</tbody></table>
                        </div>
                    </section>
                )}

                {d.body.length > 0 && (
                    <section className="mt-10">
                        <h3 className={h3}>Body parameters</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse"><thead><tr><th className={th}>Field</th><th className={th}>Type</th><th className={`${th} text-center`}>Required</th><th className={th}>Description</th></tr></thead>
                                <tbody>{d.body.map((b, i) => (
                                    <tr key={i}><td className={td}>{b.field}</td><td className={td}>{b.type}</td>
                                        <td className={`${td} text-center`}><input type="checkbox" checked={b.required} readOnly className="accent-brand" /></td>
                                        <td className={td}>{b.details || "-"}</td></tr>
                                ))}</tbody></table>
                        </div>
                    </section>
                )}

                {d.responses.length > 0 && (
                    <section className="mt-10">
                        <h3 className={h3}>Response codes</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse"><thead><tr><th className={th}>Code</th><th className={th}>Meaning</th></tr></thead>
                                <tbody>{d.responses.map((r, i) => <tr key={i}><td className={`${td} font-semibold`}>{r.code}</td><td className={td}>{r.subject || "-"}</td></tr>)}</tbody></table>
                        </div>
                    </section>
                )}
            </main>

            {/* ───── right: code ───── */}
            <section className="thin-scrollbar bg-docs-bg px-5 py-6 text-white lg:h-screen lg:overflow-y-auto border-l border-line">
                {d.requestExample && (
                    <div>
                        <h3 className="border-b border-docs-line pb-2 text-2xl font-bold">Request</h3>
                        <h4 className="my-4 text-lg font-semibold text-docs-muted">Body</h4>
                        <CodeBlock text={d.requestExample} />
                    </div>
                )}
                {d.responseExample && (
                    <div className="mt-8">
                        <h3 className="border-b border-docs-line pb-2 text-2xl font-bold">Response</h3>
                        <h4 className="my-4 text-lg font-semibold text-docs-muted">Response</h4>
                        <CodeBlock text={d.responseExample} />
                    </div>
                )}
            </section>
        </div>
    );
}