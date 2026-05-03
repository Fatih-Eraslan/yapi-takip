import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { customerId, apartmentId, amount, type, date, note } = await req.json();

  const payment = await prisma.payment.create({
    data: {
      customerId,
      apartmentId,
      amount,
      type,
      date: new Date(date),
      note,
    },
  });

  return NextResponse.json(payment);
}
