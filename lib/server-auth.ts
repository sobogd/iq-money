import { NextResponse } from "next/server";
import { resolveOwner, isAllowed } from "@/lib/auth";

// Gate a request to the shared household ledger. Returns the caller's owner key
// ("telegram:<id>") on success, or a 403 NextResponse to return as-is.
// All ledger data is shared (ownerKey "household"); the returned owner is used
// only to stamp `createdBy` on writes.
export function gate(req: Request): { owner: string } | { res: NextResponse } {
  const owner = resolveOwner(req);
  if (!owner || !isAllowed(owner)) {
    return { res: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { owner };
}
