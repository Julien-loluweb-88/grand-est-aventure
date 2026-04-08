import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#68a618]/30 border-t-[#68a618]" />
      <Image
      src="/images/icons8-iphone-spinner.gif"
      alt="Spinner"
      width={50}
      height={50}
      />
      <p className="text-sm text-[#281401]/70">
        Chargement de l&apos;aventure...
      </p>
    </div>
  );
}