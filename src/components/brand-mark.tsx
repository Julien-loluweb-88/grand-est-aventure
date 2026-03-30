import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  /** Hauteur d’affichage (largeur proportionnelle). */
  height?: number;
};

/** Logo Balad'indice (`/public/logo.png`). */
export function BrandMark({ className, height = 44 }: BrandMarkProps) {
  return (
    <Image
      src="/logo.png"
      alt="Balad'indice"
      width={512}
      height={512}
      className={cn("w-auto object-contain bg-white", className)}
      style={{ height }}
      priority
    />
  );
}
