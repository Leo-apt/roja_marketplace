import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Pencil } from "lucide-react";
import type { Bundle } from "@/data/catalog";
import { usd } from "@/utils/catalog";
import { StatusBadge } from "./DetailBits";
import { btn } from "./FormBits";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="rounded-xl border border-line bg-white">
        <h3 className="border-b border-line px-6 py-4 text-xs font-bold uppercase tracking-wide text-ink">{title}</h3>
        <div className="p-6">{children}</div>
    </section>
);

const Tile = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="min-w-0 rounded-lg border border-line bg-surfacealt px-4 py-3">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
        <dd className="mt-1 break-words text-sm font-semibold text-ink">{children}</dd>
    </div>
);

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="grid gap-1 border-b border-line py-3 first:pt-0 last:border-b-0 last:pb-0 md:grid-cols-[190px_1fr] md:gap-4">
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
        <dd className="min-w-0 break-words text-sm text-cell-text">{children}</dd>
    </div>
);

export default function BundleSections({ b, variant = "bundle", editTo }: {
    b: Bundle; variant?: "bundle" | "product"; editTo?: string;
}) {
    const nav = useNavigate();
    const p = variant === "product";
    return (
        <>
            <section className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="flex flex-wrap items-center justify-between gap-4 bg-brandsoft px-6 py-5">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-lg font-bold text-ink">{b.name}</h2>
                            <StatusBadge status={b.status} />
                        </div>
                        <p className="mt-1 text-xs text-muted">Bundle {p ? "product feature" : "feature"}</p>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="text-right">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Price</div>
                            <div className="text-xl font-bold text-brand">{b.price == null ? "-" : usd(b.price)}</div>
                        </div>
                        {editTo && (
                            <button className={btn.brand} onClick={() => nav(editTo)}>
                                <Pencil className="size-4" /> Edit
                            </button>
                        )}
                    </div>
                </div>
                <dl className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Tile label="Pricing Type">{b.pricingType}</Tile>
                    <Tile label={p ? "Product Short Code" : "Feature Short Code"}>{b.shortCode}</Tile>
                    <Tile label="Banner Image">N/A</Tile>
                </dl>
            </section>

            <Section title="Content">
                <dl>
                    <Row label="Short Description">{b.shortDescription || "-"}</Row>
                    <Row label="Long Description">
                        <div className="[&_p]:mb-2 [&_strong]:font-semibold [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
                            dangerouslySetInnerHTML={{ __html: b.longDescription || "-" }} />
                    </Row>
                    <Row label="Credential Note">{b.disclosure || "-"}</Row>
                    <Row label="Benefits List">
                        {b.benefits.length ? (
                            <ul className="grid gap-2 sm:grid-cols-2">
                                {b.benefits.map((x) => (
                                    <li key={x} className="flex items-start gap-2">
                                        <Check className="mt-0.5 size-4 shrink-0 text-good" /> {x}
                                    </li>
                                ))}
                            </ul>
                        ) : "N/A"}
                    </Row>
                    <Row label="Thumb Image">N/A</Row>
                </dl>
            </Section>

            <Section title="Post-Purchase / Hidden Fields">
                <p className="mb-4 rounded-md border border-warn-border bg-warnbg px-3 py-2 text-xs text-warn">
                    These fields are never rendered pre-purchase — visible to the customer only after purchase is complete.
                </p>
                <dl>
                    <Row label="Access Instructions">{b.insuranceInstructions || "-"}</Row>
                    <Row label="Phone Number">{b.phone || "-"}</Row>
                    <Row label="Member Portal URL">{b.portalUrl || "-"}</Row>
                    <Row label="Group Code">{b.promoCode || "-"}</Row>
                    <Row label="Activation Details">{b.promoNote || "-"}</Row>
                </dl>
            </Section>
        </>
    );
}