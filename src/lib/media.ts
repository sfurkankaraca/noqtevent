// Memory Drive medyası Vercel proxy'si üzerinden servis edilir (Türkiye ISP'leri
// R2'nin public Cloudflare IP'lerini engelliyor — bkz api/media/[...path]).
// file_path (R2 anahtarı) → uygulama içi proxy URL'i.
export function mediaProxyUrl(filePath: string): string {
  return "/api/media/" + filePath.split("/").map(encodeURIComponent).join("/");
}
