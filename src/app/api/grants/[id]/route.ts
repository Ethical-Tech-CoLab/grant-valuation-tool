import { NextResponse } from "next/server";
import { deleteGrant, getGrant, updateGrant } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const grant = await getGrant(id);
  if (!grant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(grant);
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const patch = await request.json().catch(() => ({}));
  const grant = await updateGrant(id, patch);
  if (!grant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(grant);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const ok = await deleteGrant(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
