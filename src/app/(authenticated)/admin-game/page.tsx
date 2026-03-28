import { Suspense } from "react";
import { AdminGameAuthClient } from "./AdminGameAuthClient";

export default function AdminGamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
          Chargement…
        </div>
      }
    >
      <AdminGameAuthClient />
    </Suspense>
  );
}
