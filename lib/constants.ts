// Shared by models, validation and client forms (no server imports here).
export const GENDERS = ["male", "female", "other"] as const;
export const MEDICINE_FORMS = ["dilution", "mother tincture", "tablets", "biochemic"] as const;
export type MedicineForm = (typeof MEDICINE_FORMS)[number];

// Expiry alert thresholds (days from today). Red = expired, orange < CRITICAL, yellow ≤ WARNING.
export const EXPIRY_CRITICAL_DAYS = 30;
export const EXPIRY_WARNING_DAYS = 90;
