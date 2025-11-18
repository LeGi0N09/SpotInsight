import React from "react";

type KPIProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
};

function formatValue(v: string | number) {
  return typeof v === "number" ? v.toLocaleString() : v;
}

export default function KPI({ title, value, subtitle, change }: KPIProps) {
  return (
    <div className="bg-[#0e0e0e] rounded-md p-3 border border-white/5">
      <div className="text-sm opacity-60">{title}</div>
      <div className="text-2xl font-bold mt-2">{formatValue(value)}</div>
      {subtitle && <div className="text-xs opacity-60 mt-1">{subtitle}</div>}
      {change && <div className="text-sm text-green-400 mt-2">{change}</div>}
    </div>
  );
}
