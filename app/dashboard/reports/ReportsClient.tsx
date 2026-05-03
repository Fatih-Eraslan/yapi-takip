"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  chartData: { month: string; amount: number }[];
}

export default function ReportsClient({ chartData }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickFormatter={(v) =>
            new Intl.NumberFormat("tr-TR", { notation: "compact", currency: "TRY" }).format(v)
          }
        />
        <Tooltip
          formatter={(v) =>
            new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(v))
          }
          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
        />
        <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} name="Tahsilat" />
      </BarChart>
    </ResponsiveContainer>
  );
}
