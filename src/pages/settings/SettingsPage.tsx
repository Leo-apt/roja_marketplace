import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Cog,
  Columns3,
  Eye,
  EyeOff,
  FolderTree,
  Lock,
  Monitor,
  Moon,
  Package,
  PackagePlus,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  User,
  Users,
  CreditCard,
  FlaskConical,
  Pencil,
  Rocket, Activity, Building2, Layers, LayoutTemplate,
  type LucideIcon,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { viewInfo, type ViewKey } from "@/utils/views";
import { useAuth } from "@/hooks/useAuth";
import { useApp } from "@/hooks/useApp";
import { gatewayService, type GatewayView } from "@/services/payment-gateway.service";
import { useTheme, type ThemeMode } from "@/theme/ThemeProvider";
import { settingsService } from "@/services/settings.service";
import ProfileAvatar from "@/pages/settings/ProfileAvatar";
import {
  DEFAULT_COLUMNS,
  SETTINGS_CHANGED_EVENT,
  SETTINGS_KEY,
  TABLES,
  mergeColumns,
  type ColumnPref,
  type ColumnsState,
  type TableId,
} from "@/pages/settings/columnPrefs";

/* ───────────────────────── Types & storage ───────────────────────── */

type SettingsState = {
  displayName: string;
  phone: string;
  language: string;
  currency: string;
  dateFormat: string;
  timezone: string;
  withdrawalMin: string;
  columns: ColumnsState;
};

type TabId = "profile" | "preferences" | "columns" | "gateway";

/** Factory so every call returns fresh state (no shared columns reference). */
function makeDefaults(displayName = ""): SettingsState {
  return {
    displayName,
    phone: "",
    language: "en",
    currency: "INR",
    dateFormat: "DD/MM/YYYY",
    timezone: "Asia/Kolkata",
    withdrawalMin: "100",
    columns: mergeColumns(null),
  };
}

function hasStoredSettings(): boolean {
  try {
    return localStorage.getItem(SETTINGS_KEY) !== null;
  } catch {
    return false;
  }
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function loadSettings(fallbackName: string): SettingsState {
  const base = makeDefaults(fallbackName);
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    const stored =
      parsed && typeof parsed === "object"
        ? (parsed as Partial<SettingsState>)
        : {};
    // Pick known fields only, so values saved by older versions are dropped.
    return {
      displayName: str(stored.displayName, base.displayName),
      phone: str(stored.phone, base.phone),
      language: str(stored.language, base.language),
      currency: str(stored.currency, base.currency),
      dateFormat: str(stored.dateFormat, base.dateFormat),
      timezone: str(stored.timezone, base.timezone),
      withdrawalMin: str(stored.withdrawalMin, base.withdrawalMin),
      columns: mergeColumns(stored.columns),
    };
  } catch {
    return base;
  }
}

/** Swap this for your Fastify call (e.g. PATCH /me/settings) when the API exists. */
async function saveSettings(next: SettingsState): Promise<void> {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    throw new Error("Couldn't write to this browser's storage.");
  }
  window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT));
}

/** Structural compare — ignores object key order, unlike JSON.stringify. */
function settingsEqual(a: SettingsState, b: SettingsState): boolean {
  const scalars: (keyof SettingsState)[] = [
    "displayName",
    "phone",
    "language",
    "currency",
    "dateFormat",
    "timezone",
    "withdrawalMin",
  ];
  for (const key of scalars) {
    if (a[key] !== b[key]) return false;
  }
  const tables = Object.keys(a.columns) as TableId[];
  for (const table of tables) {
    const left = a.columns[table];
    const right = b.columns[table];
    if (!right || left.length !== right.length) return false;
    for (let i = 0; i < left.length; i += 1) {
      if (left[i].key !== right[i].key) return false;
      if (left[i].visible !== right[i].visible) return false;
    }
  }
  return true;
}

/* Sample data. Replace with values from your API. */
const SAMPLE_ACCOUNT = {
  role: "Administrator",
  memberSince: "Mar 2025",
  lastSignIn: "Today, 9:42 AM",
  workspace: "Roja",
};

