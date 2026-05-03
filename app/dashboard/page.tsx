import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, Users, CreditCard, TrendingUp, Plus } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id as string;

  const [buildings, customers, payments] = await Promise.all([
    prisma.building.findMany({
      where: { userId },
      include: { apartments: true },
    }),
    prisma.customer.findMany({
      where: { apartment: { building: { userId } } },
      include: { payments: true },
    }),
    prisma.payment.findMany({
      where: { apartment: { building: { userId } } },
    }),
  ]);

  const totalApts = buildings.reduce((s, b) => s + b.apartments.length, 0);
  const soldApts = buildings.reduce(
    (s, b) => s + b.apartments.filter((a) => a.status === "SOLD").length,
    0
  );
  const reservedApts = buildings.reduce(
    (s, b) => s + b.apartments.filter((a) => a.status === "RESERVED").length,
    0
  );
  const totalIncome = payments.reduce((s, p) => s + p.amount, 0);
  const expectedIncome = customers.reduce((s, c) => s + c.salePrice, 0);
  const collectedRatio = expectedIncome > 0 ? (totalIncome / expectedIncome) * 100 : 0;

  const stats = [
    {
      label: "Toplam Bina",
      value: buildings.length,
      icon: Building2,
      color: "bg-blue-600",
      href: "/dashboard/buildings",
    },
    {
      label: "Satılan Daire",
      value: `${soldApts} / ${totalApts}`,
      icon: TrendingUp,
      color: "bg-emerald-600",
      href: "/dashboard/buildings",
    },
    {
      label: "Müşteri",
      value: customers.length,
      icon: Users,
      color: "bg-violet-600",
      href: "/dashboard/customers",
    },
    {
      label: "Tahsilat",
      value: formatCurrency(totalIncome),
      icon: CreditCard,
      color: "bg-amber-600",
      href: "/dashboard/payments",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Hoş geldiniz, {session!.user!.name}</p>
        </div>
        <Link
          href="/dashboard/buildings/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni Bina</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className={`inline-flex p-2.5 rounded-xl ${s.color} mb-3`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-slate-500 text-sm mt-0.5">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bina listesi */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Binalar</h2>
            <Link href="/dashboard/buildings" className="text-blue-600 text-sm hover:underline">
              Tümünü gör
            </Link>
          </div>
          {buildings.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Henüz bina eklenmemiş</p>
              <Link
                href="/dashboard/buildings/new"
                className="text-blue-600 text-sm hover:underline mt-1 inline-block"
              >
                İlk binayı ekle →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {buildings.slice(0, 5).map((b) => {
                const sold = b.apartments.filter((a) => a.status === "SOLD").length;
                const total = b.apartments.length;
                const pct = total > 0 ? (sold / total) * 100 : 0;
                return (
                  <Link key={b.id} href={`/dashboard/buildings/${b.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">{b.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 flex-shrink-0">
                            {sold}/{total}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Özet */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Satış Özeti</h2>
          <div className="space-y-4">
            <SummaryRow label="Toplam Daire" value={totalApts.toString()} color="text-slate-700" />
            <SummaryRow label="Satıldı" value={soldApts.toString()} color="text-emerald-600" />
            <SummaryRow label="Rezerve" value={reservedApts.toString()} color="text-amber-600" />
            <SummaryRow
              label="Müsait"
              value={(totalApts - soldApts - reservedApts).toString()}
              color="text-blue-600"
            />
            <div className="border-t border-slate-100 pt-4">
              <SummaryRow
                label="Beklenen Gelir"
                value={formatCurrency(expectedIncome)}
                color="text-slate-700"
              />
              <SummaryRow
                label="Tahsil Edilen"
                value={formatCurrency(totalIncome)}
                color="text-emerald-600"
              />
              <SummaryRow
                label="Kalan Bakiye"
                value={formatCurrency(expectedIncome - totalIncome)}
                color="text-red-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Tahsilat Oranı</span>
                <span>{collectedRatio.toFixed(1)}%</span>
              </div>
              <div className="bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(collectedRatio, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className={`font-semibold text-sm ${color}`}>{value}</span>
    </div>
  );
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);
}
