export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST = "media.noqt.events";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return new NextResponse("Missing url", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(decodeURIComponent(raw));
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (parsed.hostname !== ALLOWED_HOST) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const rangeHeader = req.headers.get("range");
  const upstream = await fetch(parsed.toString(), {
    headers: rangeHeader ? { Range: rangeHeader } : {},
  });

  const resHeaders = new Headers();
  for (const key of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "last-modified",
    "etag",
  ]) {
    const val = upstream.headers.get(key);
    if (val) resHeaders.set(key, val);
  }
  if (!resHeaders.has("accept-ranges")) resHeaders.set("accept-ranges", "bytes");
  resHeaders.set("cache-control", "public, max-age=31536000, immutable");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}
