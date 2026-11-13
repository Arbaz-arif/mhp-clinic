import { KeyRound, Mail, Settings, UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailForm, PasswordForm, ProfileForm } from "@/components/settings-forms";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Settings · MHP Clinic" };

export default async function SettingsPage() {
  const session = await requireAdmin();

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
          <Settings className="text-muted-foreground size-5" aria-hidden /> Settings
        </h1>
        <p className="text-muted-foreground text-sm">Your account: name, sign-in email and password.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="text-muted-foreground size-4" aria-hidden /> Profile
          </CardTitle>
          <CardDescription>How the app addresses you.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm name={session.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="text-muted-foreground size-4" aria-hidden /> Sign-in email
          </CardTitle>
          <CardDescription>The email you use to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailForm email={session.email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="text-muted-foreground size-4" aria-hidden /> Password
          </CardTitle>
          <CardDescription>Changing it signs you out on every other phone or computer.</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
