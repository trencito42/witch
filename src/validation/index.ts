import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password is too long")
  .refine((value) => /[a-zA-Z]/.test(value), "Password must include a letter")
  .refine((value) => /[0-9]/.test(value), "Password must include a number");

export const emailSchema = z.string().trim().email().max(255);
export const nameSchema = z.string().trim().min(1).max(80);
export const orgNameSchema = z.string().trim().min(2).max(120);
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/, "Use 3-80 lowercase letters, numbers, and hyphens");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const cssSelectorSchema = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .refine((value) => !/[<>]/.test(value), "Selector cannot include HTML");
