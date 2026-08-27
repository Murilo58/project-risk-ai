import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProjectForm } from "@/components/domain/project-form";

describe("ProjectForm", () => {
  it("shows validation errors and blocks submit when required fields are empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProjectForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText("Nome é obrigatório.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits with the entered values once required fields are filled", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProjectForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/nome/i), "Migração ERP");
    await user.type(screen.getByLabelText(/responsável/i), "Marina Silva");
    await user.type(screen.getByLabelText(/data de início/i), "2026-01-10");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.name).toBe("Migração ERP");
    expect(submitted.owner).toBe("Marina Silva");
  });
});
