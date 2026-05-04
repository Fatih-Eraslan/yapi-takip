import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id as string },
    select: { id: true, name: true, email: true, phone: true, company: true },
  });

  return <ProfileClient user={user!} />;
}
