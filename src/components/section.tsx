import type { ReactNode } from "react";

export function Section({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="py-5">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p> : null}
          <h2 className="text-xl font-bold text-zinc-950">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
