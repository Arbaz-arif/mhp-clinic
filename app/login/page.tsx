import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";
import { safeRedirectPath } from "@/lib/auth";
import { param, type SearchParamValue } from "@/lib/utils";

export const metadata = { title: "Sign in · MHP Clinic" };

const REASONS: Record<string, string> = {
  expired: "Your session ended (for example, the password was changed). Please sign in again.",
  "password-changed": "Password changed. Please sign in with your new password.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: SearchParamValue; reason?: SearchParamValue }>;
}) {
  const sp = await searchParams;
  const from = param(sp.from);
  const notice = REASONS[param(sp.reason)];

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">MHP Clinic</CardTitle>
          <CardDescription>Sign in as the doctor to continue.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {notice && (
            <p role="status" className="rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-800">
              {notice}
            </p>
          )}
          <LoginForm from={safeRedirectPath(from)} />
        </CardContent>
      </Card>
    </main>
  );
}
