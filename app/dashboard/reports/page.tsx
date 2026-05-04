import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Building2, TrendingUp, Users, CreditCard, Home } from "lucide-react";
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
  const availableApts = totalApts - soldApts - reservedApts;
  const totalRevenue = customers.reduce((s, c) => s + c.salePrice, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);

  const buildingStats = buildings.map((b) => ({
    name: b.name,
    sold: b.apartments.filter((a) => a.status === "SOLD").length,
    reserved: b.apartments.filter((a) => a.status === "RESERVED").length,
    available: b.apartments.filter((a) => a.status === "AVAILABLE").length,
  }));

  const statusData = [
    { name: "Satıldı", value: soldApts, color: "#ef4444" },
    { name: "Rezerve", value: reservedApts, color: "#f59e0b" },
    { name: "Müsait", value: availableApts, color: "#10b981" },
  ];

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

      <ReportsClient
        chartData={chartData}
        buildingStats={buildingStats}
        statusData={statusData}
        totalRevenue={totalRevenue}
        totalCollected={totalCollected}
      />
    </div>
  );
}
