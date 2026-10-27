// Marketplace > Approvals & audit: configuration release queue (maker/checker) and the audit log (sample data for now).
import { useState } from "react";
import { CheckCheck, Eye, History, ShieldCheck, Hourglass, Rocket } from "lucide-react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import { btn } from "@/components/catalog/FormBits";
import type { FilterField } from "@/components/catalog/ListDrawers";
import type { Stat } from "@/components/catalog/StatCards";
import Drawer from "@/components/shared/Drawer";
import Dropdownbox from "@/components/shared/Dropdownbox";
import { useApp } from "@/hooks/useApp";
import { CLIENTS, ENVS } from "@/pages/purchases/purchasesData";
import { Pill } from "@/pages/purchases/PurchaseDrawer";
import { AUDIT, ME, RELEASES, type AuditEvent, type Release } from "./approvalsData";

type Show = "queue" | "audit";
const opts = (all: string, xs: string[]) => [{ value: "all", label: all }, ...xs.map((x) => ({ value: x, label: x }))];
const dateFields: FilterField[] = [
    { key: "from", label: "Date · from", type: "date", options: [] },
    { key: "to", label: "Date · to", type: "date", options: [] },
];
const scope: FilterField[] = [
    { key: "client", label: "Client", options: opts("All clients", CLIENTS) },
    { key: "env", label: "Environment", options: opts("All environments", ENVS) },
];
const relFields: FilterField[] = [...scope, { key: "status", label: "Status", options: opts("All", ["Pending approval", "Approved", "Published", "Rejected"]) }, ...dateFields];
const auditFields: FilterField[] = [...scope, { key: "actor", label: "Actor", options: opts("All actors", [...new Set(AUDIT.map((a) => a.actor))]) }, ...dateFields];

const inScope = (r: { client: string; env: string; date: string }, f: Record<string, string>) =>
    (f.client === "all" || r.client === f.client) && (f.env === "all" || r.env === f.env) &&
    (f.from === "all" || r.date >= f.from) && (f.to === "all" || r.date <= f.to);

const Box = ({ children }: { children: React.ReactNode }) => <div className="rounded-xl border border-line bg-card p-5">{children}</div>;
const Note = ({ children, warn }: { children: React.ReactNode; warn?: boolean }) => (
    <div className={`rounded-lg px-4 py-3 text-xs ${warn ? "border border-note-warn-border bg-note-warn-bg font-semibold text-note-warn-text" : "border border-note-info-border bg-note-info-bg text-note-info-text"}`}>{children}</div>
);

function ReleaseDrawer({ row, onPatch }: { row: Release; onPatch: (id: string, p: Partial<Release>) => void }) {
    const [r, setR] = useState(row);
    const act = (p: Partial<Release>) => { setR((x) => ({ ...x, ...p })); onPatch(row.id, p); };
    const self = r.preparedBy === ME;
    const open = r.status === "Pending approval" || r.status === "Approved";
    return (
        <Drawer title={r.id} kicker={`${r.client} · ${r.env} · candidate v${r.version}`}
            footer={(close) => (
                <>
                    <button className={btn.secondary} onClick={close}>Close</button>
                    {open && <button className={btn.secondary} onClick={() => act({ status: "Rejected" })}>Reject release</button>}
                    {r.status === "Pending approval" && <button className={`${btn.primary} disabled:opacity-50`} disabled={self} onClick={() => act({ status: "Approved", approvedBy: ME })}>Approve release</button>}
                    {r.status === "Approved" && <button className={btn.primary} onClick={() => act({ status: "Published" })}>Publish approved version</button>}
                </>
            )}>
            <div className="flex flex-wrap gap-2"><Pill text={r.status} /></div>
            <Box>
                <dl className="grid gap-4 text-xs sm:grid-cols-2">
                    {[["Client / environment", `${r.client} · ${r.env}`], ["Snapshot fingerprint", r.fingerprint], ["Public products", String(r.products)],
                    ["Prepared by", r.preparedBy], ["Approved by", r.approvedBy || "Awaiting independent approval"], ["Created", r.date],
                    ["Public config includes secrets?", "No"], ["Reason", r.reason]].map(([k, v]) => (
                        <div key={k}><dt className="font-semibold text-muted">{k}</dt><dd className="mt-0.5 text-ink">{v}</dd></div>
                    ))}
                </dl>
            </Box>
            {r.status === "Pending approval" && self && <Note warn>You prepared this release, so a different person must approve it.</Note>}
            <Note>Publishing changes only the approved configuration for this client and environment. It does not deploy binaries, provision cloud resources or send secrets. The fingerprint is a demo check, not a signature.</Note>
        </Drawer>
    );
}

