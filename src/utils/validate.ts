/** Removes spaces typed at the start of a value. */
export const noLead = (s: string) => s.replace(/^\s+/, "");

/** Text without HTML tags, to count what the user actually typed in a rich text editor. */
export const plainText = (html: string) =>
    html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();

export const textError = (label: string, value: string, min: number, max: number, required = true) => {
    const v = value.trim();
    if (!v) return required ? `${label} is required` : "";
    if (v.length < min) return `${label} must be at least ${min} characters`;
    if (v.length > max) return `${label} must be at most ${max} characters`;
    return "";
};

export const priceError = (label: string, value: string, o: { required?: boolean; min?: number; max?: number } = {}) => {
    const { required = false, min = 0, max = 99999.99 } = o;
    const v = value.trim();
    if (!v) return required ? `${label} is required` : "";
    if (!/^\d+(\.\d{1,2})?$/.test(v)) return `${label} must be a valid amount with up to 2 decimals`;
    const n = Number(v);
    if (n < min) return min > 0 ? `${label} must be at least ${min}` : `${label} cannot be negative`;
    if (n > max) return `${label} cannot be more than ${max}`;
    return "";
};

export const imageError = (file: File | null, maxMb = 2) => {
    if (!file) return "";
    if (!["image/png", "image/jpeg"].includes(file.type)) return "Only JPEG or PNG images are allowed";
    if (file.size > maxMb * 1024 * 1024) return `Image must be less than ${maxMb} MB`;
    return "";
};