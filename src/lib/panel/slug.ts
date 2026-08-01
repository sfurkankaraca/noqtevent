import crypto from "node:crypto";

const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
  ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
};

// entities'e ghost (hayalet) profil oluştururken benzersiz slug üretir.
// Basit yaklaşım: adın slug'ı + kısa rastgele ek — collision pratikte
// gözükmez, gerçek çakışma olsa da UNIQUE index insert'i reddeder ve
// çağıran taraf hatayı kullanıcıya taşır.
export function slugify(input: string): string {
  const lowered = input
    .split("")
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("")
    .toLowerCase();
  return (
    lowered
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "profil"
  );
}

export function uniqueSlug(input: string): string {
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${slugify(input)}-${suffix}`;
}
