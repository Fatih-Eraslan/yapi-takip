import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const customers = await prisma.customer.findMany({
    where: { apartment: { building: { userId: session.user.id } } },
    include: {
      apartment: { include: { building: true } },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { apartmentId, name, phone, email, idNumber, address, saleDate, salePrice, notes } =
    await req.json();

  const customer = await prisma.customer.create({
    data: {
      apartmentId,
      name,
      phone,
      email,
      idNumber,
      address,
      saleDate: saleDate ? new Date(saleDate) : null,
      salePrice,
      notes,
    },
  });

  await prisma.apartment.update({
    where: { id: apartmentId },
    data: { status: "SOLD" },
  });

  return NextResponse.json(customer);
}
