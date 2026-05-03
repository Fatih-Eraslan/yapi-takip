import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const buildings = await prisma.building.findMany({
    where: { userId: session.user.id },
    include: {
      apartments: true,
      _count: { select: { apartments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(buildings);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { name, address, city, description, image, floorCount, aptPerFloor, apartments } =
    await req.json();

  const building = await prisma.building.create({
    data: {
      name,
      address,
      city,
      description,
      image,
      floorCount,
      aptPerFloor,
      userId: session.user.id,
      apartments: {
        create: apartments,
      },
    },
    include: { apartments: true },
  });

  return NextResponse.json(building);
}
