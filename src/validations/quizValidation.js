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

const quizAnswerSchema = z.object({
  questionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid question ID."),
  selectedChoice: z.number().int().min(1),
});

export const submitAnswersSchema = z.object({
  quiz: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid quiz ID."),
  answers: z.array(quizAnswerSchema).min(1),
});

export default quizSchema;