const TABS: { id: TabId; label: string; hint: string; icon: LucideIcon }[] = [
  {
    id: "profile",
    label: "Profile",
    hint: "Your name and contact",
    icon: User,
  },
  {
    id: "preferences",
    label: "Preferences",
    hint: "Look and region",
    icon: SlidersHorizontal,
  },
  {
    id: "columns",
    label: "Columns",
    hint: "Choose table columns",
    icon: Columns3,
  },
  {
    id: "gateway",
    label: "Payment Gateway",
    hint: "Sandbox and live keys",
    icon: CreditCard,
  },
];

const THEME_CHOICES: {
  mode: ThemeMode;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
    {
      mode: "light",
      title: "Light",
      description: "Bright and clean.",
      icon: Sun,
    },
    {
      mode: "dark",
      title: "Dark",
      description: "Easy on the eyes at night.",
      icon: Moon,
    },
    {
      mode: "system",
      title: "System",
      description: "Match your device setting.",
      icon: Monitor,
    },
  ];

const TABLE_ICONS: Record<TableId, LucideIcon> = {
  products: Package,
  categories: FolderTree,
  bundles: PackagePlus,
  clients: Users,
  "Engine configuration": Cog,
};

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ta", label: "Tamil" },
  { value: "hi", label: "Hindi" },
];
const CURRENCIES = [
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
];
const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];
const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India (IST, UTC+5:30)" },
  { value: "Asia/Dubai", label: "Dubai (GST, UTC+4)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "America/New_York", label: "New York (ET)" },
];

/* ───────────────────────── Small building blocks ───────────────────────── */

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full outline-none transition-colors duration-300 st-ease focus-visible:ring-2 focus-visible:ring-brand/30 ${checked ? "bg-brand" : "bg-gray-200"
        }`}
    >
      {/* bg-[#fff] (not bg-white) so the knob stays white in dark mode */}
      <span
        className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-[#fff] shadow-sm transition-transform duration-300 st-spring ${checked ? "translate-x-5" : "translate-x-0"
          }`}
      />
    </button>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink">
        {label}
        {required && <span className="text-red-600">*</span>}
      </span>
      {children}
      {error ? (
        <span role="alert" className="mt-1.5 block text-[11px] text-red-600">
          {error}
        </span>
      ) : (
        hint && (
          <span className="mt-1.5 block text-[11px] text-muted">{hint}</span>
        )
      )}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200/80 bg-white px-3.5 text-xs text-ink shadow-sm outline-none " +
  "transition-[border-color,box-shadow] duration-200 placeholder:text-muted hover:border-gray-300 " +
  "focus:border-brand focus:shadow-[0_0_0_4px] focus:shadow-brand/[0.08] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-muted";

