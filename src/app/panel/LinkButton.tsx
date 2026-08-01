import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

// Bu depodaki Button (@base-ui/react) "asChild" desteklemiyor — Link ile
// birleştirmek için base-ui'nin "render" prop deseni kullanılıyor (bkz.
// components/ui/badge.tsx'teki aynı desen). Panel içinde tekrar tekrar
// yazmamak için küçük bir sarmalayıcı.
export function LinkButton({
  href,
  children,
  variant,
  size,
  className,
}: {
  href: string;
  children: React.ReactNode;
} & VariantProps<typeof buttonVariants> & { className?: string }) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      nativeButton={false}
      render={<Link href={href}>{children}</Link>}
    />
  );
}
