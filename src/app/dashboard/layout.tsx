import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = user?.app_metadata as Record<string, unknown> | undefined;
  if (user && meta?.must_change_password === true) {
    redirect("/premiere-connexion");
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
