"use client";

import { useState } from "react";
import { User, Lock, CheckCircle, AlertCircle } from "lucide-react";

const inputCls = "w-full px-3 py-3 text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

type UserData = { id: string; name: string; email: string; phone: string | null; company: string | null };

export default function ProfileClient({ user }: { user: UserData }) {
  const [profile, setProfile] = useState({ name: user.name, phone: user.phone ?? "", company: user.company ?? "" });
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    setProfileLoading(false);
    if (res.ok) setProfileMsg({ type: "ok", text: "Profil güncellendi." });
    else setProfileMsg({ type: "err", text: data.error ?? "Hata oluştu." });
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "err", text: "Yeni şifreler eşleşmiyor." });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    });
    const data = await res.json();
    setPwLoading(false);
    if (res.ok) {
      setPwMsg({ type: "ok", text: "Şifre başarıyla değiştirildi." });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setPwMsg({ type: "err", text: data.error ?? "Hata oluştu." });
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Profilim</h1>
        <p className="text-slate-500 text-sm mt-1">{user.email}</p>
      </div>

      {/* Profil bilgileri */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="font-semibold text-slate-800">Kişisel Bilgiler</h2>
        </div>

        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className={labelCls}>Ad Soyad *</label>
            <input
              className={inputCls}
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required maxLength={80}
            />
          </div>
          <div>
            <label className={labelCls}>Telefon</label>
            <input
              className={inputCls}
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              maxLength={20}
            />
          </div>
          <div>
            <label className={labelCls}>Firma / Şirket</label>
            <input
              className={inputCls}
              value={profile.company}
              onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              maxLength={80}
            />
          </div>

          {profileMsg && (
            <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2 ${profileMsg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {profileMsg.type === "ok" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {profileMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={profileLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {profileLoading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>
      </div>

      {/* Şifre değiştir */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="font-semibold text-slate-800">Şifre Değiştir</h2>
        </div>

        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className={labelCls}>Mevcut Şifre *</label>
            <input
              className={inputCls}
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Yeni Şifre * <span className="text-slate-400 font-normal">(en az 6 karakter)</span></label>
            <input
              className={inputCls}
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              required minLength={6}
            />
          </div>
          <div>
            <label className={labelCls}>Yeni Şifre Tekrar *</label>
            <input
              className={inputCls}
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              required minLength={6}
            />
          </div>

          {pwMsg && (
            <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2 ${pwMsg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {pwMsg.type === "ok" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {pwMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={pwLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {pwLoading ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
          </button>
        </form>
      </div>
    </div>
  );
}
