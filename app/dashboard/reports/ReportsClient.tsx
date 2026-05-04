"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface Props {
  chartData: { month: string; amount: number }[];
  buildingStats: { name: string; sold: number; reserved: number; available: number }[];
  statusData: { name: string; value: number; color: string }[];
  totalRevenue: number;
  totalCollected: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v);

const fmtCompact = (v: number) =>
  new Intl.NumberFormat("tr-TR", { notation: "compact" }).format(v);

const RADIAN = Math.PI / 180;
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function ReportsClient({ chartData, buildingStats, statusData, totalRevenue, totalCollected }: Props) {
  const remaining = totalRevenue - totalCollected;
  const collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">

      {/* Daire Durumu + Tahsilat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Donut */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-800 mb-4 text-sm">Daire Durumu Dağılımı</h2>
          {statusData.every((s) => s.value === 0) ? (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm">Henüz daire yok</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie
                    data={statusData.filter((s) => s.value > 0)}
                    cx="50%" cy="50%"
                    innerRadius={42} outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={CustomLabel}
                  >
                    {statusData.filter((s) => s.value > 0).map((s, i) => (
                      <Cell key={i} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${v} daire`, ""]}
                    contentStyle={{ borderRadius: "12px", fontSize: 12, border: "1px solid #e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 flex-1">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-slate-600">{s.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gelir & Tahsilat */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-800 mb-4 text-sm">Gelir & Tahsilat</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Tahsilat Oranı</span>
                <span className="font-bold text-slate-700">{collectionRate.toFixed(1)}%</span>
              </div>
              <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
                  style={{ width: `${Math.min(collectionRate, 100)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 mt-2">
              {[
                { label: "Toplam Satış", value: fmt(totalRevenue), color: "text-slate-700", bg: "bg-slate-50" },
                { label: "Tahsil Edilen", value: fmt(totalCollected), color: "text-emerald-700", bg: "bg-emerald-50" },
                { label: "Kalan Bakiye", value: fmt(remaining), color: "text-red-600", bg: "bg-red-50" },
              ].map((item) => (
                <div key={item.label} className={`${item.bg} rounded-xl px-4 py-3 flex justify-between items-center`}>
                  <span className="text-xs text-slate-500">{item.label}</span>
                  <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Aylık Tahsilat Trendi */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-800 mb-4 text-sm">Aylık Tahsilat Trendi</h2>
        {chartData.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center text-slate-300 gap-2">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <span className="text-sm">Ödeme girilince grafik burada görünecek</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={fmtCompact} />
              <Tooltip
                formatter={(v) => [fmt(Number(v)), "Tahsilat"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2.5}
                fill="url(#areaGrad)" dot={{ r: 4, fill: "#2563eb" }} activeDot={{ r: 6 }} name="Tahsilat" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bina Bazında Performans */}
      {buildingStats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-800 mb-4 text-sm">Bina Bazında Satış Performansı</h2>
          <ResponsiveContainer width="100%" height={Math.max(buildingStats.length * 60, 180)}>
            <BarChart data={buildingStats} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#475569" }} width={90} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="sold" name="Satıldı" fill="#ef4444" stackId="a" />
              <Bar dataKey="reserved" name="Rezerve" fill="#f59e0b" stackId="a" />
              <Bar dataKey="available" name="Müsait" fill="#10b981" radius={[0, 4, 4, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
