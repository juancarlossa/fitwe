// lib/mobileAuth.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.MOBILE_JWT_SECRET || process.env.NEXTAUTH_SECRET!,
);

export type MobileTokenPayload = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "GYM";
  subscriptionStatus: string;
  subscriptionEndDate: string | null;
  monthlyFee: number;
  gymId: string | null;
  gymName: string | null;
};

/**
 * Extrae y verifica el JWT del header Authorization: Bearer <token>
 * Úsalo en tus route handlers protegidos.
 *
 * Ejemplo:
 *   const { payload, error } = await verifyMobileToken(req);
 *   if (error) return error;          // NextResponse 401/400
 *   console.log(payload.id);
 */
export async function verifyMobileToken(
  req: NextRequest,
): Promise<
  | { payload: MobileTokenPayload; error: null }
  | { payload: null; error: NextResponse }
> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      payload: null,
      error: NextResponse.json(
        { error: "Token de autorización requerido" },
        { status: 401 },
      ),
    };
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { payload: payload as unknown as MobileTokenPayload, error: null };
  } catch (err: any) {
    const expired = err?.code === "ERR_JWT_EXPIRED";
    return {
      payload: null,
      error: NextResponse.json(
        {
          error: expired
            ? "Token expirado, vuelve a iniciar sesión"
            : "Token inválido",
        },
        { status: 401 },
      ),
    };
  }
}
