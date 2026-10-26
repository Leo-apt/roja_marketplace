import { apiCall } from "@/services/auth.service";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

export const imageFileError = (f: File) =>
    !TYPES.includes(f.type) ? "Use a JPEG, PNG or WebP image" : f.size > MAX_BYTES ? "Image must be under 2 MB" : "";

export async function uploadProfileImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const r = await apiCall<{ profileImageUrl?: string | null }>("/users/profile-image", { method: "POST", body: fd });
    const url = r.data.profileImageUrl ?? null;
    if (!url) throw new Error("Photo uploaded, but the server returned no image URL");
    return url;
}