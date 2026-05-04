"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Grid3x3, Boxes, X,
  User, Phone, Mail, CreditCard, Loader2, CheckCircle, Trash2,
} from "lucide-react";
import type { Apartment, Building } from "@/lib/types";

const Building3D = dynamic(() => import("@/components/Building3D"), { ssr: false });

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  AVAILABLE: { label: "Müsait",  color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500" },
  SOLD:      { label: "Satıldı", color: "text-red-700",     bg: "bg-red-100",     dot: "bg-red-500" },
  RESERVED:  { label: "Rezerve", color: "text-amber-700",   bg: "bg-amber-100",   dot: "bg-amber-500" },
  RENTED:    { label: "Kiralık", color: "text-violet-700",  bg: "bg-violet-100",  dot: "bg-violet-500" },
};

const PAYMENT_TYPES = [
  { value: "DEPOSIT",     label: "Kaparo" },
  { value: "INSTALLMENT", label: "Taksit" },
  { value: "FULL",        label: "Tam Ödeme" },
  { value: "OTHER",       label: "Diğer" },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);

// input class: text-base önler iOS zoom
const inputCls =
  "w-full px-3 py-3 text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white";

export default function BuildingDetailClient({ building: initial }: { building: Building }) {
  const router = useRouter();
  const [building, setBuilding]     = useState(initial);
  const [view, setView]             = useState<"3d" | "grid">("3d");
  const [selectedApt, setSelectedApt] = useState<Apartment | null>(null);
  const [panel, setPanel]           = useState<"detail" | "addCustomer" | "addPayment">("detail");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDeleteBuilding() {
    setDeleteLoading(true);
    await fetch(`/api/buildings/${building.id}`, { method: "DELETE" });
    router.push("/dashboard/buildings");
  }
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);

  const [customerForm, setCustomerForm] = useState({
    name: "", phone: "", email: "", idNumber: "",
    address: "", saleDate: "", salePrice: "", notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "", type: "DEPOSIT",
    date: new Date().toISOString().split("T")[0], note: "",
  });

  const stats = {
    total:    building.apartments.length,
    sold:     building.apartments.filter((a) => a.status === "SOLD").length,
    reserved: building.apartments.filter((a) => a.status === "RESERVED").length,
    available: building.apartments.filter((a) => a.status === "AVAILABLE").length,
  };

  async function handleStatusChange(aptId: string, status: string) {
    await fetch(`/api/apartments/${aptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await refreshBuilding();
  }

  async function handleAddCustomer() {
    if (!selectedApt) return;
    setLoading(true);
    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apartmentId: selectedApt.id,
        ...customerForm,
        salePrice: parseFloat(customerForm.salePrice.replace(/\./g, "").replace(",", ".")),
        saleDate: customerForm.saleDate || null,
      }),
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setPanel("detail"); }, 1400);
    await refreshBuilding();
  }

  async function handleAddPayment() {
    if (!selectedApt?.customer) return;
    setLoading(true);
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: selectedApt.customer.id,
        apartmentId: selectedApt.id,
        ...paymentForm,
        amount: parseFloat(paymentForm.amount.replace(/\./g, "").replace(",", ".")),
      }),
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setPanel("detail"); }, 1400);
    await refreshBuilding();
  }

  async function refreshBuilding() {
    const res  = await fetch(`/api/buildings/${building.id}`);
    const data = await res.json();
    setBuilding(data);
    if (selectedApt) {
      const updated = data.apartments.find((a: Apartment) => a.id === selectedApt.id);
      if (updated) setSelectedApt(updated);
    }
  }

  function openApt(apt: Apartment) {
    setSelectedApt(apt);
    setPanel("detail");
    setSuccess(false);
  }

  const floors    = Array.from({ length: building.floorCount }, (_, i) => building.floorCount - i);
  const totalPaid = selectedApt?.payments?.reduce((s, p) => s + p.amount, 0) ?? 0;
  const remaining = (selectedApt?.customer?.salePrice ?? 0) - totalPaid;
  const pctPaid   = selectedApt?.customer?.salePrice
    ? Math.min((totalPaid / selectedApt.customer.salePrice) * 100, 100)
    : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-2rem)] -m-4 md:-m-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 md:px-6 py-3 bg-white border-b border-slate-100 flex-shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/dashboard/buildings" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {building.image ? (
            <img src={building.image} alt={building.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-slate-800 text-sm leading-none truncate">{building.name}</h1>
            <p className="text-slate-400 text-xs mt-0.5 truncate">{building.city}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {(["3d", "grid"] as const).map((id) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                view === id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {id === "3d" ? <Boxes className="w-3.5 h-3.5" /> : <Grid3x3 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{id === "3d" ? "3D" : "Liste"}</span>
            </button>
          ))}
          <button
            onClick={() => setDeleteConfirm(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sil</span>
          </button>
        </div>

        {/* Silme onay modalı */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Binayı Sil</h3>
              <p className="text-slate-500 text-sm text-center mb-6">
                <strong>{building.name}</strong> binası ve tüm daire, müşteri ve ödeme kayıtları silinecek. Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteBuilding}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50"
                >
                  {deleteLoading ? "Siliniyor..." : "Evet, Sil"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-0 px-3 md:px-6 py-2 bg-white border-b border-slate-100 flex-shrink-0">
        {[
          { label: "Toplam",  value: stats.total,    dot: "bg-slate-400" },
          { label: "Satıldı", value: stats.sold,      dot: "bg-red-500" },
          { label: "Rezerve", value: stats.reserved,  dot: "bg-amber-500" },
          { label: "Müsait",  value: stats.available, dot: "bg-emerald-500" },
        ].map((s, i) => (
          <div key={s.label} className={`flex items-center gap-1.5 flex-1 ${i > 0 ? "border-l border-slate-100 pl-2 ml-2" : ""}`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
            <span className="font-bold text-slate-800 text-sm">{s.value}</span>
            <span className="text-slate-400 text-xs hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Main ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Bina görünümü */}
        <div className={`flex-1 overflow-hidden ${selectedApt ? "hidden md:block" : ""}`}>
          {view === "3d" ? (
            <Building3D building={building} onApartmentClick={openApt} />
          ) : (
            <div className="h-full overflow-y-auto p-3 md:p-4">
              <div className="space-y-3 max-w-2xl mx-auto">
                {floors.map((floor) => (
                  <div key={floor} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                      <span className="text-sm font-semibold text-slate-600">{floor}. Kat</span>
                    </div>
                    <div className="p-2.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {building.apartments.filter((a) => a.floor === floor).map((apt) => {
                        const s = STATUS_LABELS[apt.status];
                        return (
                          <button
                            key={apt.id}
                            onClick={() => openApt(apt)}
                            className={`p-3 rounded-xl border-2 text-left transition-all active:scale-95 ${
                              selectedApt?.id === apt.id
                                ? "border-blue-500 bg-blue-50 shadow-md"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                              <p className="font-bold text-slate-800 text-sm">D.{apt.number}</p>
                            </div>
                            <p className="text-xs text-slate-500">{apt.type}{apt.size ? ` • ${apt.size}m²` : ""}</p>
                            {apt.customer && (
                              <p className="text-xs text-slate-400 mt-1 truncate">{apt.customer.name}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Daire detay paneli ──
            Mobilde: tam ekran overlay
            Masaüstünde: sağ sidebar
        */}
        {selectedApt && (
          <div className="absolute inset-0 md:relative md:inset-auto md:w-96 bg-white md:border-l md:border-slate-100 flex flex-col z-20 md:z-auto overflow-hidden">

            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 flex-shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full ${STATUS_LABELS[selectedApt.status]?.dot}`} />
                <div>
                  <h2 className="font-bold text-slate-800 leading-none">Daire {selectedApt.number}</h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {selectedApt.type}{selectedApt.size ? ` • ${selectedApt.size}m²` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApt(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 -mr-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel içerik */}
            <div className="flex-1 overflow-y-auto">

              {/* DETAY paneli */}
              {panel === "detail" && (
                <div className="p-4 space-y-4">

                  {/* Durum seçimi */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Durum Değiştir</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(STATUS_LABELS).map(([status, { label, bg, color, dot }]) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(selectedApt.id, status)}
                          className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                            selectedApt.status === status
                              ? `${bg} ${color} ring-2 ring-inset ring-current`
                              : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fiyat */}
                  {selectedApt.price && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-xs text-blue-600 font-semibold mb-1">Liste Fiyatı</p>
                      <p className="text-xl font-bold text-blue-800">{fmt(selectedApt.price)}</p>
                    </div>
                  )}

                  {/* Müşteri bilgileri */}
                  {selectedApt.customer ? (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Alıcı</p>
                      <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                        <InfoRow icon={<User className="w-4 h-4" />} value={selectedApt.customer.name} bold />
                        <InfoRow icon={<Phone className="w-4 h-4" />} value={selectedApt.customer.phone} href={`tel:${selectedApt.customer.phone}`} />
                        {selectedApt.customer.email && (
                          <InfoRow icon={<Mail className="w-4 h-4" />} value={selectedApt.customer.email} />
                        )}
                        <InfoRow icon={<CreditCard className="w-4 h-4" />} value={fmt(selectedApt.customer.salePrice)} label="Satış Fiyatı" />
                      </div>

                      {/* Ödeme özeti */}
                      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Tahsil</span>
                          <span className="font-bold text-emerald-600">{fmt(totalPaid)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Kalan</span>
                          <span className={`font-bold ${remaining > 0 ? "text-red-500" : "text-emerald-600"}`}>
                            {fmt(remaining)}
                          </span>
                        </div>
                        <div className="bg-slate-200 rounded-full h-2 mt-1">
                          <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${pctPaid}%` }} />
                        </div>
                        <p className="text-xs text-slate-400 text-right">{pctPaid.toFixed(0)}% tahsil edildi</p>
                      </div>

                      {/* Ödeme listesi */}
                      {selectedApt.payments && selectedApt.payments.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Ödeme Geçmişi</p>
                          <div className="space-y-1.5">
                            {selectedApt.payments.map((p) => (
                              <div key={p.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                                <div>
                                  <p className="text-xs font-semibold text-slate-700">
                                    {PAYMENT_TYPES.find((t) => t.value === p.type)?.label}
                                  </p>
                                  <p className="text-xs text-slate-400">{new Date(p.date).toLocaleDateString("tr-TR")}</p>
                                  {p.note && <p className="text-xs text-slate-400 italic">{p.note}</p>}
                                </div>
                                <span className="text-sm font-bold text-emerald-600">{fmt(p.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setPanel("addPayment")}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-3 rounded-xl text-sm font-bold transition-colors"
                      >
                        + Ödeme Ekle
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <p className="text-sm text-slate-400 text-center">Bu daire için henüz müşteri kaydı yok</p>
                      <button
                        onClick={() => setPanel("addCustomer")}
                        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl text-sm font-bold transition-colors"
                      >
                        + Müşteri Ekle
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* MÜŞTERİ EKLE paneli */}
              {panel === "addCustomer" && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setPanel("detail")} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h3 className="font-bold text-slate-800">Müşteri Ekle</h3>
                  </div>

                  {success ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                      <CheckCircle className="w-14 h-14 text-emerald-500" />
                      <p className="text-emerald-600 font-bold text-lg">Müşteri Kaydedildi!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 pb-8">
                      {[
                        { key: "name",      label: "Ad Soyad",        type: "text",   placeholder: "Ahmet Yılmaz",    required: true },
                        { key: "phone",     label: "Telefon",         type: "tel",    placeholder: "0532 000 0000",   required: true },
                        { key: "email",     label: "E-posta",         type: "email",  placeholder: "ahmet@email.com", required: false },
                        { key: "idNumber",  label: "TC Kimlik No",    type: "text",   placeholder: "12345678901",     required: false },
                        { key: "address",   label: "Adres",           type: "text",   placeholder: "İkamet adresi",   required: false },
                        { key: "saleDate",  label: "Satış Tarihi",    type: "date",   placeholder: "",                required: false },
                        { key: "notes",     label: "Notlar",          type: "text",   placeholder: "Ek bilgiler...",  required: false },
                      ].map((f) => (
                        <div key={f.key}>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            {f.label} {f.required && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type={f.type}
                            value={customerForm[f.key as keyof typeof customerForm]}
                            onChange={(e) => setCustomerForm((cf) => ({ ...cf, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            className={inputCls}
                          />
                        </div>
                      ))}

                      {/* Satış fiyatı ayrı - formatlı */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Satış Fiyatı (₺) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={customerForm.salePrice}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            setCustomerForm((cf) => ({
                              ...cf,
                              salePrice: raw ? Number(raw).toLocaleString("tr-TR") : "",
                            }));
                          }}
                          placeholder="2.500.000"
                          className={inputCls}
                        />
                      </div>

                      <button
                        onClick={handleAddCustomer}
                        disabled={loading || !customerForm.name || !customerForm.phone || !customerForm.salePrice}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl text-base font-bold transition-colors flex items-center justify-center gap-2 mt-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? "Kaydediliyor..." : "Kaydet"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ÖDEME EKLE paneli */}
              {panel === "addPayment" && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setPanel("detail")} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h3 className="font-bold text-slate-800">Ödeme Ekle</h3>
                  </div>

                  {success ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                      <CheckCircle className="w-14 h-14 text-emerald-500" />
                      <p className="text-emerald-600 font-bold text-lg">Ödeme Kaydedildi!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 pb-8">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Ödeme Tipi</label>
                        <select
                          value={paymentForm.type}
                          onChange={(e) => setPaymentForm((pf) => ({ ...pf, type: e.target.value }))}
                          className={inputCls}
                        >
                          {PAYMENT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Tutar (₺) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={paymentForm.amount}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            setPaymentForm((pf) => ({
                              ...pf,
                              amount: raw ? Number(raw).toLocaleString("tr-TR") : "",
                            }));
                          }}
                          placeholder="500.000"
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Tarih <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={paymentForm.date}
                          onChange={(e) => setPaymentForm((pf) => ({ ...pf, date: e.target.value }))}
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Not</label>
                        <input
                          type="text"
                          value={paymentForm.note}
                          onChange={(e) => setPaymentForm((pf) => ({ ...pf, note: e.target.value }))}
                          placeholder="Açıklama..."
                          className={inputCls}
                        />
                      </div>

                      <button
                        onClick={handleAddPayment}
                        disabled={loading || !paymentForm.amount}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl text-base font-bold transition-colors flex items-center justify-center gap-2 mt-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? "Kaydediliyor..." : "Ödemeyi Kaydet"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon, value, label, bold, href,
}: {
  icon: React.ReactNode;
  value: string;
  label?: string;
  bold?: boolean;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="text-slate-400 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        {label && <p className="text-xs text-slate-400">{label}</p>}
        <p className={`text-sm truncate ${bold ? "font-bold text-slate-800" : "text-slate-700"}`}>{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block hover:opacity-70 transition-opacity">{content}</a>
  ) : content;
}
