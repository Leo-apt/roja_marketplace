import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/hooks/useApp";
import { btn, Field, FileInput, PhoneField, TextInput } from "@/components/catalog/FormBits";
import { DCard } from "@/components/catalog/DetailBits";
import { Alert } from "@/components/auth/AuthShell";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import { imageError } from "@/utils/validate";
import { providersService, type ProviderRec } from "@/services/providers.service";
import {
    blankCreds, CRED_FIELDS, credsErrors, CredsCardShell, CredsFields, CredsSkeleton, MODES,
    type CredKey, type CredValues, type Has, type Mode,
} from "./CredsBits";

const BASE = "/catalog/providers";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StepTitle({ n, children }: { n: number; children: ReactNode }) {
    return (
        <div className="mb-4 flex items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">{n}</span>
            <h3 className="text-sm font-bold uppercase tracking-wide text-ink">{children}</h3>
        </div>
    );
}

function ProviderForm({ initial }: { initial?: ProviderRec }) {
    const nav = useNavigate();
    const { toast, toastError } = useApp();
    const isEdit = !!initial;
    const [name, setName] = useState(initial?.name ?? "");
    const [phone, setPhone] = useState(initial?.phone ?? "");
    const [email, setEmail] = useState(initial?.email ?? "");
    const [logo, setLogo] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);

    // credentials: 6 fields each for Sandbox and Live
    const noCreds = { exists: false, secret: false, refresh: false };
    const [creds, setCreds] = useState<Record<Mode, CredValues>>({ sandbox: blankCreds, live: blankCreds });
    const [has, setHas] = useState<Record<Mode, Has & { exists: boolean }>>({ sandbox: noCreds, live: noCreds });
    const [credsLoading, setCredsLoading] = useState(isEdit);
    const [credsFailed, setCredsFailed] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [submitted, setSubmitted] = useState(false);

    // edit: load what is already saved for both modes
    useEffect(() => {
        if (!initial) return;
        let live = true;
        Promise.all([providersService.getCreds(initial.id, "sandbox"), providersService.getCreds(initial.id, "live")])
            .then(([sb, lv]) => {
                if (!live) return;
                setCreds({ sandbox: sb ? sb.creds : blankCreds, live: lv ? lv.creds : blankCreds });
                setHas({
                    sandbox: { exists: !!sb, secret: !!sb?.hasSecret, refresh: !!sb?.hasRefresh },
                    live: { exists: !!lv, secret: !!lv?.hasSecret, refresh: !!lv?.hasRefresh },
                });
            })
            .catch((e) => { if (live) { setCredsFailed(true); setApiError(e instanceof Error ? e.message : "Failed to load credentials"); } })
            .finally(() => { if (live) setCredsLoading(false); });
        return () => { live = false; };
    }, [initial?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const touchCred = (m: Mode, k: CredKey) => setTouched((p) => ({ ...p, [`${m}.${k}`]: true }));
    const setCredField = (m: Mode, k: CredKey, v: string) => {
        setCreds((p) => ({ ...p, [m]: { ...p[m], [k]: v } }));
        touchCred(m, k);
    };
    const credErr = (m: Mode, k: CredKey) => (touched[`${m}.${k}`] || submitted ? credsErrors(creds[m], has[m])[k] ?? "" : "");

    const submit = async () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = "Company name is required";
        if (phone.replace(/\D/g, "").length < 8) e.phone = "Enter a valid cell phone number";
        if (!email.trim()) e.email = "Email address is required";
        else if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address";
        if (!logo && !initial?.logoUrl) e.logo = "Logo is required";
        else if (logo && imageError(logo)) e.logo = imageError(logo);
        setErrors(e);
        setSubmitted(true);
        setApiError("");
        if (Object.keys(e).length) return;
        console.log("SANDBOX", credsErrors(creds.sandbox, has.sandbox), "LIVE", credsErrors(creds.live, has.live), has);
        const firstCred = MODES.flatMap((m) =>
            CRED_FIELDS.filter((f) => credsErrors(creds[m.value], has[m.value])[f.key]).map((f) => `cred-${m.value}-${f.key}`))[0];
        if (firstCred) { document.getElementById(firstCred)?.focus(); return; }
        setSaving(true);
        try {
            const input = { name, email, phone, logoFile: logo };
            const rec = initial ? await providersService.update(initial.id, input) : await providersService.create(input);
            try {
                for (const m of MODES) {
                    await providersService.saveCreds(rec.id, { ...creds[m.value], mode: m.value }, has[m.value].exists);
                }
            } catch (err) {
                if (initial) throw err;
                // the provider already exists: continue in edit mode so nothing is created twice
                toastError(`Provider created, but saving the credentials failed: ${err instanceof Error ? err.message : "Save failed"}. Add them here.`);
                nav(`${BASE}/${rec.id}/edit`);
                return;
            }
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
                <StepTitle n={1}>Provider details</StepTitle>
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

                <div className="mt-6 border-t border-line pt-5">
                    <StepTitle n={2}>Credentials</StepTitle>
                    <div className="grid items-start gap-4 lg:grid-cols-2">
                        {MODES.map((m) => (
                            <CredsCardShell key={m.value} mode={m.value}>
                                {credsLoading ? <CredsSkeleton /> : (
                                    <CredsFields idPrefix={`cred-${m.value}`} values={creds[m.value]} has={has[m.value]}
                                        error={(k) => credErr(m.value, k)}
                                        onChange={(k, v) => setCredField(m.value, k, v)}
                                        onTouch={(k) => touchCred(m.value, k)} />
                                )}
                            </CredsCardShell>
                        ))}
                    </div>
                </div>
            </DCard>
            <div className="flex justify-end gap-2">
                <button className={btn.cancel} onClick={() => nav(BASE)} disabled={saving}>Cancel</button>
                <button className={btn.primary} onClick={submit} disabled={saving || credsLoading || credsFailed}>{saving ? "Saving…" : "Submit"}</button>
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