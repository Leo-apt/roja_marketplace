import { apiCall } from "@/services/auth.service";
import { assetUrl } from "@/utils/assetUrl";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

export const imageFileError = (f: File) =>
    !TYPES.includes(f.type) ? "Use a JPEG, PNG or WebP image" : f.size > MAX_BYTES ? "Image must be under 2 MB" : "";

export async function uploadProfileImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const r = await apiCall<{ profileImageKey?: string | null; profileImageUrl?: string | null }>("/users/profile-image", { method: "POST", body: fd });
    const url = assetUrl(r.data.profileImageKey, r.data.profileImageUrl);
    if (!url) throw new Error("Photo uploaded, but the image address could not be built. Set VITE_ASSET_BASE_URL");
    return url;
}