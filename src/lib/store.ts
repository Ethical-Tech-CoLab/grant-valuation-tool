// File-based JSON store for grants.
//
// This keeps the app zero-config to run. It is intentionally simple and NOT
// safe for high-concurrency writes — for production, swap this module for a
// real database (Postgres + Prisma, SQLite, etc.). The rest of the app only
// touches grants through these functions, so that swap is localized here.

import { promises as fs } from "fs";
import path from "path";
import type { Grant, GrantInput } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "grants.json");

async function readAll(): Promise<Grant[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Grant[]) : [];
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(grants: Grant[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(grants, null, 2), "utf8");
}

export async function listGrants(): Promise<Grant[]> {
  const grants = await readAll();
  return grants.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getGrant(id: string): Promise<Grant | null> {
  const grants = await readAll();
  return grants.find((g) => g.id === id) ?? null;
}

export async function createGrant(input: GrantInput): Promise<Grant> {
  const grants = await readAll();
  const now = new Date().toISOString();
  const grant: Grant = {
    id: crypto.randomUUID(),
    name: input.name?.trim() || "Untitled grant",
    funder: input.funder?.trim() || "",
    amount: Number(input.amount) || 0,
    deadline: input.deadline || null,
    url: input.url?.trim() || "",
    description: input.description?.trim() || "",
    focusAreas: input.focusAreas ?? [],
    availability: input.availability ?? null,
    availabilityNote: input.availabilityNote?.trim() || "",
    orgLinkedIn: input.orgLinkedIn?.trim() || "",
    people: input.people ?? [],
    logistics: input.logistics ?? null,
    coalition: input.coalition ?? [],
    submission: input.submission ?? null,
    reviewCriteria: input.reviewCriteria ?? [],
    fundedExamples: input.fundedExamples ?? [],
    stage: input.stage ?? "prospect",
    scoring: null,
    proposal: null,
    recommendations: null,
    award: null,
    createdAt: now,
    updatedAt: now,
  };
  grants.push(grant);
  await writeAll(grants);
  return grant;
}

export async function updateGrant(
  id: string,
  patch: Partial<Grant>,
): Promise<Grant | null> {
  const grants = await readAll();
  const idx = grants.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  const updated: Grant = {
    ...grants[idx],
    ...patch,
    id: grants[idx].id,
    createdAt: grants[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };
  grants[idx] = updated;
  await writeAll(grants);
  return updated;
}

export async function deleteGrant(id: string): Promise<boolean> {
  const grants = await readAll();
  const next = grants.filter((g) => g.id !== id);
  if (next.length === grants.length) return false;
  await writeAll(next);
  return true;
}
