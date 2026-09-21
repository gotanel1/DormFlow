import { X, type LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

/* ---------- Card ---------- */
export function Card({
  title,
  desc,
  actions,
  children,
  className = "",
  noPad = false,
}: {
  title?: string;
  desc?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
}) {
  return (
    <div className={`rounded-md border border-line bg-white shadow-[0_2px_2px_rgba(8,7,7,0.04)] ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            {title && <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{title}</h2>}
            {desc && <p className="mt-0.5 text-xs text-ink-soft">{desc}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPad ? "" : "p-4"}>{children}</div>
    </div>
  );
}

/* ---------- Badge ---------- */
const TONES = {
  gray: "bg-gray-100 text-ink-soft",
  blue: "bg-brand-soft text-brand-dark",
  green: "bg-success-soft text-success",
  red: "bg-danger-soft text-danger",
  amber: "bg-warn-soft text-warn",
};

export function Badge({
  tone = "gray",
  children,
  dot = false,
}: {
  tone?: keyof typeof TONES;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ---------- Button ---------- */
export function Btn({
  variant = "neutral",
  size = "md",
  icon: Icon,
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "brand" | "neutral" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: LucideIcon;
}) {
  const variants = {
    brand: "bg-brand text-white border-transparent hover:bg-brand-dark",
    neutral: "bg-white text-ink-soft border-line-strong hover:bg-gray-50 hover:text-ink",
    ghost: "bg-transparent text-brand border-transparent hover:bg-brand-soft",
    danger: "bg-white text-danger border-line-strong hover:bg-danger-soft",
  };
  const sizes = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3.5 py-1.5 text-sm",
  };
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium transition disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={size === "sm" ? 13 : 15} />}
      {children}
    </button>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({
  title,
  desc,
  actions,
}: {
  title: string;
  desc?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-bold text-ink">{title}</h1>
        {desc && <p className="mt-0.5 text-sm text-ink-soft">{desc}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Table ---------- */
export function Th({
  children,
  right = false,
  className = "",
}: {
  children?: React.ReactNode;
  right?: boolean;
  className?: string;
}) {
  return (
    <th className={`whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-soft ${right ? "text-right" : ""} ${className}`}>
      {children}
    </th>
  );
}

export function Td({
  children,
  right = false,
  className = "",
}: {
  children?: React.ReactNode;
  right?: boolean;
  className?: string;
}) {
  return <td className={`whitespace-nowrap px-4 py-2.5 text-sm ${right ? "text-right" : ""} ${className}`}>{children}</td>;
}

export function Row({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <tr className={`border-t border-line transition-colors hover:bg-[#f9f9f9] ${className}`}>{children}</tr>;
}

/* ---------- KPI Stat ---------- */
export function Stat({
  label,
  value,
  delta,
  up = true,
  icon: Icon,
  note,
}: {
  label: string;
  value: string;
  delta?: string;
  up?: boolean;
  icon: LucideIcon;
  note?: string;
}) {
  return (
    <div className="rounded-md border border-line bg-white p-4 shadow-[0_2px_2px_rgba(8,7,7,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{label}</p>
          <p className="mt-1 text-[26px] font-bold leading-7 text-ink">{value}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            {delta && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? "text-success" : "text-danger"}`}>
                {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {delta}
              </span>
            )}
            {note && <span className="truncate text-xs text-ink-soft">{note}</span>}
          </div>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Tabs ---------- */
export function Tabs({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-md bg-gray-200/80 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition ${
            value === o.id ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
          }`}
        >
          {o.label}
          {o.count != null && <span className={`ml-1.5 text-xs ${value === o.id ? "text-ink-soft" : "text-ink-soft/70"}`}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Form ---------- */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-md border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-brand focus:ring-2 focus:ring-brand/20";

/* ---------- Modal (controlled) ---------- */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <h2 className="text-[15px] font-bold text-ink">{title}</h2>
            {subtitle && <p className="text-xs text-ink-soft">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded p-1 text-ink-soft transition hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 rounded-b-lg border-t border-line bg-page/60 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const init = name.replace(/[^ก-ฮ]/g, "").charAt(0) || name.charAt(0);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#032d60] font-semibold text-white ${
        size === "md" ? "h-8 w-8 text-xs" : "h-6 w-6 text-[10px]"
      }`}
    >
      {init}
    </span>
  );
}