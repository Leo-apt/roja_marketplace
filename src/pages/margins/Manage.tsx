import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/hooks/useApp";
import Dropdownbox from "@/components/shared/Dropdownbox";
import { btn, Field, MoneyInput, TextInput } from "@/components/catalog/FormBits";
import { DCard, NotFound } from "@/components/catalog/DetailBits";
import { margins } from "@/data/catalog";
import { calcMargin, num, usd } from "@/utils/catalog";

const BASE = "/catalog/margins";
const markupTypes = [{ value: "flat", label: "$ Flat" }, { value: "percent", label: "% Percent" }];

export default function MarginsManage() {
    const { id } = useParams();
    const nav = useNavigate();
    const { toast } = useApp();
    const rec = margins.find((m) => m.id === id);
    const isEdit = !!id;
    const [product, setProduct] = useState(rec?.product ?? "");
    const [wholesale, setWholesale] = useState(rec ? String(rec.wholesale) : "");
    const [retail, setRetail] = useState(rec ? String(rec.retail) : "");
    const [markup, setMarkup] = useState(rec ? String(rec.markup) : "");
    const [type, setType] = useState<"flat" | "percent">(rec?.markupType ?? "flat");
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (isEdit && !rec) return <NotFound backTo={BASE} />;

    const m = calcMargin(num(wholesale), num(retail), num(markup), type);

    const submit = () => {
        const e: Record<string, string> = {};
        if (!product.trim()) e.product = "Product name is required";
        setErrors(e);
        if (Object.keys(e).length) return;
        toast(isEdit ? "Margin updated (sample only)" : "Margin created (sample only)");
        nav(BASE);
    };

    return (
        <div className="flex flex-col gap-4">
            <DCard title={isEdit ? "Edit Margin" : "Create Margin"}>
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Product Name" required error={errors.product} className="md:col-span-2">
                        <TextInput value={product} placeholder="e.g. Financial +" onChange={(e) => setProduct(e.target.value)} />
                    </Field>
                    <Field label="Wholesale Price"><MoneyInput value={wholesale} onChange={setWholesale} /></Field>
                    <Field label="Retail Price"><MoneyInput value={retail} onChange={setRetail} /></Field>
                    <Field label="Roja Markup">
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
                <button className={btn.cancel} onClick={() => nav(BASE)}>Cancel</button>
                <button className={btn.primary} onClick={submit}>Submit</button>
            </div>
        </div>
    );
}