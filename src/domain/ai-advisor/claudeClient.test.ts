import { beforeEach, describe, expect, it, vi } from "vitest";

const parseMock = vi.fn();

// Builds an Error whose prototype chain matches the given (mocked) SDK error
// class, without needing to satisfy that class's real constructor signature.
function errorLike(ErrorClass: { prototype: object }, message: string): Error {
  const error = new Error(message);
  Object.setPrototypeOf(error, ErrorClass.prototype);
  return error;
}

vi.mock("@anthropic-ai/sdk", () => {
  class AuthenticationError extends Error {}
  class RateLimitError extends Error {}
  class APIConnectionTimeoutError extends Error {}
  class APIError extends Error {}

  class MockAnthropic {
    static AuthenticationError = AuthenticationError;
    static RateLimitError = RateLimitError;
    static APIConnectionTimeoutError = APIConnectionTimeoutError;
    static APIError = APIError;
    messages = { parse: parseMock };
  }

  return { default: MockAnthropic };
});

vi.mock("@anthropic-ai/sdk/helpers/zod", () => ({
  zodOutputFormat: () => ({ type: "json_schema" }),
}));

describe("runAiAnalysis", () => {
  const validAnalysis = {
    executiveSummary: "Resumo executivo de teste.",
    attentionPoints: ["Ponto de atenção."],
    suggestedRisks: [],
  };

  beforeEach(() => {
    vi.resetModules();
    parseMock.mockReset();
    process.env.ANTHROPIC_API_KEY = "test-key";
    delete process.env.ANTHROPIC_MODEL;
  });

  it("throws AiAdvisorNotConfiguredError when no API key is set", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { runAiAnalysis, AiAdvisorNotConfiguredError } =
      await import("@/domain/ai-advisor/claudeClient");
    await expect(runAiAnalysis("prompt")).rejects.toBeInstanceOf(
      AiAdvisorNotConfiguredError,
    );
  });

  it("returns the parsed output on success", async () => {
    parseMock.mockResolvedValue({ parsed_output: validAnalysis });
    const { runAiAnalysis } = await import("@/domain/ai-advisor/claudeClient");

    const result = await runAiAnalysis("prompt");
    expect(result).toEqual(validAnalysis);
  });

  it("maps a missing parsed_output to AiAdvisorUnavailableError", async () => {
    parseMock.mockResolvedValue({ parsed_output: null });
    const { runAiAnalysis, AiAdvisorUnavailableError } =
      await import("@/domain/ai-advisor/claudeClient");

    await expect(runAiAnalysis("prompt")).rejects.toBeInstanceOf(
      AiAdvisorUnavailableError,
    );
  });

  it("maps an authentication error to AiAdvisorUnavailableError", async () => {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    parseMock.mockRejectedValue(errorLike(Anthropic.AuthenticationError, "invalid key"));
    const { runAiAnalysis, AiAdvisorUnavailableError } =
      await import("@/domain/ai-advisor/claudeClient");

    await expect(runAiAnalysis("prompt")).rejects.toBeInstanceOf(
      AiAdvisorUnavailableError,
    );
  });

  it("maps a rate limit error to AiAdvisorUnavailableError", async () => {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    parseMock.mockRejectedValue(errorLike(Anthropic.RateLimitError, "too many requests"));
    const { runAiAnalysis, AiAdvisorUnavailableError } =
      await import("@/domain/ai-advisor/claudeClient");

    await expect(runAiAnalysis("prompt")).rejects.toBeInstanceOf(
      AiAdvisorUnavailableError,
    );
  });

  it("maps a timeout error to AiAdvisorUnavailableError", async () => {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    parseMock.mockRejectedValue(
      errorLike(Anthropic.APIConnectionTimeoutError, "timed out"),
    );
    const { runAiAnalysis, AiAdvisorUnavailableError } =
      await import("@/domain/ai-advisor/claudeClient");

    await expect(runAiAnalysis("prompt")).rejects.toBeInstanceOf(
      AiAdvisorUnavailableError,
    );
  });

  it("never lets the underlying SDK error escape unmapped", async () => {
    parseMock.mockRejectedValue(new Error("unexpected"));
    const { runAiAnalysis, AiAdvisorUnavailableError } =
      await import("@/domain/ai-advisor/claudeClient");

    await expect(runAiAnalysis("prompt")).rejects.toBeInstanceOf(
      AiAdvisorUnavailableError,
    );
  });
});
