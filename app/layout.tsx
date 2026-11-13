import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MHP Clinic",
  description: "Patient records, prescriptions and inventory for a homeopathic clinic",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Browser extensions (e.g. ColorZilla's cz-shortcut-listen) add attributes to <body>
          before React loads; this silences that one-level mismatch only, not errors in the app. */}
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
