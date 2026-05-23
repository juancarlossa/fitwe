import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyMobileToken } from "@/lib/mobileAuth";

export async function requireUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  // ───────────────
  // MOBILE JWT
  // ───────────────
  if (authHeader?.startsWith("Bearer ")) {
    const { payload, error } = await verifyMobileToken(req);

    if (payload) {
      return {
        userId: payload.id,
        source: "mobile",
      };
    }

    return { error };
  }

  // ───────────────
  // WEB NEXTAUTH
  // ───────────────
  const token = await getToken({ req });

  if (token?.sub) {
    return {
      userId: token.sub,
      source: "web",
    };
  }

  return {
    error: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
  };
}
