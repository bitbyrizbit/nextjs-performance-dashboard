import { z } from "zod";

export const itemSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]),
});

export type ItemFormValues = z.infer<typeof itemSchema>;
