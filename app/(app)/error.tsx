"use client";

import { useEffect } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Shown instead of a crash screen when a page fails (e.g. the database is unreachable). */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TriangleAlert className="size-5 text-orange-500" /> Something went wrong
        </CardTitle>
        <CardDescription>
          The page couldn&apos;t load. This is usually a brief internet or database connection problem. Nothing you saved
          has been lost.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Button onClick={reset} className="w-fit">
          <RotateCw /> Try again
        </Button>
        {error.digest && <p className="text-muted-foreground text-xs">Reference: {error.digest}</p>}
      </CardContent>
    </Card>
  );
}
