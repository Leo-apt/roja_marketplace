import type { ReactNode } from "react";

export interface Column<T> {
    key: string;
    label: string;
    align?: "right";
    sort?: (r: T) => string | number;
    render: (r: T) => ReactNode;
    value?: (r: T) => string | number;
}