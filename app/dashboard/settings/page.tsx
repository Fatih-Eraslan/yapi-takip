"use client";

import { Settings, Crown, Check } from "lucide-react";

const plans = [
  {
    name: "Ücretsiz",
    price: "₺0",
    period: "/ ay",
    current: true,
    features: ["1 bina", "20 daire", "Temel raporlar", "E-posta desteği"],
    cta: "Mevcut Plan",
    disabled: true,
    color: "border-slate-200",
    badge: "",
  },
  {
    name: "Pro",
    price: "₺299",
    period: "/ ay",
    current: false,
    features: ["10 bina", "Sınırsız daire", "Gelişmiş raporlar", "Öncelikli destek", "PDF dışa aktarım"],
    cta: "Yükselt",
    disabled: false,
    color: "border-blue-500",
    badge: "Popüler",
  },
  {
    name: "Kurumsal",
    price: "₺799",
    period: "/ ay",
    current: false,
    features: ["Sınırsız bina", "Sınırsız daire", "Ekip hesapları", "API erişimi", "7/24 destek", "Özel entegrasyon"],
    cta: "İletişime Geç",
    disabled: false,
    color: "border-slate-200",
    badge: "",
  },
];

export default function SettingsPage() {
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
            <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">v1.0.0 MVP</span>
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
            <h2 className="font-semibold text-slate-800">Abonelik</h2>
            <p className="text-xs text-slate-400 mt-0.5">Mevcut plan: Ücretsiz</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 p-5 ${plan.color} ${plan.name === "Pro" ? "bg-blue-50" : ""}`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              {plan.current && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Aktif
                </span>
              )}

              <h3 className="font-bold text-slate-800 mb-1">{plan.name}</h3>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-2xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-slate-400 text-sm mb-0.5">{plan.period}</span>
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.disabled}
                onClick={() => {
                  if (!plan.disabled) alert("Yakında aktif olacak! İletişim: destek@yapitakip.com");
                }}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  plan.disabled
                    ? "bg-slate-100 text-slate-400 cursor-default"
                    : plan.name === "Pro"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-slate-800 hover:bg-slate-900 text-white"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 text-center mt-4">
          Abonelik planları yakında aktif olacak. Sorularınız için destek@yapitakip.com
        </p>
      </div>
    </div>
  );
}
