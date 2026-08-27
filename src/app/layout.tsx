import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { QueryProvider } from "@/components/providers/query-provider";
import { SiteHeader } from "@/components/domain/site-header";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Risk AI",
  description: "Monitoramento preventivo de riscos e saúde de projetos de TI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <QueryProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
