import type { ReactNode } from "react";

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="mt-10 border-b border-[#281401]/20 pb-2 text-xl font-semibold tracking-tight first:mt-0">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed sm:text-base">
        {children}
      </div>
    </section>
  );
}
