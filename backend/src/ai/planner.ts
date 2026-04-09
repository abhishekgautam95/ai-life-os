import { openAIClient } from "./openaiClient";
import { buildPlannerPrompt } from "./promptTemplates";
import { PlanResult } from "./types";

const generatePlan = async (context: string): Promise<PlanResult | null> => {
  const result = await openAIClient.createJson<PlanResult>(
    [
      {
        role: "system",
        content: buildPlannerPrompt(context),
      },
      {
        role: "user",
        content: "Generate the best daily plan from this context.",
      },
    ],
    0.2
  );

  if (!result?.planText?.trim()) {
    return null;
  }

  return {
    planText: result.planText.trim(),
    focus: Array.isArray(result.focus)
      ? result.focus.map((item) => item.trim()).filter(Boolean).slice(0, 5)
      : [],
  };
};

export { generatePlan };
