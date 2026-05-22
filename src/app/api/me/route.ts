// app/api/me/route.ts  — ejemplo de ruta protegida
import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";

export async function GET(req: NextRequest) {
  // 1. Verificar token
  const { payload, error } = await verifyMobileToken(req);
  if (error) return error;

  // 2. Lógica normal — payload tiene todos los campos del usuario
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
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
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 },
    );
  }

  const serverNow = (await getNow()).toISOString();

  return NextResponse.json({ ...user, serverNow });
}
