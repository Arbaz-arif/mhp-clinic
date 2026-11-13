import { z } from "zod";
import { GENDERS, MEDICINE_FORMS } from "@/lib/constants";

export const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;
export const PHONE_REGEX = /^03\d{9}$/;
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

/** Accepts "1234512345671" or "12345-1234567-1" and returns the dashed form. */
export function normalizeCnic(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 13) return input.trim();
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

/** Accepts "0300 1234567", "+923001234567", "923001234567" and returns 03XXXXXXXXX. */
export function normalizePhone(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) digits = "0" + digits.slice(2);
  return digits;
}

/** Figure out whether a lookup string is a CNIC or a phone number. */
export function parseIdentifier(input: string): { cnic?: string; phone?: string } | null {
  const cnic = normalizeCnic(input);
  if (CNIC_REGEX.test(cnic)) return { cnic };
  const phone = normalizePhone(input);
  if (PHONE_REGEX.test(phone)) return { phone };
  return null;
}

// Length caps keep a single request from storing huge documents (MongoDB max is 16 MB).
const SHORT = 100; // names, potency, dose…
const MEDIUM = 500; // addresses, per-medicine instructions
const LONG = 5000; // complaints, case notes

/** Required trimmed text with a length cap. */
const text = (max: number, requiredMsg: string) =>
  z.string().trim().min(1, requiredMsg).max(max, `Keep this under ${max} characters`);

/** Optional trimmed text: "" → undefined (so Mongoose unsets the field). */
const optionalText = (max = MEDIUM) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .optional()
    .transform((v) => (v ? v : undefined));

/** "YYYY-MM-DD" from <input type="date"> → Date at UTC midnight. Rejects garbage like "abc". */
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
function parseDay(v: string) {
  if (!ISO_DAY.test(v)) return null;
  const d = new Date(v + "T00:00:00.000Z");
  const year = d.getUTCFullYear();
  // Also rejects impossible dates like 2026-02-31 (which JS would roll over to March).
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v || year < 1900 || year > 2200 ? null : d;
}
const requiredDate = (msg: string) =>
  z
    .string()
    .min(1, msg)
    .transform((v, ctx) => {
      const d = parseDay(v);
      if (!d) {
        ctx.addIssue({ code: "custom", message: "Enter a valid date" });
        return z.NEVER;
      }
      return d;
    });
const optionalDate = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const d = parseDay(v);
    if (!d) {
      ctx.addIssue({ code: "custom", message: "Enter a valid date" });
      return z.NEVER;
    }
    return d;
  });

export const patientSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(SHORT, `Keep this under ${SHORT} characters`),
    cnic: optionalText(30)
      .transform((v) => (v ? normalizeCnic(v) : undefined))
      .refine((v) => !v || CNIC_REGEX.test(v), "CNIC must be 12345-1234567-1"),
    phone: optionalText(30)
      .transform((v) => (v ? normalizePhone(v) : undefined))
      .refine((v) => !v || PHONE_REGEX.test(v), "Mobile must be 03XXXXXXXXX"),
    gender: z.enum(GENDERS).optional().or(z.literal("").transform(() => undefined)),
    age: optionalText(5)
      .transform((v) => (v ? Number(v) : undefined))
      .refine((v) => v === undefined || (Number.isInteger(v) && v >= 0 && v <= 130), "Age must be 0–130"),
    address: optionalText(MEDIUM),
  })
  .refine((d) => d.cnic || d.phone, {
    message: "Enter at least a CNIC or a mobile number",
    path: ["cnic"],
  });

// z.object() drops any extra keys, so injected fields (e.g. "$where", "patientId") never reach MongoDB.
export const prescriptionItemSchema = z.object({
  medicineId: optionalText(24).refine((v) => !v || OBJECT_ID_REGEX.test(v), "Invalid medicine"),
  medicineName: text(SHORT, "Medicine is required"),
  potency: text(30, "Potency is required"),
  dose: text(SHORT, "Dose is required"),
  frequency: text(SHORT, "Frequency is required"),
  duration: text(SHORT, "Duration is required"),
  instructions: optionalText(MEDIUM),
});

export const MAX_PRESCRIPTION_ITEMS = 30;

export const visitSchema = z.object({
  visitDate: requiredDate("Visit date is required"),
  complaints: text(LONG, "Complaints are required"),
  notes: optionalText(LONG),
  followUpDate: optionalDate,
  prescription: z.object({
    items: z
      .array(prescriptionItemSchema)
      .max(MAX_PRESCRIPTION_ITEMS, `At most ${MAX_PRESCRIPTION_ITEMS} medicines per visit`)
      .default([]),
    generalInstructions: optionalText(LONG),
  }),
});

export const batchSchema = z
  .object({
    batchNumber: text(50, "Batch number is required"),
    expiryDate: requiredDate("Expiry date is required"),
    quantity: z.coerce
      .number({ error: "Enter a quantity" })
      .int("Whole numbers only")
      .min(0, "Quantity cannot be negative")
      .max(1_000_000, "That quantity looks too large"),
    purchaseDate: optionalDate,
  })
  .refine((b) => !b.purchaseDate || b.purchaseDate <= b.expiryDate, {
    message: "Purchase date is after the expiry date",
    path: ["purchaseDate"],
  });

/** Medicine details only; batches have their own actions ($push / $set / $pull). */
export const medicineSchema = z.object({
  name: text(SHORT, "Name is required"),
  form: z.enum(MEDICINE_FORMS, { error: "Choose a form" }),
  manufacturer: optionalText(SHORT),
});

// ---------- Settings (the admin's own account) ----------

export const PASSWORD_MIN = 8;

export const profileSchema = z.object({
  name: optionalText(SHORT),
});

export const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "That email is too long")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"),
  currentPassword: z.string().min(1, "Enter your current password").max(200),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(200),
    newPassword: z
      .string()
      .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
      .max(72, "Use at most 72 characters"), // bcrypt only reads the first 72 bytes
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "The two passwords don't match", path: ["confirmPassword"] })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Choose a password different from the current one",
    path: ["newPassword"],
  });

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export function zodErrors(error: z.ZodError): FormState {
  return { ok: false, errors: z.flattenError(error).fieldErrors as Record<string, string[]> };
}
