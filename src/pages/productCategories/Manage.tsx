import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/hooks/useApp";
import Dropdownbox from "@/components/shared/Dropdownbox";
import { btn, ColorField, Field, HexNote, TextArea, TextInput } from "@/components/catalog/FormBits";
import { DCard } from "@/components/catalog/DetailBits";
import { Alert } from "@/components/auth/AuthShell";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import type { Status } from "@/data/catalog";
import { categoriesService, type CategoryRec } from "@/services/categories.service";
import { isHex, statusFormOptions } from "@/utils/catalog";

const BASE = "/catalog/product-categories";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function CategoryForm({ initial }: { initial?: CategoryRec }) {
    const nav = useNavigate();
    const { toast } = useApp();
    const isEdit = !!initial;
    const [name, setName] = useState(initial?.name ?? "");
    const [slug, setSlug] = useState(initial?.slug ?? "");
    const [slugTouched, setSlugTouched] = useState(isEdit);
    const [description, setDescription] = useState(initial?.description ?? "");
    const [bg, setBg] = useState(initial?.bgColor ?? "");
    const [status, setStatus] = useState<Status>(initial?.status ?? "Active");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);

    const onName = (v: string) => {
        setName(v);
        if (!slugTouched) setSlug(slugify(v));
    };

    const submit = async () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = "Name is required";
        if (!slug.trim()) e.slug = "Slug is required";
        else if (!SLUG_RE.test(slug.trim())) e.slug = "Use lowercase letters, numbers and hyphens only";
        if (bg && !isHex(bg)) e.bg = "Enter a valid HEX code, e.g. #000000";
        setErrors(e);
        setApiError("");
        if (Object.keys(e).length) return;
        setSaving(true);
        try {
            const input = { name, slug, description, bgColor: bg, status };
            if (initial) await categoriesService.update(initial.id, input);
            else await categoriesService.create(input);
            toast(isEdit ? "Category updated" : "Category created");
            nav(BASE);
        } catch (err) {
            setApiError(err instanceof Error ? err.message : "Save failed");
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <DCard title={isEdit ? "Edit Category" : "Create Category"}>
                {apiError && <Alert kind="error">{apiError}</Alert>}
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Name" required error={errors.name}>
                        <TextInput value={name} placeholder="e.g. Auto" onChange={(e) => onName(e.target.value)} />
                    </Field>
                    <Field label="Slug" required error={errors.slug} note="Lowercase letters, numbers and hyphens. Auto-filled from the name.">
                        <TextInput value={slug} placeholder="e.g. auto"
                            onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase()); }} />
                    </Field>
                    <Field label="Background Color" note={HexNote} error={errors.bg}>
                        <ColorField value={bg} onChange={setBg} />
                    </Field>
                    <Field label="Status" required>
                        <Dropdownbox name="status" value={status} options={statusFormOptions} rounded="rounded-md" compact
                            onChange={(e) => setStatus(e.target.value as Status)} />
                    </Field>
                    <Field label="Description" className="md:col-span-2">
                        <TextArea rows={3} value={description} placeholder="Optional" onChange={(e) => setDescription(e.target.value)} />
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

export default function ProductCategoriesManage() {
    const { id } = useParams();
    const isAdmin = useIsAdmin();
    const [rec, setRec] = useState<CategoryRec | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id || !isAdmin) return;
        let live = true;
        categoriesService.get(id)
            .then((r) => { if (live) setRec(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id, isAdmin]);

    if (!isAdmin) return <AdminNotice />;
    if (!id) return <CategoryForm />;
    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!rec || rec.id !== id) return <LoadingBox />;
    return <CategoryForm initial={rec} />;
}