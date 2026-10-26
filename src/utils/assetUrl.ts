const BASE = ((import.meta.env.VITE_ASSET_BASE_URL as string | undefined) ?? "").replace(/\/$/, "");
const isUrl = (v: string) => /^https?:\/\//i.test(v);

// the server may send a full link (in profileImageUrl or in profileImageKey), or a plain S3 key
export const assetUrl = (key?: string | null, url?: string | null): string | null => {
    if (url) return url;
    if (key && isUrl(key)) return key; // key already holds the full CDN link
    if (key && BASE) return `${BASE}/${key.replace(/^\//, "")}`;
    return null;
};