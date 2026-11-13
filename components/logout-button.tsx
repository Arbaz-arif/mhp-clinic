"use client";

import { useFormStatus } from "react-dom";
import { Loader2, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Sidebar "Logout" that asks for confirmation first. */
export function LogoutButton({ email }: { email: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground w-full justify-start gap-3 px-3">
          <LogOut className="size-4" /> Logout
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Do you want to log out?</DialogTitle>
          <DialogDescription>
            You are signed in as <span className="text-foreground font-medium">{email}</span>. You will need your email and
            password to sign in again.
          </DialogDescription>
        </DialogHeader>
        <form action={logout}>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" autoFocus>
                Cancel
              </Button>
            </DialogClose>
            <ConfirmLogout />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmLogout() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <LogOut />}
      {pending ? "Logging out…" : "Log out"}
    </Button>
  );
}
