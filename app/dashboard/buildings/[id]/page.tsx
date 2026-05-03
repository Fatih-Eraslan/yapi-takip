import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BuildingDetailClient from "./BuildingDetailClient";
import type { Building } from "@/lib/types";

export default async function BuildingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const raw = await prisma.building.findFirst({
    where: { id, userId: session!.user!.id as string },
    include: {
      apartments: {
        include: { customer: true, payments: true },
        orderBy: [{ floor: "asc" }, { number: "asc" }],
      },
    },
  });

  if (!raw) notFound();

  const building: Building = {
    ...raw,
    apartments: raw.apartments.map((a) => ({
      ...a,
      customer: a.customer
        ? {
            ...a.customer,
            saleDate: a.customer.saleDate?.toISOString() ?? null,
          }
        : null,
      payments: a.payments.map((p) => ({
        ...p,
        date: p.date.toISOString(),
      })),
    })),
  };

  return <BuildingDetailClient building={building} />;
}
