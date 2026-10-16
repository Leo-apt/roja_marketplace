import { useEffect, useState } from "react";

/** Returns `value` once it has stopped changing for `delay` ms. */
export function useDebounce<T>(value: T, delay = 300): T {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = window.setTimeout(() => setV(value), delay);
        return () => window.clearTimeout(t);
    }, [value, delay]);
    return v;
}