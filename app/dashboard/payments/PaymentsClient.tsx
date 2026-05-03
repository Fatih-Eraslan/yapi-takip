"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard, Building2, ArrowDownCircle, Plus, X,
  Loader2, CheckCircle, User, Search,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  salePrice: number;
  apartment: {
    id: string;
    number: string;
    building: { id: string; name: string };
  };
  payments: { amount: number }[];
}

interface Payment {
  id: string;
  amount: number;
  type: string;
  date: string;
  note?: string | null;
  customer: { id: string; name: string };
  apartment: {
    id: string;
    number: string;
    buildingId: string;
    building: { id: string; name: string };
  };
}

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  DEPOSIT:     { label: "Kaparo",      color: "bg-amber-100 text-amber-700" },
  INSTALLMENT: { label: "Taksit",      color: "bg-blue-100 text-blue-700" },
  FULL:        { label: "Tam Ödeme",   color: "bg-emerald-100 text-emerald-700" },
  OTHER:       { label: "Diğer",       color: "bg-slate-100 text-slate-700" },
};

const PAYMENT_TYPES = Object.entries(PAYMENT_LABELS).map(([value, { label }]) => ({ value, label }));

const inputCls =
  "w-full px-3 py-3 text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white";

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);
}

export default function PaymentsClient({
  payments,
  totalIncome,
}: {
  payments: Payment[];
  totalIncome: number;
}) {
  const router = useRouter();
  const [showModal, setShowModal]         = useState(false);
  const [customers, setCustomers]         = useState<Customer[]>([]);
  const [loadingCust, setLoadingCust]     = useState(false);
  const [search, setSearch]               = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    type: "INSTALLMENT",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);

  async function openModal() {
    setShowModal(true);
    setLoadingCust(true);
    const res  = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(Array.isArray(data) ? data : []);
    setLoadingCust(false);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedCustomer(null);
    setSearch("");
    setForm({ type: "INSTALLMENT", amount: "", date: new Date().toISOString().split("T")[0], note: "" });
    setSuccess(false);
  }

  async function handleSubmit() {
    if (!selectedCustomer || !form.amount) return;
    setSaving(true);
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: selectedCustomer.id,
        apartmentId: selectedCustomer.apartment.id,
        type: form.type,
        amount: parseFloat(form.amount.replace(/\./g, "").replace(",", ".")),
        date: form.date,
        note: form.note || undefined,
      }),
    });
    setSaving(false);
    setSuccess(true);
    setTimeout(() => {
      closeModal();
      router.refresh();
    }, 1300);
  }

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.apartment.building.name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = payments.reduce<Record<string, Payment[]>>((acc, p) => {
    const month = new Date(p.date).toLocaleDateString("tr-TR", { year: "numeric", month: "long" });
    if (!acc[month]) acc[month] = [];
    acc[month].push(p);
    return acc;
  }, {});

  // Eğer müşteri seçildiyse kalan bakiye hesapla
  const paid      = selectedCustomer?.payments.reduce((s, p) => s + p.amount, 0) ?? 0;
  const remaining = selectedCustomer ? selectedCustomer.salePrice - paid : 0;

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ödemeler</h1>
          <p className="text-slate-500 text-sm mt-1">{payments.length} ödeme kaydı</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-right">
            <p className="text-xs text-emerald-600">Toplam Tahsilat</p>
            <p className="text-lg font-bold text-emerald-700">{fmt(totalIncome)}</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ödeme Ekle</span>
          </button>
        </div>
      </div>

      {/* ── Ödeme listesi ── */}
      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <CreditCard className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Henüz ödeme kaydı yok</h3>
          <p className="text-slate-400 text-sm mb-6">Daire satışı sonrası ödeme ekleyebilirsiniz</p>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            İlk Ödemeyi Ekle
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, monthPayments]) => {
            const monthTotal = monthPayments.reduce((s, p) => s + p.amount, 0);
            return (
              <div key={month}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-slate-600 text-sm uppercase tracking-wide">{month}</h2>
                  <span className="text-emerald-600 font-bold text-sm">{fmt(monthTotal)}</span>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                  {monthPayments.map((p) => {
                    const pt = PAYMENT_LABELS[p.type] ?? PAYMENT_LABELS.OTHER;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-slate-800 text-sm">{p.customer.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pt.color}`}>
                              {pt.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            <Link
                              href={`/dashboard/buildings/${p.apartment.buildingId}`}
                              className="hover:text-blue-500 transition-colors"
                            >
                              {p.apartment.building.name} — Daire {p.apartment.number}
                            </Link>
                          </div>
                          {p.note && <p className="text-xs text-slate-400 mt-0.5 italic">{p.note}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-emerald-600">{fmt(p.amount)}</p>
                          <p className="text-xs text-slate-400">{new Date(p.date).toLocaleDateString("tr-TR")}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="font-bold text-slate-800 text-lg">Manuel Ödeme Ekle</h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* İçerik */}
            <div className="flex-1 overflow-y-auto p-5">
              {success ? (
                <div className="flex flex-col items-center py-14 gap-3">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                  </div>
                  <p className="text-emerald-600 font-bold text-xl">Ödeme Kaydedildi!</p>
                  <p className="text-slate-400 text-sm">Liste güncelleniyor...</p>
                </div>
              ) : (
                <div className="space-y-4">

                  {/* Müşteri seçimi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                      Müşteri Seç <span className="text-red-500">*</span>
                    </label>

                    {selectedCustomer ? (
                      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{selectedCustomer.name}</p>
                            <p className="text-xs text-slate-400">
                              {selectedCustomer.apartment.building.name} — Daire {selectedCustomer.apartment.number}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedCustomer(null)}
                          className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="relative mb-2">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Müşteri adı veya bina ara..."
                            className="w-full pl-9 pr-3 py-3 text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                          />
                        </div>
                        {loadingCust ? (
                          <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Müşteriler yükleniyor...</span>
                          </div>
                        ) : filtered.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-sm">
                            {search ? "Eşleşen müşteri bulunamadı" : "Henüz müşteri kaydı yok"}
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {filtered.map((c) => {
                              const custPaid = c.payments.reduce((s, p) => s + p.amount, 0);
                              const pct = c.salePrice > 0 ? Math.min((custPaid / c.salePrice) * 100, 100) : 0;
                              return (
                                <button
                                  key={c.id}
                                  onClick={() => setSelectedCustomer(c)}
                                  className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-blue-200 transition-all"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <User className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-slate-800 text-sm truncate">{c.name}</p>
                                      <p className="text-xs text-slate-400 truncate">
                                        {c.apartment.building.name} — D.{c.apartment.number}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className="w-12 bg-slate-200 rounded-full h-1.5">
                                      <div
                                        className="bg-emerald-500 h-1.5 rounded-full"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">{pct.toFixed(0)}%</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Kalan bakiye bilgisi */}
                  {selectedCustomer && (
                    <div className="bg-slate-50 rounded-xl p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Satış Fiyatı</p>
                        <p className="text-sm font-bold text-slate-700">{fmt(selectedCustomer.salePrice)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Tahsil Edildi</p>
                        <p className="text-sm font-bold text-emerald-600">{fmt(paid)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Kalan</p>
                        <p className={`text-sm font-bold ${remaining > 0 ? "text-red-500" : "text-emerald-600"}`}>
                          {fmt(remaining)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Ödeme tipi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Ödeme Tipi
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                      className={inputCls}
                    >
                      {PAYMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tutar */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Tutar (₺) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.amount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setForm((f) => ({
                          ...f,
                          amount: raw ? Number(raw).toLocaleString("tr-TR") : "",
                        }));
                      }}
                      placeholder="500.000"
                      className={inputCls}
                    />
                  </div>

                  {/* Tarih */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Tarih <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  {/* Not */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Not</label>
                    <input
                      type="text"
                      value={form.note}
                      onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                      placeholder="Açıklama (opsiyonel)"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer buton */}
            {!success && (
              <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0">
                <button
                  onClick={handleSubmit}
                  disabled={saving || !selectedCustomer || !form.amount}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3.5 rounded-xl text-base font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Kaydediliyor..." : "Ödemeyi Kaydet"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
