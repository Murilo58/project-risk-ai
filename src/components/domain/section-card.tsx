import type { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-card rounded-xl border shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
        <div>
          <h2 className="text-foreground text-base font-semibold">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
