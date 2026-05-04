"use client";

import { useState } from "react";
import { Settings, Crown, Check, X, Zap, Minus } from "lucide-react";

const plans = [
  {
    id: "baslangic",
    name: "Başlangıç",
    badge: "Popüler",
    color: "border-blue-500",
    highlight: true,
    monthly: 499,
    yearly: 5489,
    yearlyMonthly: 457,
    features: [
      "10 bina",
      "Sınırsız daire",
      "PDF rapor & dışa aktarım",
      "Taksit takvimi",
      "Gelişmiş raporlar",
      "E-posta desteği",
    ],
    cta: "Başlangıç'a Geç",
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Premium",
    color: "border-amber-400",
    highlight: false,
    monthly: 999,
    yearly: 10989,
    yearlyMonthly: 916,
    features: [
      "Sınırsız bina",
      "Sınırsız daire",
      "PDF rapor & dışa aktarım",
      "Taksit takvimi & SMS hatırlatma",
      "WhatsApp bildirimleri",
      "Ekip hesabı & rol yönetimi",
      "API erişimi",
      "7/24 öncelikli destek",
    ],
    cta: "Pro'ya Geç",
  },
];

const tableRows = [
  { label: "Bina sayısı",              baslangic: "10 bina",     pro: "Sınırsız" },
  { label: "Daire sayısı",             baslangic: "Sınırsız",    pro: "Sınırsız" },
  { label: "PDF rapor & dışa aktarım", baslangic: true,          pro: true },
  { label: "Taksit takvimi",           baslangic: true,          pro: true },
  { label: "Gelişmiş raporlar",        baslangic: true,          pro: true },
  { label: "SMS hatırlatma",           baslangic: false,         pro: true },
  { label: "WhatsApp bildirimleri",    baslangic: false,         pro: true },
  { label: "Ekip hesabı & rol yönetimi", baslangic: false,       pro: true },
  { label: "API erişimi",              baslangic: false,         pro: true },
  { label: "Destek",                   baslangic: "E-posta",     pro: "7/24 Öncelikli" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR").format(n);
}

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-5 h-5 text-emerald-500 mx-auto" />;
  if (value === false) return <Minus className="w-4 h-4 text-slate-300 mx-auto" />;
  return <span className="text-sm font-medium text-slate-700">{value}</span>;
}

export default function SettingsPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Ayarlar</h1>
        <p className="text-slate-500 text-sm mt-1">Hesap ve abonelik yönetimi</p>
      </div>

      {/* Genel Ayarlar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-slate-600" />
          </div>
          <h2 className="font-semibold text-slate-800">Genel Ayarlar</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-700">Para Birimi</p>
              <p className="text-xs text-slate-400 mt-0.5">Tüm tutarlar bu para biriminde gösterilir</p>
            </div>
            <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">₺ TRY</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-700">Dil</p>
              <p className="text-xs text-slate-400 mt-0.5">Arayüz dili</p>
            </div>
            <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">Türkçe</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Uygulama Versiyonu</p>
              <p className="text-xs text-slate-400 mt-0.5">Mevcut sürüm</p>
            </div>
            <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">v1.0.0</span>
          </div>
        </div>
      </div>

      {/* Abonelik */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
            <Crown className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Abonelik Planları</h2>
            <p className="text-xs text-slate-400 mt-0.5">İhtiyacınıza uygun planı seçin</p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-slate-100 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                billing === "monthly" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
              }`}
            >
              Aylık
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                billing === "yearly" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
              }`}
            >
              Yıllık
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                1 ay hediye
              </span>
            </button>
          </div>
        </div>

        {/* Plan kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-5 ${plan.color} ${plan.highlight ? "bg-blue-50" : "bg-white"}`}
            >
              <span className={`absolute -top-3 left-5 text-xs font-bold px-3 py-1 rounded-full ${
                plan.highlight ? "bg-blue-600 text-white" : "bg-amber-400 text-white"
              }`}>
                {plan.badge}
              </span>

              <div className="flex items-center gap-2 mb-3 mt-1">
                <Zap className={`w-4 h-4 ${plan.highlight ? "text-blue-600" : "text-amber-500"}`} />
                <h3 className="font-bold text-slate-800">{plan.name}</h3>
              </div>

              {billing === "monthly" ? (
                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-900">₺{fmt(plan.monthly)}</span>
                  <span className="text-slate-400 text-sm"> / ay</span>
                </div>
              ) : (
                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-900">₺{fmt(plan.yearly)}</span>
                  <span className="text-slate-400 text-sm"> / yıl</span>
                  <div className="text-xs text-emerald-600 font-medium mt-1">
                    Aylık ₺{fmt(plan.yearlyMonthly)}'ye denk · 1 ay bedava
                  </div>
                </div>
              )}

              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => alert("Ödeme sistemi yakında aktif olacak!")}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-amber-500 hover:bg-amber-600 text-white"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Karşılaştırma tablosu */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-1/2">Özellik</th>
                <th className="text-center text-xs font-semibold text-blue-600 uppercase tracking-wide px-4 py-3 w-1/4">Başlangıç</th>
                <th className="text-center text-xs font-semibold text-amber-500 uppercase tracking-wide px-4 py-3 w-1/4">Pro</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="px-4 py-3 text-sm text-slate-600">{row.label}</td>
                  <td className="px-4 py-3 text-center"><Cell value={row.baslangic} /></td>
                  <td className="px-4 py-3 text-center"><Cell value={row.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-400 text-center mt-4">
          Tüm planlar 14 gün ücretsiz deneme içerir · İptal istediğiniz zaman
        </p>
      </div>
    </div>
  );
}
