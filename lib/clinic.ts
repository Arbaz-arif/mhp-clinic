import "server-only";

/**
 * Letterhead details for the printed prescription. Set these in .env.local / Vercel;
 * the defaults are placeholders.
 */
export function clinicInfo() {
  const env = process.env;
  return {
    name: env.CLINIC_NAME || "Your Clinic Name",
    tagline: env.CLINIC_TAGLINE || "Homeopathic Clinic",
    address: env.CLINIC_ADDRESS || "Clinic address, City",
    phone: env.CLINIC_PHONE || "",
    logoUrl: env.CLINIC_LOGO_URL || "", // e.g. "/logo.png" (put the file in /public), empty = placeholder box
    doctorName: env.DOCTOR_NAME || "Dr. Name",
    doctorQualifications: env.DOCTOR_QUALIFICATIONS || "DHMS",
    doctorRegNo: env.DOCTOR_REG_NO || "",
  };
}
