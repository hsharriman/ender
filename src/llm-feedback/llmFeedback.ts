import { ProofObj } from "checker/types/checkerTypes";
import OpenAI from "openai";
import {
  loadReasonDefinitions,
  loadStatementDefinitions,
} from "../checker/grammar/defsParsers";

const systemPrompt = `You are a geometry proof assistant. Your task is to evaluate a student's proof step-by-step.

You are given a proof in JSON format.

INSTRUCTIONS:
- Evaluate correctness step-by-step
- Do NOT include the conversion in your output
- Do NOT solve the full proof
- Be concise
- Identify all incorrect steps (if any)
- For each incorrect step, provide feedback in the output format and give a hint to improve the proof
- If the proof is incomplete (goal not reached or steps missing) and there are no specific incorrect steps,
  include one proof-level row with "step": null describing what is missing and a next hint
- For a correct proof, output empty list

OUTPUT FORMAT (strict):
Return ONLY a valid JSON object with the following schema:

[
    {
        "step": number or null,
        "feedback": string (1–3 sentences) or null,
        "next_hint": string (1–2 sentences) or null
    }
]


RULES:
- Do NOT include any text outside the JSON
- Do NOT include explanations before or after
- Do NOT use markdown
- Ensure the JSON is valid and parsable`;

const sortedMapEntries = <K extends string, V>(m: Map<K, V>): [K, V][] =>
  [...m.entries()].sort(([a], [b]) => a.localeCompare(b));

/** JSON snapshot of checker reason defs (`grammar/defs/reasons.defs.ts`). */
export const formatReasonDefsForPrompt = (): string => {
  const reasons = loadReasonDefinitions();
  return JSON.stringify(Object.fromEntries(sortedMapEntries(reasons)), null, 2);
};

/** JSON snapshot of checker statement + group defs (`grammar/defs/stmts.defs.ts`). */
export const formatStatementDefsForPrompt = (): string => {
  const { statements, groups } = loadStatementDefinitions();
  return JSON.stringify(
    {
      statements: Object.fromEntries(sortedMapEntries(statements)),
      groups: Object.fromEntries(sortedMapEntries(groups)),
    },
    null,
    2,
  );
};

export type LlmStepFeedbackRow = {
  step: number | null;
  feedback: string | null;
  next_hint: string | null;
};

/** Strip optional ``` fences and parse the model’s JSON array. */
export const parseLlmStepFeedbackList = (raw: string): LlmStepFeedbackRow[] => {
  const trimmed = raw.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const data = JSON.parse(unfenced) as unknown;
  if (!Array.isArray(data)) return [];
  const out: LlmStepFeedbackRow[] = [];
  for (const row of data) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const step =
      typeof o.step === "number"
        ? o.step
        : o.step === null
          ? null
          : typeof o.step === "string" && /^\d+$/.test(o.step)
            ? parseInt(o.step, 10)
            : null;
    out.push({
      step,
      feedback: typeof o.feedback === "string" ? o.feedback : null,
      next_hint: typeof o.next_hint === "string" ? o.next_hint : null,
    });
  }
  return out;
};

/** Resolve API key for browser (CRA inlines only `REACT_APP_*`). */
export const resolveOpenAiApiKey = (explicit?: string): string | undefined => {
  if (explicit && explicit.trim()) return explicit.trim();
  const fromReact = process.env.REACT_APP_OPENAI_API_KEY?.trim();
  if (fromReact) return fromReact;
  return undefined;
};

export type RunLlmFeedbackOptions = {
  proof: ProofObj;
  /** OpenAI model id. */
  model?: string;
  apiKey?: string;
};

export const query = async (
  client: OpenAI,
  data: string,
  systemPromptText: string,
  model: string,
): Promise<string> => {
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPromptText },
      { role: "user", content: data },
    ],
  });
  const message = completion.choices[0]?.message?.content;
  return message ?? "";
};

/**
 * Sends the proof JSON plus checker reason/statement defs to the chat model.
 */
export const runLlmFeedback = async (
  opts: RunLlmFeedbackOptions,
): Promise<string> => {
  const apiKey = resolveOpenAiApiKey(opts.apiKey);
  if (!apiKey) {
    throw new Error(
      "Missing OpenAI API key. Set REACT_APP_OPENAI_API_KEY for the browser harness.",
    );
  }

  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
  const model = opts.model ?? "gpt-5.4";

  const reasons = formatReasonDefsForPrompt();
  const statements = formatStatementDefsForPrompt();
  const prompt = `${systemPrompt}

VALID REASONS:
${reasons}

VALID STATEMENTS:
${statements}
`;

  return query(client, JSON.stringify(opts.proof), prompt, model);
};
