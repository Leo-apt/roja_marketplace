import { useRef, useState, type ChangeEvent } from "react";
import { Camera } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { useAuth } from "@/hooks/useAuth";
import { useProfileImage } from "@/hooks/useProfileImage";
import { imageFileError, uploadProfileImage } from "@/services/profileImage.service";

export default function ProfileAvatar({ initials }: { initials: string }) {
    const { toast, toastError } = useApp();
    const { setProfileImage } = useAuth();
    const url = useProfileImage();
    const input = useRef<HTMLInputElement>(null);
    const [pending, setPending] = useState<{ file: File; preview: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const shown = pending?.preview ?? url;

    // picking only shows a preview; nothing is uploaded until Save
    const pick = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const err = imageFileError(file);
        if (err) { toastError(err); return; }
        if (pending) URL.revokeObjectURL(pending.preview);
        setPending({ file, preview: URL.createObjectURL(file) });
    };

    const cancel = () => {
        if (pending) URL.revokeObjectURL(pending.preview);
        setPending(null);
    };

    const save = async () => {
        if (!pending) return;
        setBusy(true);
        try {
            const url = await uploadProfileImage(pending.file);
            setProfileImage(url); // top bar and this avatar change now
            toast("Profile photo updated");
            URL.revokeObjectURL(pending.preview);
            setPending(null);
        } catch (er) {
            // keep the preview so the user can press Save again or Cancel
            toastError(er instanceof Error ? er.message : "Upload failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex flex-col items-start gap-2">
            <div className="relative">
                <span className="grid size-[72px] place-items-center overflow-hidden rounded-2xl bg-topbar-avatar-bg text-lg font-bold text-topbar-avatar-text ring-4 ring-white">
                    {shown ? <img src={shown} alt="Profile" className="size-full object-cover" /> : initials}
                </span>
                {busy && (
                    <span className="absolute inset-0 grid place-items-center rounded-2xl bg-black/40">
                        <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    </span>
                )}
                <button type="button" aria-label="Change photo" title="Change photo" disabled={busy}
                    onClick={() => input.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 grid size-7 place-items-center rounded-full border border-gray-200 bg-white text-brand shadow-sm hover:bg-gray-50 disabled:opacity-60">
                    <Camera className="size-3.5" />
                </button>
                <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pick} />
            </div>
            {pending && (
                <div className="flex items-center gap-2">
                    <button type="button" onClick={cancel} disabled={busy}
                        className="h-8 rounded-xl px-3 text-xs font-semibold text-muted outline-none transition-colors hover:bg-gray-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-50">
                        Cancel
                    </button>
                    <button type="button" onClick={() => void save()} disabled={busy}
                        className="inline-flex h-8 min-w-[68px] items-center justify-center rounded-xl bg-brand px-3 text-xs font-semibold text-white shadow-sm outline-none transition hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand/40 active:translate-y-0 active:scale-95 disabled:opacity-70">
                        {busy ? "Saving…" : "Save"}
                    </button>
                </div>
            )}
        </div>
    );
}