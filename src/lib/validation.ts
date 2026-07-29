import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const signUpSchema = z.object({
  firstName: z.string().trim().min(1, { message: "First name is required" }).max(50),
  lastName: z.string().trim().min(1, { message: "Last name is required" }).max(50),
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
  role: z.enum(['pet_owner', 'veterinarian', 'service_provider'] as const),
  customerType: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const passwordResetSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
});

export const newPasswordSchema = z.object({
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const petSchema = z.object({
  name: z.string().trim().min(1, { message: "Pet name is required" }).max(100),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'fish', 'cattle', 'goat', 'sheep', 'poultry', 'pig', 'horse', 'other'] as const),
  breed: z.string().trim().max(100).optional(),
  dateOfBirth: z.string().optional(),
  weight: z.number().min(0).optional(),
  gender: z.enum(['male', 'female', 'unknown']).optional(),
  isLivestock: z.boolean().default(false),
  livestockCount: z.number().min(1).optional(),
  medicalNotes: z.string().max(2000).optional(),
});

export const consultationRequestSchema = z.object({
  petId: z.string().uuid({ message: "Please select a pet" }),
  chiefComplaint: z.string().trim().min(10, { message: "Please describe the issue in at least 10 characters" }).max(1000),
});

export const articleSchema = z.object({
  title: z.string().trim().min(1, { message: "Title is required" }).max(200),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/, { message: "Slug can only contain lowercase letters, numbers, and hyphens" }),
  excerpt: z.string().trim().max(300).optional(),
  content: z.string().trim().min(1, { message: "Content is required" }),
  category: z.string().trim().min(1, { message: "Category is required" }),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().default(false),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type PasswordResetValues = z.infer<typeof passwordResetSchema>;
export type NewPasswordValues = z.infer<typeof newPasswordSchema>;
export type PetValues = z.infer<typeof petSchema>;
export type ConsultationRequestValues = z.infer<typeof consultationRequestSchema>;

export const providerSignUpSchema = z.object({
  firstName: z.string().trim().min(1, { message: "First name is required" }).max(50),
  lastName: z.string().trim().min(1, { message: "Last name is required" }).max(50),
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
  role: z.enum(['veterinarian', 'service_provider'] as const),
  businessName: z.string().trim().max(200).optional(),
  location: z.string().trim().max(200).optional(),
  licenseNumber: z.string().trim().max(100).optional(),
  vendorType: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type ProviderSignUpValues = z.infer<typeof providerSignUpSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(100),
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  subject: z.string().trim().min(1, { message: "Subject is required" }).max(200),
  message: z.string().trim().min(10, { message: "Message must be at least 10 characters" }).max(1000),
});

export type ArticleValues = z.infer<typeof articleSchema>;
export type ContactValues = z.infer<typeof contactSchema>;
