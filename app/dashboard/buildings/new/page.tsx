"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import Link from "next/link";

const APT_TYPES = ["1+0", "1+1", "2+1", "3+1", "4+1", "5+1", "Dükkan", "Ofis"];

interface AptTemplate {
  floor: number;
  number: string;
  type: string;
  size: string;
  price: string;
}

function formatPrice(val: string): string {
  const num = val.replace(/\D/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("tr-TR");
}

export default function NewBuildingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    description: "",
    floorCount: 5,
    aptPerFloor: 4,
    image: "",
  });

  const [apartments, setApartments] = useState<AptTemplate[]>([]);
  const [bulk, setBulk] = useState({ type: "2+1", size: "90", price: "" });

  function updateForm(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function generateApartments() {
    const apts: AptTemplate[] = [];
    for (let floor = 1; floor <= form.floorCount; floor++) {
      for (let pos = 1; pos <= form.aptPerFloor; pos++) {
        // Daire numarası: kat + sıra (örn: 1. kat 1. daire → 101)
        apts.push({
          floor,
          number: `${floor}${String(pos).padStart(2, "0")}`,
          type: "2+1",
          size: "90",
          price: "",
        });
      }
    }
    setApartments(apts);
    setStep(2);
  }

  function applyBulk(floorFilter?: number) {
    setApartments((prev) =>
      prev.map((a) => {
        if (floorFilter !== undefined && a.floor !== floorFilter) return a;
        return {
          ...a,
          ...(bulk.type  ? { type: bulk.type }  : {}),
          ...(bulk.size  ? { size: bulk.size }   : {}),
          ...(bulk.price ? { price: bulk.price } : {}),
        };
      })
    );
  }

  function updateApt(idx: number, k: string, v: string) {
    setApartments((prev) => prev.map((a, i) => (i === idx ? { ...a, [k]: v } : a)));
  }

  function removeApt(idx: number) {
    setApartments((prev) => prev.filter((_, i) => i !== idx));
  }

  function addApt(floor: number) {
    const floorApts = apartments.filter((a) => a.floor === floor);
    const nextPos = floorApts.length + 1;
    const newApt: AptTemplate = {
      floor,
      number: `${floor}${String(nextPos).padStart(2, "0")}`,
      type: "2+1",
      size: "90",
      price: "",
    };
    // Aynı katın son dairesinden sonra ekle
    let lastIdx = -1;
    for (let i = apartments.length - 1; i >= 0; i--) {
      if (apartments[i].floor === floor) { lastIdx = i; break; }
    }
    const updated = [...apartments];
    updated.splice(lastIdx + 1, 0, newApt);
    setApartments(updated);
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setError("Fotoğraf 15MB'dan büyük olamaz");
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Max 1200px, kalite 0.82 → ~150-300KB çıktı
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL("image/jpeg", 0.82);
      setImagePreview(compressed);
      setForm((f) => ({ ...f, image: compressed }));
      setError("");
    };
    img.src = objectUrl;
  }

  async function handleSubmit() {
    // Daire numarası tekrarı kontrolü
    const numbers = apartments.map((a) => a.number);
    const hasDup = numbers.length !== new Set(numbers).size;
    if (hasDup) {
      setError("Aynı numaralı daire var. Lütfen daire numaralarını kontrol edin.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        apartments: apartments.map((a) => ({
          floor: a.floor,
          number: a.number,
          type: a.type,
          size: a.size ? parseFloat(a.size) : null,
          price: a.price ? parseFloat(a.price.replace(/\./g, "").replace(",", ".")) : null,
          status: "AVAILABLE",
        })),
      };

      const res = await fetch("/api/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Bina oluşturulamadı, tekrar deneyin");
        return;
      }

      router.push(`/dashboard/buildings/${data.id}`);
    } catch {
      setError("Bağlantı hatası, internet bağlantınızı kontrol edin");
    } finally {
      setLoading(false);
    }
  }

  const floors = Array.from({ length: form.floorCount }, (_, i) => form.floorCount - i);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/buildings"
          className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-500 flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Yeni Bina Ekle</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {step === 1 ? "Adım 1/2: Bina bilgileri" : "Adım 2/2: Daire yapılandırması"}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-blue-600" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Genel hata */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---------- ADIM 1 ---------- */}
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Bina Adı <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-base"
                placeholder="Güneş Apartmanı"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Adres <span className="text-red-500">*</span>
              </label>
              <input
                value={form.address}
                onChange={(e) => updateForm("address", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-base"
                placeholder="Atatürk Cad. No:12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Şehir <span className="text-red-500">*</span>
              </label>
              <input
                value={form.city}
                onChange={(e) => updateForm("city", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-base"
                placeholder="İstanbul"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
              <input
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-base"
                placeholder="Merkezi konum..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kat Sayısı <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateForm("floorCount", Math.max(1, form.floorCount - 1))}
                  className="w-11 h-11 rounded-xl border border-slate-300 flex items-center justify-center text-xl text-slate-600 hover:bg-slate-100 flex-shrink-0"
                >−</button>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.floorCount}
                  onChange={(e) => updateForm("floorCount", Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-center text-base font-semibold"
                />
                <button
                  type="button"
                  onClick={() => updateForm("floorCount", Math.min(50, form.floorCount + 1))}
                  className="w-11 h-11 rounded-xl border border-slate-300 flex items-center justify-center text-xl text-slate-600 hover:bg-slate-100 flex-shrink-0"
                >+</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kat Başına Daire <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateForm("aptPerFloor", Math.max(1, form.aptPerFloor - 1))}
                  className="w-11 h-11 rounded-xl border border-slate-300 flex items-center justify-center text-xl text-slate-600 hover:bg-slate-100 flex-shrink-0"
                >−</button>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.aptPerFloor}
                  onChange={(e) => updateForm("aptPerFloor", Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-center text-base font-semibold"
                />
                <button
                  type="button"
                  onClick={() => updateForm("aptPerFloor", Math.min(20, form.aptPerFloor + 1))}
                  className="w-11 h-11 rounded-xl border border-slate-300 flex items-center justify-center text-xl text-slate-600 hover:bg-slate-100 flex-shrink-0"
                >+</button>
              </div>
            </div>
          </div>

          {/* Fotoğraf yükleme */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bina Fotoğrafı <span className="text-slate-400 text-xs">(Opsiyonel)</span>
            </label>
            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors relative">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Bina" className="w-full max-h-40 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setImagePreview(null); setForm((f) => ({ ...f, image: "" })); }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400" />
                  <span className="text-sm text-slate-500">Fotoğraf yüklemek için tıklayın</span>
                  <span className="text-xs text-slate-400">PNG, JPG, WEBP (maks. 5MB)</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 flex items-center gap-2">
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>{form.floorCount} kat × {form.aptPerFloor} daire</strong> = Toplam{" "}
              <strong>{form.floorCount * form.aptPerFloor} daire</strong> oluşturulacak
            </span>
          </div>

          <button
            onClick={generateApartments}
            disabled={!form.name || !form.address || !form.city}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-base"
          >
            Devam Et → Daire Yapılandırması
          </button>
        </div>
      )}

      {/* ---------- ADIM 2 ---------- */}
      {step === 2 && (
        <div className="space-y-4">
          {/* ── Toplu Uygula ── */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-blue-900 text-sm">Toplu Uygula</p>
                <p className="text-blue-600 text-xs mt-0.5">Tip / m² / fiyatı tüm dairelere veya tek kata uygula</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <label className="block text-xs text-blue-700 mb-1 font-medium">Tip</label>
                <select
                  value={bulk.type}
                  onChange={(e) => setBulk((b) => ({ ...b, type: e.target.value }))}
                  className="w-full px-3 py-2.5 text-base rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                >
                  {APT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-blue-700 mb-1 font-medium">Alan (m²)</label>
                <input
                  type="number"
                  min={0}
                  value={bulk.size}
                  onChange={(e) => setBulk((b) => ({ ...b, size: e.target.value }))}
                  placeholder="90"
                  className="w-full px-3 py-2.5 text-base rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs text-blue-700 mb-1 font-medium">Fiyat (₺)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={bulk.price}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setBulk((b) => ({ ...b, price: raw ? Number(raw).toLocaleString("tr-TR") : "" }));
                  }}
                  placeholder="2.500.000"
                  className="w-full px-3 py-2.5 text-base rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>
            </div>
            <button
              onClick={() => applyBulk()}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              Tüm Dairelere Uygula ({apartments.length} daire)
            </button>
          </div>

          {floors.map((floor) => {
            const floorApts = apartments.filter((a) => a.floor === floor);
            return (
              <div key={floor} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Kat başlığı */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100 gap-2">
                  <span className="font-semibold text-slate-700 text-sm flex-1">
                    {floor}. Kat &mdash; {floorApts.length} daire
                  </span>
                  <button
                    onClick={() => applyBulk(floor)}
                    className="text-blue-500 hover:text-blue-700 text-xs font-medium whitespace-nowrap"
                    title="Toplu ayarı bu kata uygula"
                  >
                    Bu kata uygula
                  </button>
                  <button
                    onClick={() => addApt(floor)}
                    className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ekle
                  </button>
                </div>

                {/* Daire satırları */}
                <div className="divide-y divide-slate-50">
                  {floorApts.map((apt) => {
                    const idx = apartments.indexOf(apt);
                    return (
                      <div key={idx} className="p-3 md:p-4">
                        {/* Mobilde 2 satır, masaüstünde tek satır */}
                        <div className="grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-2 items-end">
                          {/* Daire No */}
                          <div className="md:col-span-2">
                            <label className="block text-xs text-slate-500 mb-1">Daire No</label>
                            <input
                              value={apt.number}
                              onChange={(e) => updateApt(idx, "number", e.target.value)}
                              className="w-full px-3 py-3 text-base rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                            />
                          </div>
                          {/* Tip */}
                          <div className="md:col-span-3">
                            <label className="block text-xs text-slate-500 mb-1">Tip</label>
                            <select
                              value={apt.type}
                              onChange={(e) => updateApt(idx, "type", e.target.value)}
                              className="w-full px-3 py-3 text-base rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                            >
                              {APT_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          {/* m² */}
                          <div className="md:col-span-3">
                            <label className="block text-xs text-slate-500 mb-1">Alan (m²)</label>
                            <input
                              type="number"
                              min={0}
                              value={apt.size}
                              onChange={(e) => updateApt(idx, "size", e.target.value)}
                              className="w-full px-3 py-3 text-base rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                              placeholder="90"
                            />
                          </div>
                          {/* Fiyat */}
                          <div className="md:col-span-3">
                            <label className="block text-xs text-slate-500 mb-1">Fiyat (₺)</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={apt.price}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, "");
                                updateApt(idx, "price", raw ? Number(raw).toLocaleString("tr-TR") : "");
                              }}
                              className="w-full px-3 py-3 text-base rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                              placeholder="2.500.000"
                            />
                          </div>
                          {/* Sil butonu */}
                          <div className="md:col-span-1 flex items-end justify-end pb-0.5">
                            <button
                              onClick={() => removeApt(idx)}
                              className="p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                              title="Daireyi sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex gap-3 pt-2 pb-8">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-slate-300 text-slate-700 font-medium py-3.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              ← Geri
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || apartments.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Building2 className="w-4 h-4" />
              )}
              {loading ? "Oluşturuluyor..." : "Binayı Oluştur"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
