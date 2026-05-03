import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PaymentsClient from "./PaymentsClient";

export default async function PaymentsPage() {
  const session = await auth();

  const payments = await prisma.payment.findMany({
    where: { apartment: { building: { userId: session!.user!.id as string } } },
    include: {
      customer: true,
      apartment: { include: { building: true } },
    },
    orderBy: { date: "desc" },
  });

  const totalIncome = payments.reduce((s, p) => s + p.amount, 0);

  // Prisma Date → string (client component'e güvenli aktarım)
  const serialized = payments.map((p) => ({
    ...p,
    date: p.date.toISOString(),
    createdAt: p.createdAt?.toISOString() ?? p.date.toISOString(),
  }));

  return <PaymentsClient payments={serialized as never} totalIncome={totalIncome} />;
}
