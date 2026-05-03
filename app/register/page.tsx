"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Loader2, Eye, EyeOff } from "lucide-react";

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 text-base";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", company: "",
  });

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      return;
    }
    setLoading(true);
    setError("");

    const res  = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Kayıt başarısız, lütfen tekrar deneyin");
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">YapıTakip</h1>
          <p className="text-blue-200 mt-1 text-sm">Hemen ücretsiz hesap oluşturun</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-5">Yeni Hesap Oluştur</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
                autoComplete="name"
                className={inputCls}
                placeholder="Ahmet Yılmaz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                E-posta <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
                autoComplete="email"
                className={inputCls}
                placeholder="ahmet@firma.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Şifre <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                  autoComplete="new-password"
                  className={`${inputCls} pr-11`}
                  placeholder="En az 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                autoComplete="tel"
                className={inputCls}
                placeholder="0532 000 0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Firma Adı</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                autoComplete="organization"
                className={inputCls}
                placeholder="Yılmaz İnşaat Ltd."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-base mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-5">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-semibold">
              Giriş Yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
