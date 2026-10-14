import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DCard, DetailShell, Grid, KV, StatusBadge } from "@/components/catalog/DetailBits";
import BundleSections from "@/components/catalog/BundleSections";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import type { Bundle } from "@/data/catalog";
import { bundlesService } from "@/services/bundles.service";
import { PLACEMENT_OPTIONS, productsService, type ProductRec } from "@/services/products.service";
import { discountDetail, usd } from "@/utils/catalog";

const BASE = "/catalog/products";

export default function CatalogProductsDetail() {
    const { id } = useParams();
    const [data, setData] = useState<{ rec: ProductRec; linked: Bundle[] } | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        let live = true;
        productsService.get(id)
            .then(async (rec) => {
                const found = await Promise.all(rec.bundles.map((b) => bundlesService.get(b.id).catch(() => null)));
                if (live) setData({ rec, linked: found.filter((b): b is Bundle => !!b) });
            })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id]);

    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!data || data.rec.id !== id) return <LoadingBox />;
    const { rec: p, linked } = data;

    return (
        <DetailShell backTo={BASE} editTo={`${BASE}/${p.id}/edit`}>
            <DCard title="Margin Details">
                <Grid>
                    {/* No API fields yet: shown as "-" until the margins data is available */}
                    <KV k="Wholesale Price:">-</KV>
                    <KV k="Retail Price:">{usd(p.retail)}</KV>
                    <KV k="Roja Markup:">-</KV>
                    <KV k="Roja Buy Rate:">-</KV>
                    <KV k="Margin Vs. Retail:">-</KV>
                </Grid>
            </DCard>

            <DCard title="Overview">
                <Grid>
                    <KV k="Product Category :">{p.categoryName}</KV>
                    <KV k="Product Name :">{p.name}</KV>
                    <KV k="Retail Price :">{usd(p.retail)}</KV>
                    <KV k="Discount">{p.discountType && p.discountValue ? discountDetail(p.discountType, p.discountValue) : "No discount"}</KV>
                    <KV k="Selling Price :">{usd(p.sellingPrice)}</KV>
                    <KV k="Document :">
                        {p.termsUrl
                            ? <a className="font-semibold text-brand hover:underline" href={p.termsUrl} target="_blank" rel="noreferrer">Click to view</a>
                            : "-"}
                    </KV>
                    <KV k="Short Description :">{p.shortDescription || "-"}</KV>
                    <KV k="Created On :">{p.createdOn}</KV>
                    <KV k="Image :">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="max-h-24 rounded" /> : "N/A"}</KV>
                    <KV k="Long Description :"><div className="[&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: p.longDescription || "-" }} /></KV>
                    <KV k="Min Limit">-</KV>
                    <KV k="Max Limit">-</KV>
                    <KV k="Service Fee %">-</KV>
                    <KV k="Repayment Days">-</KV>
                    <KV k="Provider">{p.providerId || "-"}</KV>
                    <KV k="Bundles">{p.bundles.map((b) => b.name || b.shortCode).join(", ") || "-"}</KV>
                </Grid>
            </DCard>

            <DCard title="Status & Placement">
                <Grid>
                    <KV k="Status"><StatusBadge status={p.status} /></KV>
                    <KV k="Audience">{p.audience === "everyone" ? "Everyone" : "Provider rules"}</KV>
                    <KV k="Placements">{p.placements.map((v) => PLACEMENT_OPTIONS.find((o) => o.value === v)?.label ?? v).join(", ") || "-"}</KV>
                    <KV k="Frequency Cap">{p.freqCap ?? "-"}</KV>
                    <KV k="Publishing">{p.publish === "now" ? "Publish immediately" : `Scheduled from ${p.availableFrom || "-"}`}</KV>
                    <KV k="Expires On">{p.expiresOn || "Never"}</KV>
                    <KV k="Created By">{p.createdBy}</KV>
                    <KV k="Last Updated On">{p.updatedOn}</KV>
                </Grid>
            </DCard>

            {linked.map((b) => <BundleSections key={b.id} b={b} variant="product" />)}
        </DetailShell>
    );
}