function SelectField({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} appearance-none pr-9`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
    </Field>
  );
}

function ChoiceCard({
  selected,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  icon?: LucideIcon;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative rounded-2xl border p-4 text-left outline-none transition-[border-color,background-color,box-shadow,transform] duration-300 st-ease focus-visible:ring-2 focus-visible:ring-brand/30 active:scale-[0.985] ${selected
        ? "border-brand bg-brand/5 shadow-[0_0_0_3px] shadow-brand/[0.08]"
        : "border-gray-200/80 bg-white hover:border-gray-300 hover:shadow-sm"
        }`}
    >
      <span
        className={`absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-brand text-white transition-[transform,opacity] duration-300 st-spring ${selected ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      {Icon && (
        <span
          className={`mb-3 grid size-9 place-items-center rounded-lg transition-colors duration-300 ${selected ? "bg-brand/10 text-brand" : "bg-gray-100 text-muted"
            }`}
        >
          <Icon className="size-[18px]" />
        </span>
      )}
      <p className="text-xs font-semibold text-ink">{title}</p>
      <p className="mt-1 text-[11px] text-muted">{description}</p>
    </button>
  );
}

function Card({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-gradient-to-b from-gray-50/90 to-white px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          <p className="mt-0.5 text-[11px] text-muted">{description}</p>
        </div>
        {action}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 truncate text-xs font-semibold text-ink">{value}</p>
    </div>
  );
}

/* ───────────────────────── Tab panels ───────────────────────── */

type PanelProps = {
  draft: SettingsState;
  set: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  email?: string;
  initials: string;
};

/* Profile */
function ProfilePanel({ draft, set, email, initials }: PanelProps) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <div className="h-20 bg-gradient-to-r from-brand/15 via-brand/5 to-transparent" />
        <div className="px-5 pb-5">
          <div className="-mt-9 flex flex-wrap items-end gap-4">
            <ProfileAvatar initials={initials} />
            <div className="min-w-0 pb-1 leading-tight">
              <p className="truncate text-sm font-bold text-ink">
                {draft.displayName || "Your name"}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted">
                {email ?? "Signed in"}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Role" value={SAMPLE_ACCOUNT.role} />
            <StatTile label="Workspace" value={SAMPLE_ACCOUNT.workspace} />
            <StatTile label="Member since" value={SAMPLE_ACCOUNT.memberSince} />
            <StatTile label="Last sign-in" value={SAMPLE_ACCOUNT.lastSignIn} />
          </div>
        </div>
      </section>

      <Card
        title="Personal details"
        description="How you appear across the workspace."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Display name">
            <input
              className={inputClass}
              value={draft.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              maxLength={80}
            />
          </Field>
          <Field label="Phone" hint="Optional. Used for account recovery.">
            <input
              className={inputClass}
              value={draft.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 00000 00000"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={24}
            />
          </Field>
          <Field label="Email" hint="Your sign-in email can't be changed here.">
            <input
              className={inputClass}
              value={email ?? ""}
              disabled
              readOnly
              autoComplete="email"
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}

/* Preferences */
function PreferencesPanel({ draft, set }: PanelProps) {
  const { mode, resolved, setMode } = useTheme();

  return (
    <div className="space-y-6">
      <Card
        title="Theme"
        description={
          mode === "system"
            ? `Following your device. Currently ${resolved}.`
            : "Applies instantly, no need to save."
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {THEME_CHOICES.map((c) => (
            <ChoiceCard
              key={c.mode}
              selected={mode === c.mode}
              title={c.title}
              description={c.description}
              icon={c.icon}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setMode(c.mode, {
                  x: r.left + r.width / 2,
                  y: r.top + r.height / 2,
                });

                void settingsService.updatePreferences({ theme: c.mode }).catch(() => { });
              }}
            />
          ))}
        </div>
      </Card>

      <Card
        title="Region and format"
        description="How numbers, money and dates are shown."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Language"
            value={draft.language}
            options={LANGUAGES}
            onChange={(v) => set("language", v)}
          />
          <SelectField
            label="Currency"
            value={draft.currency}
            options={CURRENCIES}
            onChange={(v) => set("currency", v)}
          />
          <SelectField
            label="Date format"
            value={draft.dateFormat}
            options={DATE_FORMATS}
            onChange={(v) => set("dateFormat", v)}
          />
          <SelectField
            label="Time zone"
            value={draft.timezone}
            options={TIMEZONES}
            onChange={(v) => set("timezone", v)}
          />
        </div>
      </Card>

      <Card
        title="Client withdrawals"
        description="Clients can withdraw only after their balance reaches this amount."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Payout Threshold" hint="Display only for now. Payouts are not enabled yet.">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-ink">$</span>
              <input
                className={`${inputClass} pl-6`}
                type="number"
                min={0}
                inputMode="decimal"
                value={draft.withdrawalMin}
                onChange={(e) => set("withdrawalMin", e.target.value)}
              />
            </div>
          </Field>
        </div>
      </Card>
    </div>
  );
}

/* Columns */
function ColumnsPanel({
  draft,
  set,
  table,
  onTableChange,
}: PanelProps & { table: TableId; onTableChange: (t: TableId) => void }) {
  const cols = draft.columns[table];
  const visibleCount = cols.filter((c) => c.visible).length;
  const isDefault = cols.every((c, i) => {
    const d = DEFAULT_COLUMNS[table][i];
    return d && c.key === d.key && c.visible === d.visible;
  });

  const update = (next: ColumnPref[]) =>
    set("columns", { ...draft.columns, [table]: next });

  const toggle = (key: string) =>
    update(
      cols.map((c) =>
        c.key === key && !c.locked ? { ...c, visible: !c.visible } : c,
      ),
    );

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= cols.length) return;
    if (cols[target].locked || cols[index].locked) return;
    const next = [...cols];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  const setAll = (visible: boolean) =>
    update(cols.map((c) => (c.locked ? c : { ...c, visible })));

  return (
    <div className="space-y-6">
      <Card
        title="Choose a table"
        description="Each table keeps its own column layout."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {TABLES.map((t) => {
            const shown = draft.columns[t.id].filter((c) => c.visible).length;
            return (
              <ChoiceCard
                key={t.id}
                selected={table === t.id}
                title={t.label}
                description={`${shown} of ${draft.columns[t.id].length} columns shown`}
                icon={TABLE_ICONS[t.id]}
                onClick={() => onTableChange(t.id)}
              />
            );
          })}
        </div>
      </Card>

      <Card
        title="Columns"
        description={`${visibleCount} of ${cols.length} shown. Locked columns always stay first.`}
        action={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setAll(true)}
              className="h-8 rounded-lg px-2.5 text-[11px] font-semibold text-muted outline-none transition-colors duration-200 hover:bg-gray-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/30"
            >
              Show all
            </button>
            <button
              type="button"
              onClick={() => setAll(false)}
              className="h-8 rounded-lg px-2.5 text-[11px] font-semibold text-muted outline-none transition-colors duration-200 hover:bg-gray-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/30"
            >
              Hide all
            </button>
            <button
              type="button"
              disabled={isDefault}
              onClick={() =>
                update(DEFAULT_COLUMNS[table].map((c) => ({ ...c })))
              }
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold text-brand outline-none transition-colors duration-200 hover:bg-brand/5 focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          </div>
        }
      >
        <ul className="space-y-2">
          {cols.map((c, i) => {
            const canUp = !c.locked && i > 0 && !cols[i - 1].locked;
            const canDown = !c.locked && i < cols.length - 1;
            return (
              <li
                key={c.key}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-[border-color,background-color,opacity] duration-200 st-ease ${c.visible
                  ? "border-gray-200/80 bg-white"
                  : "border-dashed border-gray-200 bg-gray-50/70"
                  }`}
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg transition-colors duration-200 ${c.visible
                    ? "bg-brand/10 text-brand"
                    : "bg-gray-100 text-muted"
                    }`}
                >
                  {c.locked ? (
                    <Lock className="size-4" />
                  ) : c.visible ? (
                    <Eye className="size-4" />
                  ) : (
                    <EyeOff className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <p
                    className={`truncate text-xs font-semibold ${c.visible ? "text-ink" : "text-muted"
                      }`}
                  >
                    {c.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {c.locked ? "Always shown" : c.visible ? "Shown" : "Hidden"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Move ${c.label} up`}
                    disabled={!canUp}
                    onClick={() => move(i, -1)}
                    className="grid size-8 place-items-center rounded-lg text-muted outline-none transition-colors duration-200 hover:bg-gray-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${c.label} down`}
                    disabled={!canDown}
                    onClick={() => move(i, 1)}
                    className="grid size-8 place-items-center rounded-lg text-muted outline-none transition-colors duration-200 hover:bg-gray-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  {c.locked ? (
                    <span className="w-11" />
                  ) : (
                    <span className="ml-2">
                      <Toggle
                        checked={c.visible}
                        onChange={() => toggle(c.key)}
                        label={`Show ${c.label}`}
                      />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

/* Payment gateway */
type GatewayEnv = "sandbox" | "live";
type GatewayCreds = { publishableKey: string; secretKey: string };
const BLANK_CREDS: GatewayCreds = { publishableKey: "", secretKey: "" };

const GATEWAY_TABS: {
  value: GatewayEnv;
  label: string;
  icon: LucideIcon;
  on: string;
}[] = [
    { value: "sandbox", label: "Sandbox", icon: FlaskConical, on: "border-amber-600 bg-amber-50 text-amber-700" },
    { value: "live", label: "Live", icon: Rocket, on: "border-emerald-600 bg-emerald-50 text-emerald-700" },
  ];

function SecretField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        className={`${inputClass} pr-10`}
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        aria-label={show ? "Hide" : "Show"}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function PaymentGatewayPanel() {
  const { toast, toastError } = useApp();
  const [sp, setSp] = useSearchParams();
  const env: GatewayEnv = sp.get("env") === "live" ? "live" : "sandbox";
  const setEnv = (e: GatewayEnv) => setSp({ tab: "gateway", env: e }, { replace: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState<GatewayView | null>(null); // what the server has for this mode
  const [creds, setCreds] = useState<GatewayCreds>(BLANK_CREDS);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // loads the saved keys every time the mode changes (skeleton while loading)
  useEffect(() => {
    let live = true;
    setLoading(true);
    setErrors({});
    setEditing(false);
    const minDelay = new Promise((r) => setTimeout(r, 500));
    Promise.all([gatewayService.get(env), minDelay])
      .then(([r]) => {
        if (!live) return;
        setView(r);
        setCreds({ publishableKey: r.publishableKey, secretKey: "" });
        setEditing(!r.configured); // nothing saved yet: open the form
      })
      .catch((e) => {
        if (live) toastError(e instanceof Error ? e.message : "Failed to load credentials");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [env]); // eslint-disable-line react-hooks/exhaustive-deps

  const configured = !!view?.configured;
  const readOnly = configured && !editing;

  const pick = (e: GatewayEnv) => {
    if (e !== env && !saving) setEnv(e);
  };
  const startEdit = () => {
    setCreds({ publishableKey: view?.publishableKey ?? "", secretKey: "" });
    setErrors({});
    setEditing(true);
  };
  const setField = (k: keyof GatewayCreds, v: string) => {
    setCreds((c) => ({ ...c, [k]: v.replace(/\s/g, "") }));
    setErrors((p) => {
      const n = { ...p };
      delete n[k];
      return n;
    });
  };
  const save = async () => {
    const e: Record<string, string> = {};
    if (!creds.publishableKey.trim()) e.publishableKey = "Publishable Key is required";
    if (!configured && !creds.secretKey.trim()) e.secretKey = "Secret Key is required";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const secret = creds.secretKey.trim();
      const r = await gatewayService.save(env, {
        publishableKey: creds.publishableKey.trim(),
        ...(secret ? { secretKey: secret } : {}), // blank = keep the saved secret
      });
      setView(r);
      setCreds({ publishableKey: r.publishableKey, secretKey: "" });
      toast(configured ? "Credentials updated" : "Credentials saved");
      setEditing(false);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };
  const cancel = () => {
    setCreds({ publishableKey: view?.publishableKey ?? "", secretKey: "" });
    setErrors({});
    setEditing(!configured);
  };

  return (
    <Card
      title="Payment Gateway"
      description="Sandbox and live credentials for the payment gateway."
    >
      <div className="space-y-5">
        <div role="tablist" aria-label="Environment" className="flex gap-1 border-b border-gray-200">
          {GATEWAY_TABS.map((t) => {
            const Icon = t.icon;
            const active = env === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => pick(t.value)}
                className={`-mb-px inline-flex items-center gap-2 rounded-t-lg border-b-2 px-5 py-2.5 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-brand/30 ${active
                  ? t.on
                  : "border-transparent text-muted hover:bg-gray-50 hover:text-ink"
                  }`}
              >
                <Icon className="size-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-5">
            <div className="skeleton h-5 w-32" />
            <div className="grid gap-5 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="skeleton h-3 w-28" />
                  <div className="skeleton h-11 w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-ink">Credentials</h3>
              {readOnly && (
                <button
                  type="button"
                  aria-label="Edit credentials"
                  title="Edit"
                  onClick={startEdit}
                  className="grid size-9 place-items-center rounded-lg border border-gray-200/80 bg-white text-ink outline-none transition hover:border-brand hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/30"
                >
                  <Pencil className="size-4" />
                </button>
              )}
            </div>

            {readOnly ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <StatTile label="Publishable Key" value={view?.publishableKey || "N/A"} />
                <StatTile label="Secret Key" value={view?.secretMasked || "N/A"} />
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Publishable Key" required error={errors.publishableKey}>
                    <input
                      className={inputClass}
                      value={creds.publishableKey}
                      autoComplete="off"
                      onChange={(e) => setField("publishableKey", e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Secret Key"
                    required={!configured}
                    hint={configured ? "Leave blank to keep the saved secret key." : undefined}
                    error={errors.secretKey}
                  >
                    <SecretField
                      value={creds.secretKey}
                      placeholder={configured ? "Saved. Leave blank to keep" : ""}
                      onChange={(v) => setField("secretKey", v)}
                    />
                  </Field>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancel}
                    disabled={saving}
                    className="h-9 rounded-xl px-3 text-xs font-semibold text-muted outline-none transition-colors duration-200 hover:bg-gray-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving}
                    className="inline-flex h-9 min-w-[96px] items-center justify-center rounded-xl bg-brand px-4 text-xs font-semibold text-white shadow-sm outline-none transition hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand/40 active:translate-y-0 active:scale-95"
                  >
                    {saving ? (configured ? "Updating…" : "Saving…") : configured ? "Update" : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

const MARKET: { key: ViewKey; icon: LucideIcon }[] = [
  { key: "providers", icon: Building2 },
  { key: "productCategories", icon: FolderTree },
  { key: "bundles", icon: Layers },
  { key: "catalogProducts", icon: Package },
  { key: "engineConfig", icon: SlidersHorizontal },
  { key: "productTemplates", icon: LayoutTemplate },
  { key: "engineSignals", icon: Activity },
];

/* ───────────────────────── Page ───────────────────────── */

const PAGE_STYLES = `
  :root {
    --st-ease: cubic-bezier(0.22, 1, 0.36, 1);
    --st-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .st-ease.st-ease { transition-timing-function: var(--st-ease); }
  .st-spring.st-spring { transition-timing-function: var(--st-spring); }

  @keyframes st-page-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes st-panel-in {
    from { opacity: 0; transform: translateX(12px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes st-bar-in {
    from { opacity: 0; transform: translate(-50%, 16px) scale(0.98); }
    to   { opacity: 1; transform: translate(-50%, 0) scale(1); }
  }
  .st-page  { animation: st-page-in 450ms var(--st-ease) both; }
  .st-panel { animation: st-panel-in 380ms var(--st-ease) both; }
  .st-bar   { animation: st-bar-in 420ms var(--st-spring) both; }

  @media (prefers-reduced-motion: reduce) {
    .st-page, .st-panel, .st-bar { animation: none; }
    .st-bar { transform: translateX(-50%); }
  }
`;

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { setMode } = useTheme();
  const navigate = useNavigate();
  const email = user?.user_email;

  const fallbackName = useMemo(() => {
    if (!email) return "";
    return email
      .split("@")[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  }, [email]);

  const [saved, setSaved] = useState<SettingsState>(() =>
    loadSettings(fallbackName),
  );
  const [draft, setDraft] = useState<SettingsState>(saved);
  const [sp, setSp] = useSearchParams();
  const tabParam = sp.get("tab");
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "profile";
  const setTab = (id: TabId) => setSp({ tab: id }, { replace: true });
  const [columnsTable, setColumnsTable] = useState<TableId>("products");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const savedRef = useRef(saved);
  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);

  const dirty = useMemo(() => !settingsEqual(saved, draft), [saved, draft]);
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  // Load profile + preferences from the server once.
  useEffect(() => {
    let live = true;
    Promise.all([settingsService.getProfile(), settingsService.getPreferences()])
      .then(([p, pr]) => {
        if (!live) return;
        const apply = (s: SettingsState): SettingsState => ({
          ...s,
          displayName: p.name,
          phone: p.phone ?? "",
          language: pr.language,
          currency: pr.currency,
          dateFormat: pr.dateFormat,
          timezone: pr.timeZone,
        });
        const hadEdits = dirtyRef.current;
        setSaved((s) => apply(s));
        if (!hadEdits) setDraft((d) => apply(d));
        setMode(pr.theme);
      })
      .catch(() => {
        /* keep the local copy if the server is unreachable */
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = useMemo(() => {
    const source = (draft.displayName || fallbackName || email || "U").trim();
    const parts = source.split(/[\s._-]+/).filter(Boolean);
    const letters =
      parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
    return letters.toUpperCase();
  }, [draft.displayName, fallbackName, email]);

  const set: PanelProps["set"] = (key, value) => {
    setJustSaved(false);
    setSaveError(null);
    setDraft((d) => (Object.is(d[key], value) ? d : { ...d, [key]: value }));
  };

  // Backfill display name once auth hydrates — but never overwrite a saved name.
  useEffect(() => {
    if (!fallbackName || hasStoredSettings()) return;
    setSaved((s) => (s.displayName ? s : { ...s, displayName: fallbackName }));
    setDraft((d) => (d.displayName ? d : { ...d, displayName: fallbackName }));
  }, [fallbackName]);

  // Pick up changes saved in another tab without clobbering local edits.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SETTINGS_KEY) return;
      const next = loadSettings(fallbackName);
      setSaved(next);
      if (!dirtyRef.current) setDraft(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fallbackName]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Clear the "Saved" confirmation after a moment.
  useEffect(() => {
    if (!justSaved) return;
    const t = window.setTimeout(() => setJustSaved(false), 2200);
    return () => window.clearTimeout(t);
  }, [justSaved]);

  const onSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = draftRef.current;
      const prev = savedRef.current;

      if (payload.displayName !== prev.displayName || payload.phone !== prev.phone) {
        const name = payload.displayName.trim();
        if (!name) throw new Error("Display name can't be empty.");
        await settingsService.updateProfile({
          name,
          phone: payload.phone.trim() || null,
        });
        await refreshUser().catch(() => { }); // top bar picks up the new name
      }

      const prefsChanged =
        payload.language !== prev.language ||
        payload.currency !== prev.currency ||
        payload.dateFormat !== prev.dateFormat ||
        payload.timezone !== prev.timezone;
      if (prefsChanged) {
        await settingsService.updatePreferences({
          language: payload.language,
          currency: payload.currency,
          dateFormat: payload.dateFormat,
          timeZone: payload.timezone, // backend spells it timeZone
        });
      }

      await saveSettings(payload); // still writes localStorage (columns use it for now)
      setSaved(payload);
      setJustSaved(true);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Couldn't save your settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Cmd/Ctrl+S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "s") return;
      e.preventDefault();
      if (dirty && !saving) void onSave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, saving]);

  // Roving tabindex: arrows move selection AND focus.
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});
  const selectTab = (id: TabId, moveFocus = false) => {
    setTab(id);
    if (moveFocus) {
      requestAnimationFrame(() => tabRefs.current[id]?.focus());
    }
  };

  const onKeyTabs = (e: React.KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const last = TABS.length - 1;
    let next: TabId | undefined;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      next = TABS[(i + 1) % TABS.length].id;
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      next = TABS[(i - 1 + TABS.length) % TABS.length].id;
    } else if (e.key === "Home") {
      next = TABS[0].id;
    } else if (e.key === "End") {
      next = TABS[last].id;
    }
    if (!next) return;
    e.preventDefault();
    selectTab(next, true);
  };

  const panelProps: PanelProps = { draft, set, email, initials };
  const barState: "error" | "saved" | "dirty" = saveError
    ? "error"
    : justSaved && !dirty
      ? "saved"
      : "dirty";

  return (
    <div className="st-page w-full pb-32 pt-6">
      <style>{PAGE_STYLES}</style>

      <div className="grid items-start gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 md:sticky md:top-24">
          {/* Tab list */}
          <div
            role="tablist"
            aria-orientation="vertical"
            onKeyDown={onKeyTabs}
            className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-200/80 bg-white p-2 shadow-sm md:flex-col md:overflow-visible"
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el;
                  }}
                  id={`settings-tab-${t.id}`}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  aria-controls={`settings-panel-${t.id}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => selectTab(t.id)}
                  className={`group relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-[background-color,color,transform] duration-300 st-ease focus-visible:ring-2 focus-visible:ring-brand/30 active:scale-[0.98] md:w-full ${active ? "bg-brand/5 text-brand" : "text-ink hover:bg-gray-50"
                    }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-full bg-brand transition-[height,opacity] duration-300 st-ease max-md:hidden ${active ? "h-5 opacity-100" : "h-0 opacity-0"
                      }`}
                  />
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg transition-[background-color,transform] duration-300 st-spring ${active
                      ? "scale-105 bg-brand/10"
                      : "bg-gray-100 group-hover:scale-105"
                      }`}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-xs font-semibold">{t.label}</span>
                    <span className="block text-[11px] text-muted max-md:hidden">
                      {t.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <nav aria-label="Marketplace" className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-200/80 bg-white p-2 shadow-sm md:flex-col md:overflow-visible">
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted max-md:hidden">Marketplace</p>
            {MARKET.map(({ key, icon: Icon }) => (
              <button key={key} type="button" onClick={() => navigate(viewInfo[key].path)}
                className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-ink outline-none transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand/30 md:w-full">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gray-100">
                  <Icon className="size-[18px]" />
                </span>
                {viewInfo[key].nav}
              </button>
            ))}
          </nav>
        </div>
        {/* Panel. Changing `key` replays the entrance animation on every tab switch. */}
        <div
          key={tab}
          id={`settings-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`settings-tab-${tab}`}
          className="st-panel min-w-0"
        >
          {tab === "profile" && <ProfilePanel {...panelProps} />}
          {tab === "preferences" && <PreferencesPanel {...panelProps} />}
          {tab === "columns" && (
            <ColumnsPanel
              {...panelProps}
              table={columnsTable}
              onTableChange={setColumnsTable}
            />
          )}
          {tab === "gateway" && <PaymentGatewayPanel />}
        </div>
      </div>

      {/* Floating save bar */}
      {(dirty || justSaved || saveError) && (
        <div
          key={barState}
          className="st-bar fixed bottom-6 left-1/2 z-40 flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white/95 py-2.5 pl-5 pr-2.5 shadow-[0_20px_40px_-16px_rgba(16,24,40,0.2)] ring-1 ring-black/5 backdrop-blur-xl"
        >
          {barState === "saved" ? (
            <span
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 pr-3 text-xs font-semibold text-emerald-600"
            >
              <span className="grid size-5 place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                <Check className="size-3" strokeWidth={3} />
              </span>
              Settings saved
            </span>
          ) : barState === "error" ? (
            <>
              <span
                role="alert"
                className="max-w-[280px] text-xs font-semibold text-red-600"
              >
                {saveError}
              </span>
              <button
                type="button"
                onClick={() => setSaveError(null)}
                className="h-9 rounded-xl px-3 text-xs font-semibold text-muted outline-none transition-[background-color,color,transform] duration-200 st-ease hover:bg-gray-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/30 active:scale-95"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => void onSave()}
                disabled={saving}
                className="inline-flex h-9 min-w-[96px] items-center justify-center gap-2 rounded-xl bg-brand px-4 text-xs font-semibold text-white shadow-sm outline-none transition-[transform,box-shadow,opacity] duration-200 st-ease hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand/40 active:translate-y-0 active:scale-95 disabled:opacity-70"
              >
                {saving ? "Retrying" : "Try again"}
              </button>
            </>
          ) : (
            <>
              <span
                role="status"
                aria-live="polite"
                className="text-xs font-semibold text-ink"
              >
                You have unsaved changes
              </span>
              <button
                type="button"
                onClick={() => {
                  setDraft(saved);
                  setSaveError(null);
                  setJustSaved(false);
                }}
                disabled={saving}
                className="h-9 rounded-xl px-3 text-xs font-semibold text-muted outline-none transition-[background-color,color,transform] duration-200 st-ease hover:bg-gray-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/30 active:scale-95 disabled:opacity-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => void onSave()}
                disabled={saving}
                aria-busy={saving}
                className="inline-flex h-9 min-w-[96px] items-center justify-center gap-2 rounded-xl bg-brand px-4 text-xs font-semibold text-white shadow-sm outline-none transition-[transform,box-shadow,opacity] duration-200 st-ease hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand/40 active:translate-y-0 active:scale-95 disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Saving
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
