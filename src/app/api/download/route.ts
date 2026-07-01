import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

function isAllowedHost(url: URL): boolean {
  const allowedHosts = [
    process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : null,
    process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).host : null,
  ].filter(Boolean) as string[];
  return allowedHosts.includes(url.host);
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  const name = req.nextUrl.searchParams.get("name") ?? "dosya";
  if (!rawUrl) {
    return NextResponse.json({ error: "url parametresi gerekli" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Geçersiz url" }, { status: 400 });
  }

  if (!isAllowedHost(target)) {
    return NextResponse.json({ error: "İzin verilmeyen kaynak" }, { status: 400 });
  }

  const upstream = await fetch(target.toString());
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Dosya alınamadı" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeName}"`,
    },
  });
}
