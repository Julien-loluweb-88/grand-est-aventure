import QRCode from "qrcode";
import Image from "next/image";
import { resolvePlayStoreUrl } from "../_lib/play-store-url";

type PlayStoreQrCodeProps = {
  className?: string;
  size?: number;
};

/** QR code généré à partir de `NEXT_PUBLIC_PLAY_STORE_URL` (jamais une image statique). */
export async function PlayStoreQrCode({
  className,
  size = 120,
}: PlayStoreQrCodeProps) {
  const url = resolvePlayStoreUrl(process.env.NEXT_PUBLIC_PLAY_STORE_URL);
  if (!url) return null;

  const dataUrl = await QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  return (
    <Image
      src={dataUrl}
      alt="QR code vers le Play Store"
      width={size}
      height={size}
      unoptimized
      className={className}
    />
  );
}
