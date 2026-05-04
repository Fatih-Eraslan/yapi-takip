import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { name, phone, company } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Ad zorunlu" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name: name.trim(), phone: phone?.trim() || null, company: company?.trim() || null },
    select: { id: true, name: true, phone: true, company: true, email: true },
  });

  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword)
    return NextResponse.json({ error: "Tüm alanlar zorunlu" }, { status: 400 });

  if (newPassword.length < 6)
    return NextResponse.json({ error: "Yeni şifre en az 6 karakter olmalı" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return NextResponse.json({ error: "Mevcut şifre hatalı" }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });

  return NextResponse.json({ ok: true });
}
