import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { AI_ADVISOR_SYSTEM_PROMPT } from "@/domain/ai-advisor/buildPrompt";
import { aiAnalysisSchema, type AiAnalysis } from "@/domain/ai-advisor/schema";

export class AiAdvisorUnavailableError extends Error {
  constructor(message = "O AI Risk Advisor está temporariamente indisponível.") {
    super(message);
    this.name = "AiAdvisorUnavailableError";
  }
}

export class AiAdvisorNotConfiguredError extends Error {
  constructor() {
    super("A chave da API do Claude não está configurada neste ambiente.");
    this.name = "AiAdvisorNotConfiguredError";
  }
}

const TIMEOUT_MS = 30_000;
const DEFAULT_MODEL = "claude-opus-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new AiAdvisorNotConfiguredError();
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export async function runAiAnalysis(prompt: string): Promise<AiAnalysis> {
  const anthropic = getClient();
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  try {
    const response = await anthropic.messages.parse(
      {
        model,
        max_tokens: 4096,
        system: AI_ADVISOR_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
        output_config: { format: zodOutputFormat(aiAnalysisSchema) },
      },
      { timeout: TIMEOUT_MS },
    );

    if (!response.parsed_output) {
      throw new AiAdvisorUnavailableError(
        "A IA retornou uma resposta em formato inesperado.",
      );
    }

    return response.parsed_output;
  } catch (error) {
    if (error instanceof AiAdvisorUnavailableError) throw error;

    if (error instanceof Anthropic.AuthenticationError) {
      throw new AiAdvisorUnavailableError("Chave da API do Claude inválida.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new AiAdvisorUnavailableError(
        "Limite de requisições à API do Claude atingido. Tente novamente em instantes.",
      );
    }
    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      throw new AiAdvisorUnavailableError("A análise demorou demais e foi cancelada.");
    }
    if (error instanceof Anthropic.APIError) {
      throw new AiAdvisorUnavailableError(`Erro na API do Claude: ${error.message}`);
    }

    throw new AiAdvisorUnavailableError();
  }
}
