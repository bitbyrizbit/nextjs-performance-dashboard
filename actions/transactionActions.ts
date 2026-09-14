"use server";

import { transactionSchema } from "@/schemas/transaction";
import { revalidatePath } from "next/cache";

export type ActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function createTransaction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  // Simulate network delay for loading states
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const rawData = {
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    description: formData.get("description"),
  };

  // Re-validate against the shared schema (Security Boundary)
  const validatedFields = transactionSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validation failed on the server.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }


  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Transaction added successfully!",
  };
}
