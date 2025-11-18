type KPIProps = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export default function KPI({ title, value, subtitle }: KPIProps) {
  const formatted = typeof value === "number" ? value.toLocaleString() : value;
  return (
    <div className="bg-[#0e0e0e] rounded-md p-3 border border-white/5">
      <div className="text-sm opacity-60">{title}</div>
      <div className="text-2xl font-bold mt-2">{formatted}</div>
      {subtitle && <div className="text-xs opacity-60 mt-1">{subtitle}</div>}
    </div>
  );
}
