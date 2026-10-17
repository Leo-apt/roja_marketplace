import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/hooks/useApp";
import { btn, Field, FileInput, PhoneField, TextInput } from "@/components/catalog/FormBits";
import { DCard } from "@/components/catalog/DetailBits";
import { Alert } from "@/components/auth/AuthShell";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import { imageError } from "@/utils/validate";
import { providersService, type ProviderRec } from "@/services/providers.service";

const BASE = "/catalog/providers";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ProviderForm({ initial }: { initial?: ProviderRec }) {
    const nav = useNavigate();
    const { toast } = useApp();
    const isEdit = !!initial;
    const [name, setName] = useState(initial?.name ?? "");
    const [phone, setPhone] = useState(initial?.phone ?? "");
    const [email, setEmail] = useState(initial?.email ?? "");
    const [logo, setLogo] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = "Company name is required";
        if (phone.replace(/\D/g, "").length < 8) e.phone = "Enter a valid cell phone number";
        if (!email.trim()) e.email = "Email address is required";
        else if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address";
        if (!logo && !initial?.logoUrl) e.logo = "Logo is required";
        else if (logo && imageError(logo)) e.logo = imageError(logo);
        setErrors(e);
        setApiError("");
        if (Object.keys(e).length) return;
        setSaving(true);
        try {
            const input = { name, email, phone, logoFile: logo };
            if (initial) await providersService.update(initial.id, input);
            else await providersService.create(input);
            toast(isEdit ? "Provider updated" : "Provider created");
            nav(BASE);
        } catch (err) {
            setApiError(err instanceof Error ? err.message : "Save failed");
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <DCard title={isEdit ? "EDIT PROVIDER" : "ADD PROVIDER"}>
                {apiError && <Alert kind="error">{apiError}</Alert>}
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Company Name" required error={errors.name}>
                        <TextInput value={name} placeholder="Company Name" onChange={(e) => setName(e.target.value)} />
                    </Field>
                    <Field label="Cell Phone No" required error={errors.phone}>
                        <PhoneField value={phone} onChange={setPhone} />
                    </Field>
                    <Field label="Email Address" required error={errors.email}>
                        <TextInput type="email" value={email} placeholder="Enter your email" onChange={(e) => setEmail(e.target.value)} />
                    </Field>
                    <Field label="Logo" required error={errors.logo} note="Upload a JPEG or PNG Logo that is less than 2mb">
                        <FileInput accept="image/png,image/jpeg" file={logo} onChange={setLogo} />
                        {!logo && initial?.logoUrl && <img src={initial.logoUrl} alt="Current logo" className="mt-3 h-16 rounded-md border border-line object-contain" />}
                    </Field>
                </div>
            </DCard>
            <div className="flex gap-2">
                <button className={btn.primary} onClick={submit} disabled={saving}>{saving ? "Saving…" : "Submit"}</button>
                <button className={btn.cancel} onClick={() => nav(BASE)} disabled={saving}>Cancel</button>
            </div>
        </div>
    );
}

export default function ProvidersManage() {
    const { id } = useParams();
    const isAdmin = useIsAdmin();
    const [rec, setRec] = useState<ProviderRec | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id || !isAdmin) return;
        let live = true;
        providersService.get(id)
            .then((r) => { if (live) setRec(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id, isAdmin]);

    if (!isAdmin) return <AdminNotice />;
    if (!id) return <ProviderForm />;
    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!rec || rec.id !== id) return <LoadingBox />;
    return <ProviderForm initial={rec} />;
}