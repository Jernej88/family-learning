import { z } from "astro/zod";

const sourceSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  language: z.string().min(2).max(5),
  authority: z.enum(["primary", "institutional", "reference"]),
});

export const topicSchema = z
  .object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().min(20).max(180),
    category: z.string().min(1),
    tags: z.array(z.string().min(1)).min(1),
    created: z.coerce.date(),
    last_updated: z.coerce.date(),
    last_verified: z.coerce.date(),
    stability: z.enum(["stable", "developing", "changing"]),
    review_interval_days: z.number().int().positive(),
    recommended_age_min: z.number().int().min(5).max(18),
    recommended_age_max: z.number().int().min(5).max(18),
    estimated_minutes: z.number().int().positive().max(60),
    status: z.enum(["draft", "published"]),
    sources: z.array(sourceSchema).min(1).max(8),
  })
  .superRefine((topic, context) => {
    if (topic.recommended_age_min > topic.recommended_age_max) {
      context.addIssue({
        code: "custom",
        path: ["recommended_age_max"],
        message: "must be greater than or equal to recommended_age_min",
      });
    }

    if (topic.created > topic.last_updated) {
      context.addIssue({
        code: "custom",
        path: ["last_updated"],
        message: "must not be earlier than created",
      });
    }
  });

const questionBase = {
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*-\d{3}$/),
  concept: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  difficulty: z.number().int().min(1).max(3),
  age_min: z.number().int().min(5).max(18),
  question: z.string().min(5),
  explanation: z.string().min(10),
};

const multipleChoiceQuestionSchema = z
  .object({
    ...questionBase,
    type: z.literal("multiple_choice"),
    options: z.array(z.string().min(1)).min(2).max(5),
    correct: z.number().int().nonnegative(),
  })
  .superRefine((question, context) => {
    if (question.correct >= question.options.length) {
      context.addIssue({
        code: "custom",
        path: ["correct"],
        message: "must point to an existing option",
      });
    }
  });

const trueFalseQuestionSchema = z.object({
  ...questionBase,
  type: z.literal("true_false"),
  correct: z.boolean(),
});

export const quizSchema = z.object({
  topic: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  questions: z
    .array(z.discriminatedUnion("type", [multipleChoiceQuestionSchema, trueFalseQuestionSchema]))
    .min(1)
    .max(30),
});

export type Topic = z.infer<typeof topicSchema>;
export type Quiz = z.infer<typeof quizSchema>;

