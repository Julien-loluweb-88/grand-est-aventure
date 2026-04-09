import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#68a618]/30 border-t-[#68a618]" />
      <p className="text-sm text-[#281401]/70 flex flex-row">
        Chargement de l&apos;aventure...
        <Image
        src="/images/icons8-bulle-avec-pensée-50.png"
        alt=""
        height={20}
        width={20}
        />
      </p>
    </div>
  );
}