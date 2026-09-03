import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";

const BUCKET   = "files";
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
]);

// In-memory sliding-window rate limiter: max 20 uploads per user per 60 s.
// Resets on server restart — acceptable for the current long-lived process model.
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT     = 20;
const rateLimiter    = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now   = Date.now();
  const entry = rateLimiter.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const supa = await createSupabaseServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: "Too many uploads. Wait a moment and try again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_BYTES / 1024 / 1024} MB.` },
      { status: 413 }
    );
  }

  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: `File type "${mimeType}" is not allowed.` },
      { status: 415 }
    );
  }

  // Ensure bucket exists (no-op if already created).
  // Files in campaign templates must remain publicly readable by email recipients.
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const safeName    = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  // Prefix with userId so each user's files are namespaced; UUID segment prevents guessing.
  const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl, storagePath: data.path });
}