export default function ApprovalsList() {
    const { openDrawer } = useApp();
    const [show, setShow] = useState<Show>("queue");
    const [patches, setPatches] = useState<Record<string, Partial<Release>>>({});
    const onPatch = (id: string, p: Partial<Release>) => setPatches((m) => ({ ...m, [id]: { ...m[id], ...p } }));

    const toolbar = (
        <div className="w-64">
            <Dropdownbox name="show" label="Show" value={show} rounded="rounded-lg" compact
                options={[{ value: "queue", label: "Configuration approval queue" }, { value: "audit", label: "Audit log" }]}
                onChange={(e) => setShow(e.target.value as Show)} />
        </div>
    );
    const common = { createLabel: "", hideView: true, hideEdit: true, hideCreate: true, toolbar, basePath: "/marketplace/approvals" };

    if (show === "audit") {
        const cols: Col<AuditEvent>[] = [
            { key: "client", label: "Client", sticky: 130, render: (r) => r.client || "Global Master" },
            { key: "env", label: "Environment", sticky: 110, render: (r) => r.env || "-" },
            { key: "date", label: "Date", render: (r) => r.date },
            { key: "actor", label: "Actor", render: (r) => r.actor },
            { key: "action", label: "Action", render: (r) => <span className="font-semibold text-ink">{r.action}</span> },
            { key: "entity", label: "Entity", render: (r) => <span className="font-mono">{r.entity}</span> },
            { key: "note", label: "Reason / evidence summary", render: (r) => r.note },
        ];
        const cards = (rs: AuditEvent[]): Stat[] => [
            { label: "Audit events", value: rs.length, note: "Metadata only; never secret values", icon: History },
            { label: "Release events", value: rs.filter((r) => r.entity.startsWith("REL")).length, note: "Requests, approvals, rejections", icon: Rocket },
            { label: "Credential events", value: rs.filter((r) => r.entity.startsWith("CRD")).length, note: "Reference metadata only", icon: ShieldCheck },
            { label: "Payout events", value: rs.filter((r) => r.entity.startsWith("PAY")).length, note: "Batch preparation and approval", icon: CheckCheck },
        ];
        return (
            <ListShell key="a" {...common} rows={AUDIT} cols={cols} rowLabel="events" searchPlaceholder="Search action, actor, entity…"
                filterFields={auditFields} cards={cards} exportName="audit-log"
                match={(r, q, f) => (!q || [r.action, r.actor, r.entity, r.note, r.client].some((v) => v.toLowerCase().includes(q))) && inScope(r, f) && (f.actor === "all" || r.actor === f.actor)} />
        );
    }

    const rows = RELEASES.map((r) => ({ ...r, ...patches[r.id] }));
    const view = (r: Release) => openDrawer(<ReleaseDrawer row={r} onPatch={onPatch} />);
    const cols: Col<Release>[] = [
        { key: "id", label: "Release", sticky: 120, render: (r) => <button type="button" onClick={() => view(r)} className="text-left font-semibold text-link hover:underline">{r.id}</button> },
        { key: "client", label: "Client", sticky: 110, render: (r) => r.client },
        { key: "env", label: "Environment", sticky: 110, render: (r) => r.env },
        { key: "date", label: "Created", render: (r) => r.date },
        { key: "version", label: "Version", align: "right", render: (r) => `v${r.version}` },
        { key: "fingerprint", label: "Snapshot", render: (r) => <span className="font-mono">{r.fingerprint}</span> },
        { key: "preparedBy", label: "Prepared by", render: (r) => r.preparedBy },
        { key: "approvedBy", label: "Approved by", render: (r) => r.approvedBy || "Awaiting approval" },
        { key: "status", label: "Status", render: (r) => <Pill text={r.status} /> },
        { key: "reason", label: "Reason", render: (r) => r.reason },
    ];
    const cards = (rs: Release[]): Stat[] => [
        { label: "Configuration releases", value: rs.length, note: "One client and environment each", icon: Rocket },
        { label: "Pending approval", value: rs.filter((r) => r.status === "Pending approval").length, note: "Maker and checker must differ", icon: Hourglass },
        { label: "Approved, not published", value: rs.filter((r) => r.status === "Approved").length, note: "Clients still use the prior version", icon: CheckCheck },
        { label: "Published", value: rs.filter((r) => r.status === "Published").length, note: "Live approved versions", icon: ShieldCheck },
    ];
    return (
        <ListShell key="q" {...common} rows={rows} cols={cols} rowLabel="releases" searchPlaceholder="Search release, client, reason…"
            filterFields={relFields} cards={cards} exportName="configuration-releases"
            match={(r, q, f) => (!q || [r.id, r.client, r.env, r.reason, r.preparedBy].some((v) => v.toLowerCase().includes(q))) && inScope(r, f) && (f.status === "all" || r.status === f.status)}
            extraActions={[{ label: "Review release", icon: <Eye className="size-4" />, onClick: (id) => { const r = rows.find((x) => x.id === id); if (r) view(r); } }]} />
    );
}