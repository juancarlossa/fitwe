// app/api/auth/mobile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { getNow } from "@/lib/timeUtils";

const JWT_SECRET = new TextEncoder().encode(
  process.env.MOBILE_JWT_SECRET || process.env.NEXTAUTH_SECRET!,
);

const TOKEN_EXPIRY = "30d";

// 🔥 CORS helper
function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// ✅ PRE-FLIGHT (esto te faltaba)
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña requeridos" },
        { status: 400, headers: corsHeaders(origin) },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { gym: { select: { id: true, name: true } } },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 401, headers: corsHeaders(origin) },
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 },
      );
    }

    const serverNow = (await getNow()).toISOString();

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndDate: user.subscriptionEndDate?.toISOString() || null,
      monthlyFee: user.monthlyFee,
      gymId: user.gymId || null,
      gymName: user.gym?.name || null,
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(TOKEN_EXPIRY)
      .sign(JWT_SECRET);

    return NextResponse.json(
      {
        token,
        user: { ...payload, serverNow },
      },
      {
        headers: corsHeaders(origin),
      },
    );
  } catch (error) {
    console.error("[mobile/login] Error:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
