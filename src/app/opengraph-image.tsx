import { ImageResponse } from "next/og";

// Route segment config — statically generated at build time.
export const alt =
  "Project Risk AI — Monitoramento Preventivo de Riscos de Projeto com IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Shared by this route and `twitter-image.tsx` (which re-exports it).
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          backgroundColor: "#1e3a8a",
          backgroundImage:
            "linear-gradient(135deg, #1e3a8a 0%, #172554 60%, #0f172a 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 26,
            letterSpacing: 4,
            fontWeight: 600,
            color: "#93c5fd",
          }}
        >
          MONITORAMENTO PREVENTIVO DE RISCOS DE PROJETO
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 108,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Project Risk AI
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 34,
              lineHeight: 1.35,
              color: "#dbeafe",
              maxWidth: 940,
            }}
          >
            Calcula automaticamente a saúde de projetos de TI e usa IA para
            identificar riscos ainda não cadastrados, com causa e mitigação
            sugerida.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 600,
            color: "#60a5fa",
          }}
        >
          project-risk-ai.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
