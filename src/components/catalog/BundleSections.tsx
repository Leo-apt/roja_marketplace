import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Pencil } from "lucide-react";
import type { Bundle } from "@/data/catalog";
import { discountShort, sellingPrice, usd } from "@/utils/catalog";
import { StatusBadge } from "./DetailBits";
import { btn } from "./FormBits";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="rounded-xl border border-line bg-white shadow-sm">
        <h3 className="border-b border-line px-6 py-4 text-base font-bold text-muted">{title}</h3>
        <div className="p-6">{children}</div>
    </section>
);

const Tile = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted after:content-['_:']">{label}</dt>
        <dd className="mt-1.5 break-words text-sm font-medium text-ink">{children}</dd>
    </div>
);

const Row = ({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) => (
    <div className={`min-w-0 ${wide ? "col-span-full" : ""}`}>
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted after:content-['_:']">{label}</dt>
        <dd className="mt-1.5 break-words text-sm font-medium text-ink">{children}</dd>
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
            </section>

            <Section title="Overview">
                <dl className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Tile label="Pricing Type">{b.pricingType}</Tile>
                    <Tile label="Discount">
                        {b.discountOn && b.discountValue ? discountShort(b.discountType, b.discountValue) : "No discount"}
                    </Tile>
                    <Tile label="Selling Price">
                        {b.price == null ? "-" : usd(sellingPrice(b.price, b.discountOn ? b.discountType : "", b.discountValue ?? 0))}
                    </Tile>
                    <Tile label={p ? "Product Short Code" : "Feature Short Code"}>{b.shortCode}</Tile>
                    <Tile label="Banner Image">
                        {b.bgImage ? (
                            <img
                                src={b.bgImage.startsWith("http") ? b.bgImage : `data:image/jpeg;base64,${b.bgImage}`}
                                alt="Banner" className="h-20 w-full rounded-md object-cover" />
                        ) : "N/A"}
                    </Tile>
                </dl>
            </Section>

            <Section title="Content">
                <dl className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Row label="Short Description" wide>{b.shortDescription || "-"}</Row>
                    <Row label="Long Description">
                        <div className="[&_p]:mb-2 [&_strong]:font-semibold [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
                            dangerouslySetInnerHTML={{ __html: b.longDescription || "-" }} />
                    </Row>
                    <Row label="Credential Note" wide>{b.disclosure || "-"}</Row>
                    <Row label="Disclaimer" wide>{b.disclaimer || "-"}</Row>
                    <Row label="Additional Information" wide>{b.additionalInfo || "-"}</Row>
                    <Row label="Benefits List" wide>
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
                <dl className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Row label="Access Instructions" wide>{b.insuranceInstructions || "-"}</Row>
                    <Row label="Phone Number">{b.phone || "-"}</Row>
                    <Row label="Member Portal URL">{b.portalUrl || "-"}</Row>
                    <Row label="Group Code">{b.promoCode || "-"}</Row>
                    <Row label="Activation Details" wide>{b.promoNote || "-"}</Row>
                </dl>
            </Section>
        </>
    );
}