import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Users, Phone, Mail, Building2, MapPin, CreditCard } from "lucide-react";
import Link from "next/link";

export default async function CustomersPage() {
  const session = await auth();
  const customers = await prisma.customer.findMany({
    where: { apartment: { building: { userId: session!.user!.id as string } } },
    include: {
      apartment: { include: { building: true } },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  function fmt(n: number) {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Müşteriler</h1>
        <p className="text-slate-500 text-sm mt-1">{customers.length} müşteri kayıtlı</p>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Henüz müşteri yok</h3>
          <p className="text-slate-400 text-sm">Daire satışı yapınca müşteriler burada görünür</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {customers.map((c) => {
            const paid = c.payments.reduce((s, p) => s + p.amount, 0);
            const remaining = c.salePrice - paid;
            const pct = c.salePrice > 0 ? (paid / c.salePrice) * 100 : 0;

            return (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-700 font-bold text-lg">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{c.name}</h3>
                      <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                        <Building2 className="w-3 h-3" />
                        {c.apartment.building.name} — Daire {c.apartment.number}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/buildings/${c.apartment.buildingId}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Daireye Git →
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {c.phone}
                  </div>
                  {c.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Satış Fiyatı</span>
                    <span className="font-semibold text-slate-700">{fmt(c.salePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tahsilat</span>
                    <span className="font-semibold text-emerald-600">{fmt(paid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Kalan</span>
                    <span className={`font-semibold ${remaining > 0 ? "text-red-500" : "text-emerald-600"}`}>
                      {fmt(remaining)}
                    </span>
                  </div>
                  <div className="bg-slate-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                {c.saleDate && (
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    Satış: {new Date(c.saleDate).toLocaleDateString("tr-TR")}
                  </p>
                )}

                {c.notes && (
                  <p className="text-xs text-slate-400 mt-1 italic">"{c.notes}"</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
