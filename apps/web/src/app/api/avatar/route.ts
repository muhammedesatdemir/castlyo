export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const PUBLIC_DIR = join(process.cwd(), "public", "avatars");

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "no_file" }, { status: 400 });

    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(file.type)) {
      return NextResponse.json({ error: "invalid_type" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "too_large" }, { status: 400 });
    }

    await mkdir(PUBLIC_DIR, { recursive: true });

    const guessedExt =
      file.type === "image/png" ? ".png" :
      file.type === "image/webp" ? ".webp" : ".jpg";

    const key = `${randomUUID()}${guessedExt}`;
    const filepath = join(PUBLIC_DIR, key);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const publicUrl = `/avatars/${key}`;
    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (e: any) {
    console.error("avatar upload error:", e);
    return NextResponse.json({ error: "upload_failed", reason: e?.message }, { status: 500 });
  }
}


