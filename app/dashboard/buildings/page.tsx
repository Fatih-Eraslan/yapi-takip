import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, Plus, MapPin, Layers, ChevronRight } from "lucide-react";

export default async function BuildingsPage() {
  const session = await auth();
  const buildings = await prisma.building.findMany({
    where: { userId: session!.user!.id as string },
    include: { apartments: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Binalar</h1>
          <p className="text-slate-500 text-sm mt-1">{buildings.length} bina kayıtlı</p>
        </div>
        <Link
          href="/dashboard/buildings/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Yeni Bina
        </Link>
      </div>

      {buildings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Henüz bina eklenmedi</h3>
          <p className="text-slate-400 text-sm mb-6">İlk binayı ekleyerek başlayın</p>
          <Link
            href="/dashboard/buildings/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            İlk Binayı Ekle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {buildings.map((b) => {
            const total = b.apartments.length;
            const sold = b.apartments.filter((a) => a.status === "SOLD").length;
            const reserved = b.apartments.filter((a) => a.status === "RESERVED").length;
            const available = total - sold - reserved;
            const pct = total > 0 ? (sold / total) * 100 : 0;

            return (
              <Link key={b.id} href={`/dashboard/buildings/${b.id}`}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
                  {b.image ? (
                    <img src={b.image} alt={b.name} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Building2 className="w-16 h-16 text-white/40" />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {b.name}
                        </h3>
                        <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {b.city}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors mt-0.5" />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                      <Layers className="w-3.5 h-3.5" />
                      {b.floorCount} kat • {total} daire
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label: "Satıldı", value: sold, color: "text-red-600 bg-red-50" },
                        { label: "Rezerve", value: reserved, color: "text-amber-600 bg-amber-50" },
                        { label: "Müsait", value: available, color: "text-emerald-600 bg-emerald-50" },
                      ].map((s) => (
                        <div key={s.label} className={`rounded-lg px-2 py-1.5 text-center ${s.color}`}>
                          <p className="font-bold text-base leading-none">{s.value}</p>
                          <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Doluluk</span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
