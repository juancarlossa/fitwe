import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";
import { requireUser } from "@/lib/helpers/requireUser";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);

  if ("error" in auth) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      subscriptionStatus: true,
      subscriptionEndDate: true,
      monthlyFee: true,
      image: true,
      gymId: true,
      gym: { select: { name: true } },
    },
  });

  if (!user) {
    console.error("[Error] Usuario no encontrado:", auth.userId);
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 },
    );
  }

  const serverNow = (await getNow()).toISOString();

  return NextResponse.json({ ...user, serverNow });
}
