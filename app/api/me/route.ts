import { NextResponse } from "next/server";
import { resolveOwner, isAllowed } from "@/lib/auth";

// Access gate. Returns 200 + owner for allowlisted Telegram users, 403 otherwise.
// The only endpoint in the skeleton — domain APIs get added beside it later.
export async function GET(req: Request) {
  const owner = resolveOwner(req);
  if (!owner || !isAllowed(owner)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({ owner });
}
