import type { Bundle } from "@/data/catalog";
import { usd } from "@/utils/catalog";
import { DCard, Grid, KV, StatusBadge } from "./DetailBits";

export default function BundleSections({ b, variant = "bundle" }: { b: Bundle; variant?: "bundle" | "product" }) {
    const p = variant === "product";
    return (
        <>
            <DCard title="Feature Info">
                <Grid>
                    {p && <KV k="Product Feature Type">Bundle</KV>}
                    {p && <span className="hidden md:block" />}
                    {p && <span className="hidden md:block" />}
                    <KV k={p ? "Product Feature Name" : "Feature Name"}>{b.name}</KV>
                    <KV k="Pricing Type">{b.pricingType}</KV>
                    <KV k={p ? "Product short Code" : "Feature short Code"}>{b.shortCode}</KV>
                    <KV k="Price">{b.price == null ? "-" : usd(b.price)}</KV>
                    <KV k="Banner Image">N/A</KV>
                    <span className="hidden md:block" /><span className="hidden md:block" />
                    <KV k="Status"><StatusBadge status={b.status} /></KV>
                </Grid>
            </DCard>

            <DCard title="Content">
                <Grid one>
                    <KV k="Short Description">{b.shortDescription}</KV>
                    <KV k="Long Description">
                        <div className="[&_p]:mb-2 [&_strong]:font-semibold [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
                            dangerouslySetInnerHTML={{ __html: b.longDescription || "-" }} />
                    </KV>
                    <KV k="Credential Note">{b.disclosure || "-"}</KV>
                    <KV k="Benefits List">
                        {b.benefits.length ? <ul className="list-disc pl-5">{b.benefits.map((x) => <li key={x}>{x}</li>)}</ul> : "N/A"}
                    </KV>
                    <KV k="Thumb Image">N/A</KV>
                </Grid>
            </DCard>

            <DCard title="Post-Purchase / Hidden Fields">
                <p className="mb-4 rounded-md border border-warn-border bg-warnbg px-3 py-2 text-xs text-warn">
                    These fields are never rendered pre-purchase — visible to the customer only after purchase is complete.
                </p>
                <Grid one>
                    <KV k="Access Instructions">{b.insuranceInstructions || "-"}</KV>
                    <KV k="Phone Number">{b.phone || "-"}</KV>
                    <KV k="Member Portal URL">{b.portalUrl || "-"}</KV>
                    <KV k="Group Code">{b.promoCode || "-"}</KV>
                    <KV k="Activation Details">{b.promoNote || "-"}</KV>
                </Grid>
            </DCard>
        </>
    );
}