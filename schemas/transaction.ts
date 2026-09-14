import { z } from "zod";

export const transactionSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  amount: z.coerce.number().positive({
    message: "Amount must be a positive number.",
  }),
  category: z.string().min(1, {
    message: "Category is required.",
  }),
  description: z.string().max(255, {
    message: "Description must not exceed 255 characters.",
  }).optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
