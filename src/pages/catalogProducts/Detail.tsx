import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DetailHeader, DetailShell, DRow, DRows, DSection, DTile, DTiles } from "@/components/catalog/DetailBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { PLACEMENT_OPTIONS, productsService, type ProductRec } from "@/services/products.service";
import { usd } from "@/utils/catalog";

const BASE = "/catalog/products";
const dash = (v?: string | null) => (v ? v : "-");
const money = (v: number | null) => (v == null ? "-" : usd(v));

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
        <DetailShell backTo={BASE}>
            <DetailHeader
                title={r.name}
                subtitle={r.categoryName}
                status={r.status}
                highlight={{ label: "Selling Price", value: r.sellingPrice == null ? "-" : usd(r.sellingPrice) }}
                editTo={`${BASE}/${r.id}/edit`}
            >
                <DTiles>
                    <DTile label="Category">{r.categoryName}</DTile>
                    <DTile label="Provider ID">{dash(r.providerId)}</DTile>
                    <DTile label="Retail Price">{r.retail == null ? "-" : usd(r.retail)}</DTile>
                    <DTile label="Discount">{discount}</DTile>
                    <DTile label="Bundles">{r.bundles.length ? r.bundles.map((b) => <div key={b.id}>{b.name || b.shortCode}</div>) : "-"}</DTile>
                    <DTile label="Audience">{r.audience === "provider" ? "Provider rules" : "Everyone"}</DTile>
                    <DTile label="Configuration">{dash(r.configurationName)}</DTile>
                </DTiles>
            </DetailHeader>

            <DSection title="Pricing & Margin">
                <DTiles>
                    <DTile label="Wholesale Price">{money(r.wholesale)}</DTile>
                    <DTile label="Roja Markup">
                        {r.markupValue == null ? "-" : r.markupType === "percent" ? `${r.markupValue}%` : usd(r.markupValue)}
                    </DTile>
                    <DTile label="Markup Amount">{money(r.markupAmount)}</DTile>
                    <DTile label="Markup %">{r.markupPercent == null ? "-" : `${r.markupPercent}%`}</DTile>
                    <DTile label="Roja Buy Rate">{money(r.buyRate)}</DTile>
                    <DTile label="Margin vs. Retail">{money(r.marginVsRetail)}</DTile>
                </DTiles>
            </DSection>

            <DSection title="Visibility & Schedule">
                <DTiles>
                    <DTile label="Placements">{r.placements.length ? r.placements.map((p) => PLACEMENT_OPTIONS.find((o) => o.value === p)?.label ?? p).join(", ") : "-"}</DTile>
                    <DTile label="Frequency Cap">{r.freqCap ?? "-"}</DTile>
                    <DTile label="Publish">{r.publish === "later" ? "Scheduled" : "Immediately"}</DTile>
                    <DTile label="Available From">{dash(r.availableFrom)}</DTile>
                    <DTile label="Expires On">{dash(r.expiresOn)}</DTile>
                </DTiles>
            </DSection>

            <DSection title="Marketplace">
                <DRows>
                    <DRow label="Short Description">{dash(r.shortDescription)}</DRow>
                    <DRow label="Long Description">
                        {r.longDescription
                            ? <div className="[&_p]:mb-2 [&_strong]:font-semibold [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: r.longDescription }} />
                            : "-"}
                    </DRow>
                    <DRow label="Pricing Content">{dash(r.pricingContent)}</DRow>
                    <DRow label="Terms URL">{dash(r.termsUrl)}</DRow>
                </DRows>
            </DSection>

            <DSection title="Dashboard">
                <DRows>
                    <DRow label="Template">{dash(r.template)}</DRow>
                    <DRow label="Title">{dash(r.dashTitle)}</DRow>
                    <DRow label="Call To Action">{dash(r.cta)}</DRow>
                    <DRow label="Feature Title">{dash(r.featureTitle)}</DRow>
                    <DRow label="Short Description">{dash(r.dashShort)}</DRow>
                </DRows>
            </DSection>

            <DSection title="Audit">
                <DTiles four>
                    <DTile label="Created By">{r.createdBy}</DTile>
                    <DTile label="Created On">{r.createdOn}</DTile>
                    <DTile label="Last Updated By">{r.updatedBy}</DTile>
                    <DTile label="Last Updated On">{r.updatedOn}</DTile>
                </DTiles>
            </DSection>
        </DetailShell>
    );
}