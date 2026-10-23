import z from "zod";

const choiceSchema = z.object({
  number: z.number().int().min(1),
  text: z.string().trim().min(1),
});

const questionSchema = z
  .object({
    text: z.string().trim().min(3),
    choices: z.array(choiceSchema).min(2),
    correctAnswer: z.number().int().min(1),
    points: z.number().min(0),
  })
  .superRefine((question, ctx) => {
    const numbers = question.choices.map((choice) => choice.number);

    if (new Set(numbers).size !== numbers.length) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: "Choice numbers must be unique.",
      });
    }

    if (!numbers.includes(question.correctAnswer)) {
      ctx.addIssue({
        code: "custom",
        path: ["correctAnswer"],
        message: "Correct answer must match a choice number.",
      });
    }
  });

const quizFields = {
  title: z.string().trim().min(3),
  questions: z.array(questionSchema).min(1),
  passingScore: z.number().min(0),
  isActive: z.boolean(),
  isRequired: z.boolean(),
};

const quizSchema = z.object({
  module: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid module ID."),
  ...quizFields,
}).extend({
  isActive: z.boolean().default(false),
  isRequired: z.boolean().default(false),
});

export const quizUpdateSchema = z.object(quizFields).partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided.",
);

export default quizSchema;
