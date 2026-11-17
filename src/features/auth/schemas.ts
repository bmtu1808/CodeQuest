import { z } from "zod";

export const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(40),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(20)
    .regex(/^[a-z0-9_]+$/, "Use only letters, numbers and underscores"),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(120),
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long"),
  timezone: z.string().max(64).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password").max(72),
});

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Echo of the submitted non-secret fields, so React 19 form reset does not wipe what the user typed. */
  values?: Record<string, string>;
};
