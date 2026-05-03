import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BarChart3, TrendingUp, Building2, Users, CreditCard, Home } from "lucide-react";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const session = await auth();
  const userId = session!.user!.id as string;

  const [buildings, customers, payments] = await Promise.all([
    prisma.building.findMany({
      where: { userId },
      include: { apartments: true },
    }),
    prisma.customer.findMany({
      where: { apartment: { building: { userId } } },
      include: { payments: true, apartment: { include: { building: true } } },
    }),
    prisma.payment.findMany({
      where: { apartment: { building: { userId } } },
      include: { apartment: { include: { building: true } } },
      orderBy: { date: "asc" },
    }),
  ]);

  const totalApts = buildings.reduce((s, b) => s + b.apartments.length, 0);
  const soldApts = buildings.reduce((s, b) => s + b.apartments.filter((a) => a.status === "SOLD").length, 0);
  const reservedApts = buildings.reduce((s, b) => s + b.apartments.filter((a) => a.status === "RESERVED").length, 0);
  const totalRevenue = customers.reduce((s, c) => s + c.salePrice, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);

  const buildingStats = buildings.map((b) => ({
    name: b.name,
    total: b.apartments.length,
    sold: b.apartments.filter((a) => a.status === "SOLD").length,
    reserved: b.apartments.filter((a) => a.status === "RESERVED").length,
    available: b.apartments.filter((a) => a.status === "AVAILABLE").length,
    revenue: customers
      .filter((c) => c.apartment.buildingId === b.id)
      .reduce((s, c) => s + c.salePrice, 0),
    collected: payments
      .filter((p) => p.apartment.buildingId === b.id)
      .reduce((s, p) => s + p.amount, 0),
  }));

  const monthlyData = payments.reduce<Record<string, number>>((acc, p) => {
    const month = new Date(p.date).toLocaleDateString("tr-TR", { year: "numeric", month: "short" });
    acc[month] = (acc[month] || 0) + p.amount;
    return acc;
  }, {});

  const chartData = Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }));

  function fmt(n: number) {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);
  }

  const summaryCards = [
    { label: "Toplam Bina", value: buildings.length.toString(), icon: Building2, color: "bg-blue-600" },
    { label: "Toplam Daire", value: totalApts.toString(), icon: Home, color: "bg-indigo-600" },
    { label: "Satılan Daire", value: `${soldApts} (${totalApts > 0 ? ((soldApts / totalApts) * 100).toFixed(0) : 0}%)`, icon: TrendingUp, color: "bg-emerald-600" },
    { label: "Müşteri Sayısı", value: customers.length.toString(), icon: Users, color: "bg-violet-600" },
    { label: "Toplam Gelir", value: fmt(totalRevenue), icon: CreditCard, color: "bg-amber-600" },
    { label: "Tahsil Edilen", value: fmt(totalCollected), icon: CreditCard, color: "bg-green-600" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Raporlar</h1>
        <p className="text-slate-500 text-sm mt-1">Satış ve gelir özeti</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {summaryCards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className={`inline-flex p-2.5 rounded-xl ${c.color} mb-3`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-bold text-slate-800 leading-tight">{c.value}</p>
            <p className="text-slate-500 text-sm mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Building breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Bina Bazında Özet
          </h2>
          {buildingStats.length === 0 ? (
            <p className="text-slate-400 text-sm">Henüz bina yok</p>
          ) : (
            <div className="space-y-4">
              {buildingStats.map((b) => (
                <div key={b.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-slate-700 truncate">{b.name}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{b.sold}/{b.total} satıldı</span>
                  </div>
                  <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-slate-100">
                    <div className="bg-red-400 transition-all" style={{ width: `${b.total > 0 ? (b.sold / b.total) * 100 : 0}%` }} />
                    <div className="bg-amber-400 transition-all" style={{ width: `${b.total > 0 ? (b.reserved / b.total) * 100 : 0}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{fmt(b.collected)} tahsilat</span>
                    <span>{fmt(b.revenue)} beklenen</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daire durumu dağılımı */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Daire Durumu Dağılımı
          </h2>
          <div className="space-y-4">
            {[
              { label: "Satıldı", value: soldApts, color: "bg-red-500", pct: totalApts > 0 ? (soldApts / totalApts) * 100 : 0 },
              { label: "Rezerve", value: reservedApts, color: "bg-amber-500", pct: totalApts > 0 ? (reservedApts / totalApts) * 100 : 0 },
              { label: "Müsait", value: totalApts - soldApts - reservedApts, color: "bg-emerald-500", pct: totalApts > 0 ? ((totalApts - soldApts - reservedApts) / totalApts) * 100 : 0 },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-600">{s.label}</span>
                  <span className="font-semibold text-slate-700">{s.value} daire ({s.pct.toFixed(0)}%)</span>
                </div>
                <div className="bg-slate-100 rounded-full h-3">
                  <div className={`${s.color} h-3 rounded-full transition-all`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 mt-6 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Kalan Bakiye</span>
              <span className="font-bold text-red-500">{fmt(totalRevenue - totalCollected)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tahsilat Oranı</span>
              <span className="font-bold text-emerald-600">
                {totalRevenue > 0 ? ((totalCollected / totalRevenue) * 100).toFixed(1) : "0"}%
              </span>
            </div>
          </div>
        </div>

        {/* Aylık tahsilat */}
        {chartData.length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Aylık Tahsilat
            </h2>
            <ReportsClient chartData={chartData} />
          </div>
        )}
      </div>
    </div>
  );
}
