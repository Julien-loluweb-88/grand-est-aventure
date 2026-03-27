"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AdminSessionCapabilities } from "@/lib/admin-session-capabilities";

const AdminCapabilitiesContext = createContext<AdminSessionCapabilities | null>(
  null
);

export function AdminCapabilitiesProvider({
  value,
  children,
}: {
  value: AdminSessionCapabilities;
  children: ReactNode;
}) {
  return (
    <AdminCapabilitiesContext.Provider value={value}>
      {children}
    </AdminCapabilitiesContext.Provider>
  );
}

export function useAdminCapabilities(): AdminSessionCapabilities {
  const ctx = useContext(AdminCapabilitiesContext);
  if (!ctx) {
    throw new Error(
      "useAdminCapabilities doit être utilisé sous AdminCapabilitiesProvider"
    );
  }
  return ctx;
}
