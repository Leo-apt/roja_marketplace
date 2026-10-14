import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/hooks/useApp";
import Dropdownbox from "@/components/shared/Dropdownbox";
import { btn, Field, MoneyInput, TextInput } from "@/components/catalog/FormBits";
import { DCard } from "@/components/catalog/DetailBits";
import { Alert } from "@/components/auth/AuthShell";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import { marginsService, type MarginRec } from "@/services/margins.service";
import { productsService, type ProductRec } from "@/services/products.service";
import { calcMargin, num, usd } from "@/utils/catalog";

const BASE = "/catalog/margins";
const markupTypes = [{ value: "flat", label: "$ Flat" }, { value: "percent", label: "% Percent" }];

function MarginForm({ initial, products }: { initial?: MarginRec; products: ProductRec[] }) {
    const nav = useNavigate();
    const { toast } = useApp();
    const isEdit = !!initial;
    const [productId, setProductId] = useState(initial?.productId ?? "");
    const [wholesale, setWholesale] = useState(initial ? String(initial.wholesale) : "");
    const [retail, setRetail] = useState(initial ? String(initial.retail) : "");
    const [markup, setMarkup] = useState(initial ? String(initial.markupValue) : "");
    const [type, setType] = useState<"flat" | "percent">(initial?.markupType ?? "flat");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);

    const m = calcMargin(num(wholesale), num(retail), num(markup), type);

    const onProduct = (v: string) => {
        setProductId(v);
        const p = products.find((x) => x.id === v);
        if (p?.retail != null && !retail.trim()) setRetail(String(p.retail)); // suggest the product's retail price
    };

    const submit = async () => {
        const e: Record<string, string> = {};
        if (!isEdit && !productId) e.product = "Product is required";
        if (!wholesale.trim() || num(wholesale) < 0.01) e.wholesale = "Wholesale price must be at least 0.01";
        if (!retail.trim()) e.retail = "Retail price is required";
        if (!markup.trim()) e.markup = "Roja markup is required";
        setErrors(e);
        setApiError("");
        if (Object.keys(e).length) return;
        setSaving(true);
        try {
            const input = { productId, wholesale, retail, markupType: type, markup };
            if (initial) await marginsService.update(initial.id, input);
            else await marginsService.create(input);
            toast(isEdit ? "Margin updated" : "Margin created");
            nav(BASE);
        } catch (err) {
            setApiError(err instanceof Error ? err.message : "Save failed");
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <DCard title={isEdit ? "Edit Margin" : "Create Margin"}>
                {apiError && <Alert kind="error">{apiError}</Alert>}
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Product Name" required error={errors.product} className="md:col-span-2"
                        note={isEdit ? "The product cannot be changed after the margin is created." : products.length === 0 ? "Every product already has a margin." : undefined}>
                        {isEdit ? (
                            <TextInput value={initial?.product ?? ""} readOnly />
                        ) : (
                            <Dropdownbox name="product" value={productId} placeholder="Select product" searchable rounded="rounded-md" compact
                                options={products.map((p) => ({ value: p.id, label: p.name }))} onChange={(e) => onProduct(e.target.value)} />
                        )}
                    </Field>
                    <Field label="Wholesale Price" required error={errors.wholesale}><MoneyInput value={wholesale} onChange={setWholesale} /></Field>
                    <Field label="Retail Price" required error={errors.retail}
                        note={isEdit ? "Retail price cannot be changed after creation." : undefined}>
                        <MoneyInput value={retail} onChange={setRetail} readOnly={isEdit} />
                    </Field>
                    <Field label="Roja Markup" required error={errors.markup}>
                        <div className="grid grid-cols-2 gap-2">
                            <Dropdownbox name="mtype" value={type} options={markupTypes} rounded="rounded-md" compact
                                onChange={(e) => setType(e.target.value as "flat" | "percent")} />
                            <MoneyInput prefix={type === "percent" ? "%" : "$"} value={markup} onChange={setMarkup} />
                        </div>
                    </Field>
                    <div />
                    <Field label="Roja Buy Rate"><MoneyInput value={m.buy.toFixed(2)} readOnly /></Field>
                    <Field label="Margin vs. Retail" note={m.margin < 0 ? `Negative margin: ${usd(m.margin)}` : undefined}>
                        <MoneyInput value={m.margin.toFixed(2)} readOnly />
                    </Field>
                </div>
            </DCard>
            <div className="flex justify-end gap-2">
                <button className={btn.cancel} onClick={() => nav(BASE)} disabled={saving}>Cancel</button>
                <button className={btn.primary} onClick={submit} disabled={saving}>{saving ? "Saving…" : "Submit"}</button>
            </div>
        </div>
    );
}

export default function MarginsManage() {
    const { id } = useParams();
    const isAdmin = useIsAdmin();
    const [data, setData] = useState<{ rec?: MarginRec; products: ProductRec[] } | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isAdmin) return;
        let live = true;
        const load = id
            ? marginsService.get(id).then((rec) => ({ rec, products: [] as ProductRec[] }))
            : Promise.all([productsService.list(), marginsService.usedProductIds()])
                .then(([ps, used]) => ({ rec: undefined, products: ps.filter((p) => !used.includes(p.id)) }));
        load
            .then((d) => { if (live) setData(d); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id, isAdmin]);

    if (!isAdmin) return <AdminNotice />;
    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!data || (id && data.rec?.id !== id)) return <LoadingBox />;
    return <MarginForm key={id ?? "new"} initial={data.rec} products={data.products} />;
}