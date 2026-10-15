import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { btn, Field, FileInput, TextArea, TextInput } from "./FormBits";

export interface InstanceDraft { name: string; description: string; imageUrl: string }

const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result)); // "data:image/png;base64,...."
    r.onerror = () => reject(new Error("Could not read the image"));
    r.readAsDataURL(f);
});

export default function InstanceDrawer({ open, onClose, onSubmit, initial }: {
    open: boolean; onClose: () => void; onSubmit: (d: InstanceDraft) => Promise<void>; initial?: InstanceDraft | null;
}) {
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [err, setErr] = useState({ name: "", image: "" });
    const [shown, setShown] = useState(false);
    const [saving, setSaving] = useState(false);
    const picked = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
    const preview = picked || initial?.imageUrl || "";

    useEffect(() => {
        if (!open) { setShown(false); return; }
        setName(initial?.name ?? ""); setDesc(initial?.description ?? ""); setFile(null);
        setErr({ name: "", image: "" }); setSaving(false);
        const t = requestAnimationFrame(() => setShown(true));
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(t); document.removeEventListener("keydown", onKey); };
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!open) return null;

    const title = initial ? "Edit Entity" : "Create Entity";

    const submit = async () => {
        const e = {
            name: name.trim() ? "" : "Entity name is required",
            image: file && file.size > 2 * 1024 * 1024 ? "Image must be less than 2 MB" : "",
        };
        setErr(e);
        if (e.name || e.image) return;
        setSaving(true);
        try {
            const imageUrl = file ? await toBase64(file) : (initial?.imageUrl ?? "");
            await onSubmit({ name: name.trim(), description: desc.trim(), imageUrl });
            onClose();
        } catch (x) {
            setErr({ name: x instanceof Error ? x.message : "Save failed", image: "" });
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99990]">
            <div className={`absolute inset-0 bg-overlay/40 transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
            <aside role="dialog" aria-modal="true" aria-label={title}
                className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-200 ${shown ? "translate-x-0" : "translate-x-full"}`}>
                <header className="flex items-center justify-between border-b border-line px-5 py-4">
                    <h2 className="text-base font-bold text-ink">{title}</h2>
                    <button type="button" aria-label="Close" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <X className="size-5" />
                    </button>
                </header>
                <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
                    <Field label="Entity Name" required error={err.name}>
                        <TextInput value={name} placeholder="e.g. Roja Main" onChange={(e) => setName(e.target.value)} />
                    </Field>
                    <Field label="Description">
                        <TextArea rows={4} value={desc} placeholder="What is this Entity used for?" onChange={(e) => setDesc(e.target.value)} />
                    </Field>
                    <Field label="Image" note="Upload a JPEG or PNG image that is less than 2 MB." error={err.image}>
                        <FileInput accept="image/png,image/jpeg" file={file} onChange={setFile} />
                        {preview && <img src={preview} alt="Preview" className="mt-3 h-32 w-full rounded-lg border border-line object-contain" />}
                    </Field>
                </div>
                <footer className="flex justify-end gap-2 border-t border-line px-5 py-4">
                    <button className={btn.cancel} onClick={onClose} disabled={saving}>Cancel</button>
                    <button className={`${btn.primary} disabled:opacity-60`} onClick={() => void submit()} disabled={saving}>
                        {saving ? "Saving…" : initial ? "Save" : "Create"}
                    </button>
                </footer>
            </aside>
        </div>,
        document.body,
    );
}