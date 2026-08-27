import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/domain/empty-state";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="Nada por aqui" description="Cadastre o primeiro item." />);

    expect(screen.getByText("Nada por aqui")).toBeInTheDocument();
    expect(screen.getByText("Cadastre o primeiro item.")).toBeInTheDocument();
  });

  it("renders an optional action", () => {
    render(<EmptyState title="Nada por aqui" action={<button>Criar</button>} />);

    expect(screen.getByRole("button", { name: "Criar" })).toBeInTheDocument();
  });
});
