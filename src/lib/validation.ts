import { z } from "zod";
import { MAX_WORKFLOW_LENGTH, MIN_WORKFLOW_LENGTH } from "@/lib/constants";

export const matchRequestSchema = z.object({
  workflow: z
    .string()
    .min(MIN_WORKFLOW_LENGTH, `Workflow must be at least ${MIN_WORKFLOW_LENGTH} characters.`)
    .max(MAX_WORKFLOW_LENGTH, `Workflow must be at most ${MAX_WORKFLOW_LENGTH} characters.`)
    .trim(),
});

export type MatchRequestInput = z.infer<typeof matchRequestSchema>;
