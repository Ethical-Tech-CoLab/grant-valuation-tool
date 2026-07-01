import { NextResponse } from "next/server";
import { createGrant, listGrants } from "@/lib/store";

export async function GET() {
  const grants = await listGrants();
  return NextResponse.json(grants);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const grant = await createGrant(body);
  return NextResponse.json(grant, { status: 201 });
}
