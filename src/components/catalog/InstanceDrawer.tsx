import { useMemo, useState } from "react";
import Drawer from "@/components/shared/Drawer";
import { btn, Field, FileInput, TextArea, TextInput } from "./FormBits";

export interface InstanceDraft { name: string; description: string; imageUrl: string }

const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result)); // "data:image/png;base64,...."
    r.onerror = () => reject(new Error("Could not read the image"));
    r.readAsDataURL(f);
});

export default function InstanceDrawer({ onSubmit, initial }: {
    onSubmit: (d: InstanceDraft) => Promise<void>; initial?: InstanceDraft | null;
}) {
    const [name, setName] = useState(initial?.name ?? "");
    const [desc, setDesc] = useState(initial?.description ?? "");
    const [file, setFile] = useState<File | null>(null);
    const [err, setErr] = useState({ name: "", image: "" });
    const [saving, setSaving] = useState(false);
    const picked = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
    const preview = picked || initial?.imageUrl || "";

    const submit = async (close: () => void) => {
        const e = {
            name: name.trim() ? "" : "Client Name is required",
            image: file && file.size > 2 * 1024 * 1024 ? "Image must be less than 2 MB" : "",
        };
        setErr(e);
        if (e.name || e.image) return;
        setSaving(true);
        try {
            const imageUrl = file ? await toBase64(file) : (initial?.imageUrl ?? "");
            await onSubmit({ name: name.trim(), description: desc.trim(), imageUrl });
            close();
        } catch (x) {
            setErr({ name: x instanceof Error ? x.message : "Save failed", image: "" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Drawer
            title={initial ? "Edit Entity" : "Create Entity"}
            kicker="Entity"
            width="min(460px, calc(100vw - 20px))"
            footer={(close) => (
                <>
                    <button className={btn.cancel} onClick={close} disabled={saving}>Cancel</button>
                    <button className={`${btn.primary} disabled:opacity-60`} onClick={() => void submit(close)} disabled={saving}>
                        {saving ? "Saving…" : initial ? "Save" : "Create"}
                    </button>
                </>
            )}
        >
            <Field label="Client Name" required error={err.name}>
                <TextInput value={name} placeholder="e.g. Roja Main" onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Description">
                <TextArea rows={4} value={desc} placeholder="What is this Entity used for?" onChange={(e) => setDesc(e.target.value)} />
            </Field>
            <Field label="Image" note="Upload a JPEG or PNG image that is less than 2 MB." error={err.image}>
                <FileInput accept="image/png,image/jpeg" file={file} onChange={setFile} />
                {preview && <img src={preview} alt="Preview" className="mt-3 h-32 w-full rounded-lg border border-line object-contain" />}
            </Field>
        </Drawer>
    );
}