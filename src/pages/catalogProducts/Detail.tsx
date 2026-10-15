import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DCard, DetailShell, Grid, KV, StatusBadge } from "@/components/catalog/DetailBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { productsService, type ProductRec } from "@/services/products.service";
import { usd } from "@/utils/catalog";

const BASE = "/catalog/products";
const dash = (v?: string | null) => (v ? v : "-");

export default function CatalogProductsDetail() {
    const { id } = useParams();
    const [r, setR] = useState<ProductRec | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        let live = true;
        productsService.get(id)
            .then((x) => { if (live) setR(x); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id]);

    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!r || r.id !== id) return <LoadingBox />;

    const discount = r.discountValue == null || !r.discountType
        ? "-"
        : r.discountType === "percent" ? `${r.discountValue}%` : usd(r.discountValue);

    return (
        <DetailShell backTo={BASE} editTo={`${BASE}/${r.id}/edit`}>
            <DCard title="Product Details">
                <Grid>
                    <KV k="Product Name">{r.name}</KV>
                    <KV k="Category">{r.categoryName}</KV>
                    <KV k="Provider ID">{dash(r.providerId)}</KV>
                    <KV k="Status"><StatusBadge status={r.status} /></KV>
                    <KV k="Retail Price">{r.retail == null ? "-" : usd(r.retail)}</KV>
                    <KV k="Discount">{discount}</KV>
                    <KV k="Selling Price">{r.sellingPrice == null ? "-" : usd(r.sellingPrice)}</KV>
                    <KV k="Bundles">{r.bundles.length ? r.bundles.map((b) => <div key={b.id}>{b.name || b.shortCode}</div>) : "-"}</KV>
                    <KV k="Audience">{r.audience === "provider" ? "Provider rules" : "Everyone"}</KV>
                    <KV k="Placements">{r.placements.length ? r.placements.join(", ") : "-"}</KV>
                    <KV k="Frequency Cap">{r.freqCap ?? "-"}</KV>
                    <KV k="Publish">{r.publish === "later" ? "Scheduled" : "Immediately"}</KV>
                    <KV k="Available From">{dash(r.availableFrom)}</KV>
                    <KV k="Expires On">{dash(r.expiresOn)}</KV>
                </Grid>
            </DCard>
            <DCard title="Marketplace">
                <Grid one>
                    <KV k="Short Description">{dash(r.shortDescription)}</KV>
                    <KV k="Long Description">{dash(r.longDescription)}</KV>
                    <KV k="Pricing Content">{dash(r.pricingContent)}</KV>
                    <KV k="Terms URL">{dash(r.termsUrl)}</KV>
                </Grid>
            </DCard>
            <DCard title="Dashboard">
                <Grid one>
                    <KV k="Template">{dash(r.template)}</KV>
                    <KV k="Title">{dash(r.dashTitle)}</KV>
                    <KV k="Call To Action">{dash(r.cta)}</KV>
                    <KV k="Feature Title">{dash(r.featureTitle)}</KV>
                    <KV k="Short Description">{dash(r.dashShort)}</KV>
                </Grid>
            </DCard>
            <DCard title="Audit">
                <Grid>
                    <KV k="Created By">{r.createdBy}</KV>
                    <KV k="Created On">{r.createdOn}</KV>
                    <KV k="Last Updated By">{r.updatedBy}</KV>
                    <KV k="Last Updated On">{r.updatedOn}</KV>
                </Grid>
            </DCard>
        </DetailShell>
    );
}