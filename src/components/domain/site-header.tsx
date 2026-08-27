import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/projects" className="text-lg font-semibold">
          Project Risk AI
        </Link>
      </div>
    </header>
  );
}
