import { isAdmin } from "@/lib/auth/auth-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await isAdmin();
  return <>{children}</>;
}
