import { apiCall } from "./auth.service";
import { fmt, who } from "./categories.service";
import type { Bundle, Status } from "@/data/catalog";
import { num, type DiscountType } from "@/utils/catalog";


const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string).split(",")[1]);
        r.onerror = () => reject(new Error("Could not read the image"));
        r.readAsDataURL(file);
    });

interface ApiTemplate {
    title: string; shortDescription: string; backgroundImage?: string; iconFamily: string; appIcon: string;
    bgImageBase64?: string;
    webIcon?: string; cardBackgroundColor?: string; iconBackground?: string;
}
interface ApiBundle {
    _id: string; name: string; shortCode: string; iconFamily: string; appIcon: string; webIcon?: string; backgroundColor?: string;
    pricingType: "addOn" | "bundle"; status: boolean | "true" | "false" | "active" | "inactive";
    price?: number | null; hasDiscount?: boolean; discountType?: "percentage" | "fixed"; discountValue?: number | null;
    longDescription: string; benefits?: string[]; supportPhone?: string; websiteUrl?: string; promoCode?: string;
    promoCodeUsageNote?: string; disclosure?: string; disclaimer?: string; additionalInformation?: string; insuranceInstructions?: string;
    template?: ApiTemplate; createdBy: unknown; updatedBy: unknown; createdAt: string; updatedAt: string;
}

export interface BundleInput {
    bgImageBase64: any;
    name: string; shortCode: string; iconFamily: string; appIcon: string; webIcon: string; bgColor: string;
    pricingType: "addon" | "bundle"; status: Status; price: string;
    discountOn: boolean; discountType: DiscountType; discountValue: string;
    longDescription: string; benefits: string[]; phone: string; portalUrl: string; promoCode: string; promoNote: string;
    disclosure: string; disclaimer: string; additionalInfo: string; insuranceInstructions: string;
    title: string; shortDescription: string; tIconFamily: string; tAppIcon: string; tWebIcon: string; cardBg: string; iconBg: string;
}

const toUi = (a: ApiBundle): Bundle => ({
    id: a._id, name: a.name, shortCode: a.shortCode, iconFamily: a.iconFamily, appIcon: a.appIcon,
    webIcon: a.webIcon ?? "", bgColor: a.backgroundColor ?? "",
    pricingType: a.pricingType === "addOn" ? "Add On" : "Bundle",
    status: a.status === false || a.status === "false" || a.status === "inactive" ? "Inactive" : "Active",
    price: a.price ?? null,
    discountOn: !!a.hasDiscount,
    discountWhen: "", // no backend field yet
    discountType: a.discountType === "percentage" ? "percent" : "fixed",
    discountValue: a.discountValue ?? null,
    longDescription: a.longDescription, benefits: a.benefits ?? [],
    phone: a.supportPhone ?? "", portalUrl: a.websiteUrl ?? "", promoCode: a.promoCode ?? "", promoNote: a.promoCodeUsageNote ?? "",
    disclosure: a.disclosure ?? "", disclaimer: a.disclaimer ?? "", additionalInfo: a.additionalInformation ?? "",
    insuranceInstructions: a.insuranceInstructions ?? "",
    title: a.template?.title ?? "", shortDescription: a.template?.shortDescription ?? "",
    tIconFamily: a.template?.iconFamily ?? "", tAppIcon: a.template?.appIcon ?? "", tWebIcon: a.template?.webIcon ?? "",
    cardBg: a.template?.cardBackgroundColor ?? "", iconBg: a.template?.iconBackground ?? "",
    createdBy: who(a.createdBy), updatedBy: who(a.updatedBy), createdOn: fmt(a.createdAt), updatedOn: fmt(a.updatedAt),
});

// Blank optional fields are omitted on create (IsUrl/IsHex reject ""), and sent as null on edit so they clear.
function toPayload(i: BundleInput, isEdit: boolean) {
    const opt = (s: string) => { const t = s.trim(); return t ? t : isEdit ? null : undefined; };
    const addOn = i.pricingType === "addon";
    const hasDiscount = addOn && i.discountOn;
    const phone = i.phone.replace(/\D/g, "").length > 4 ? i.phone : ""; // "+1" alone means empty
    return JSON.stringify({
        name: i.name.trim(),
        shortCode: i.shortCode.trim(),
        iconFamily: i.iconFamily.trim(),
        appIcon: i.appIcon.trim(),
        webIcon: opt(i.webIcon),
        backgroundColor: opt(i.bgColor),
        pricingType: addOn ? "addOn" : "bundle",
        status: i.status === "Active",
        price: addOn ? num(i.price) : isEdit ? null : undefined,
        hasDiscount,
        discountType: hasDiscount ? (i.discountType === "percent" ? "percentage" : "fixed") : undefined,
        discountValue: hasDiscount ? num(i.discountValue) : undefined,
        longDescription: i.longDescription,
        benefits: i.benefits.map((b) => b.trim()).filter(Boolean),
        supportPhone: opt(phone),
        websiteUrl: opt(i.portalUrl),
        promoCode: opt(i.promoCode),
        promoCodeUsageNote: opt(i.promoNote),
        disclosure: opt(i.disclosure),
        disclaimer: opt(i.disclaimer),
        additionalInformation: opt(i.additionalInfo),
        insuranceInstructions: opt(i.insuranceInstructions),
        template: {
            title: i.title.trim(),
            shortDescription: i.shortDescription.trim(),
            backgroundImage: i.bgImageBase64,
            iconFamily: i.tIconFamily.trim(),
            appIcon: i.tAppIcon.trim(),
            webIcon: opt(i.tWebIcon),
            cardBackgroundColor: opt(i.cardBg),
            iconBackground: opt(i.iconBg),
        },
    });
}

export const bundlesService = {
    list: () => apiCall<ApiBundle[]>("/bundles/admin/all").then((r) => r.data.map(toUi)),
    get: (id: string) => apiCall<ApiBundle>(`/bundles/${id}/get-bundle`).then((r) => toUi(r.data)),
    create: (i: BundleInput) =>
        apiCall<ApiBundle>("/bundles/create-bundles", { method: "POST", body: toPayload(i, false) }).then((r) => toUi(r.data)),
    update: (id: string, i: BundleInput) =>
        apiCall<ApiBundle>(`/bundles/${id}/update-bundles`, { method: "PATCH", body: toPayload(i, true) }).then((r) => toUi(r.data)),
    remove: (id: string) =>
        apiCall<{ deleted: boolean }>(`/bundles/${id}/delete-bundles`, { method: "DELETE" }).then((r) => r.data),
};