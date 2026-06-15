import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProfile, saveProfile } from "@/controllers/profileController";

export const dynamic = "force-dynamic";

const profileSchema = z.object({
  creatorName: z.string().max(120).optional(),
  handle: z.string().max(80).optional(),
  tagline: z.string().max(200).optional(),
  contactEmail: z.string().max(160).nullable().optional(),
  avatarUrl: z.string().max(2048).nullable().optional(),
  coverUrl: z.string().max(2048).nullable().optional(),
  contactTitle: z.string().max(120).optional(),
  contactHint: z.string().max(280).optional(),
  isPublic: z.boolean().optional(),
});

export async function GET() {
  try {
    const data = await getProfile();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/profile:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = await saveProfile(parsed.data);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("PUT /api/profile:", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
