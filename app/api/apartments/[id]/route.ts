import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  const apartment = await prisma.apartment.findFirst({
    where: { id, building: { userId: session.user.id } },
    include: {
      customer: true,
      payments: { orderBy: { date: "desc" } },
      building: true,
    },
  });

  if (!apartment) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  return NextResponse.json(apartment);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const data = await req.json();

  const apartment = await prisma.apartment.update({
    where: { id },
    data,
    include: { customer: true },
  });

  return NextResponse.json(apartment);
}
