import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  const building = await prisma.building.findFirst({
    where: { id, userId: session.user.id },
    include: {
      apartments: {
        include: {
          customer: true,
          payments: { orderBy: { date: "desc" } },
        },
        orderBy: [{ floor: "asc" }, { number: "asc" }],
      },
    },
  });

  if (!building) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  return NextResponse.json(building);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  await prisma.building.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
