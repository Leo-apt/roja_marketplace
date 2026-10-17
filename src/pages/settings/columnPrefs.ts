import { useEffect, useMemo, useState } from "react";

export type TableId =
  | "products"
  | "categories"
  | "bundles"
  | "clients"
  | "Engine configuration";

export type ColumnPref = {
  key: string;
  label: string;
  visible: boolean;
  /** Locked columns can't be hidden or moved (e.g. the Name column). */
  locked?: boolean;
};

export type ColumnsState = Record<TableId, ColumnPref[]>;

/** Same key the Settings page saves to. */
export const SETTINGS_KEY = "app:settings:v1";
/** Fired after a save so tables in the same tab update without a reload. */
export const SETTINGS_CHANGED_EVENT = "app:settings-changed";

export const TABLES: { id: TableId; label: string; hint: string }[] = [
  { id: "products", label: "Products", hint: "Catalog items" },
  { id: "categories", label: "Categories", hint: "Product groups" },
  { id: "bundles", label: "Bundles", hint: "Product sets" },
  { id: "clients", label: "Clients", hint: "Customer records" },
  {
    id: "Engine configuration",
    label: "Engine configuration",
    hint: "Engine rules and settings",
  },
];

export const DEFAULT_COLUMNS: ColumnsState = {
  products: [
    { key: "name", label: "Name", visible: true, locked: true },
    { key: "sku", label: "SKU", visible: true },
    { key: "category", label: "Category", visible: true },
    { key: "price", label: "Price", visible: true },
    { key: "margin", label: "Margin", visible: true },
    { key: "stock", label: "Stock", visible: true },
    { key: "status", label: "Status", visible: true },
    { key: "updatedAt", label: "Last updated", visible: false },
  ],
  categories: [
    { key: "name", label: "Name", visible: true, locked: true },
    { key: "parent", label: "Parent category", visible: true },
    { key: "products", label: "Products", visible: true },
    { key: "status", label: "Status", visible: true },
    { key: "createdAt", label: "Created", visible: false },
  ],
  bundles: [
    { key: "name", label: "Name", visible: true, locked: true },
    { key: "items", label: "Items", visible: true },
    { key: "price", label: "Price", visible: true },
    { key: "status", label: "Status", visible: true },
    { key: "updatedAt", label: "Last updated", visible: false },
  ],
  clients: [
    { key: "name", label: "Name", visible: true, locked: true },
    { key: "email", label: "Email", visible: true },
    { key: "phone", label: "Phone", visible: true },
    { key: "orders", label: "Orders", visible: true },
    { key: "status", label: "Status", visible: true },
    { key: "createdAt", label: "Created", visible: false },
  ],
  "Engine configuration": [
    // TODO: replace with the real columns for the Engine configuration table.
    { key: "name", label: "Name", visible: true, locked: true },
    { key: "email", label: "Email", visible: true },
    { key: "phone", label: "Phone", visible: true },
    { key: "orders", label: "Orders", visible: true },
    { key: "status", label: "Status", visible: true },
    { key: "createdAt", label: "Created", visible: false },
  ],
};

/**
 * Reconciles stored columns with the current defaults, so a column added or
 * removed in a later release never breaks someone's saved layout.
 */
export function mergeColumns(
  stored?: Partial<ColumnsState> | null,
): ColumnsState {
  const out = {} as ColumnsState;
  (Object.keys(DEFAULT_COLUMNS) as TableId[]).forEach((id) => {
    const defaults = DEFAULT_COLUMNS[id];
    const saved = stored?.[id];
    if (!saved || !Array.isArray(saved)) {
      out[id] = defaults.map((c) => ({ ...c }));
      return;
    }
    const byKey = new Map(defaults.map((c) => [c.key, c]));
    const kept: ColumnPref[] = [];
    saved.forEach((s) => {
      const base = byKey.get(s.key);
      if (!base) return; // column no longer exists
      kept.push({ ...base, visible: base.locked ? true : !!s.visible });
      byKey.delete(s.key);
    });
    byKey.forEach((c) => kept.push({ ...c })); // new columns go at the end
    out[id] = kept;
  });
  return out;
}

export function readColumns(): ColumnsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return mergeColumns(parsed?.columns);
  } catch {
    return mergeColumns(null);
  }
}

/**
 * For your real tables: returns the visible columns, in the saved order.
 *
 *   const cols = useColumnPrefs("products");
 *   cols.map(c => <th key={c.key}>{c.label}</th>)
 */
export function useColumnPrefs(table: TableId): ColumnPref[] {
  const [cols, setCols] = useState<ColumnPref[]>(() => readColumns()[table]);

  useEffect(() => {
    const sync = () => setCols(readColumns()[table]);
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(SETTINGS_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SETTINGS_CHANGED_EVENT, sync);
    };
  }, [table]);

  return useMemo(() => cols.filter((c) => c.visible), [cols]);
}
