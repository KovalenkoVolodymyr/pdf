export const QUESTIONS = [
  "Are there structural changes?",
  "Does this permit includes the work for an ADU?",
  "Does the Work involves creating a second kitchen?",
  "Does the Work includes relocation or alteration of a bearing wall?",
  "Is there Relocation or addition of a structural beam, column, or footing?",
  "Is there an an increase in structural load on walls, beams or footings?",
  "Does the work involve creating a new or widening an existing opening in an exterior wall?",
  "Does the work does not involve adding any new heated space?",
] as const;

export type Answer = "yes" | "no";

export interface UserAnswers {
  [key: string]: Answer;
}

export interface AIAnswer {
  answer: Answer;
  reasoning: string;
}

export interface AIResponse {
  [key: string]: AIAnswer;
}

export interface ValidationResult {
  userAnswers: UserAnswers;
  aiAnswers: AIResponse;
}