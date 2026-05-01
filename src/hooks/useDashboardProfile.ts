"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type DashboardProfile = {
  role: string | null;
  firstName: string;
  lastName: string;
  email: string;
};

export function useDashboardProfile() {
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setProfile(null);
          return;
        }

        const { data: row } = await supabase
          .from("profiles")
          .select("role, first_name, last_name, email")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (!row) {
          setProfile({
            role: null,
            firstName: "",
            lastName: "",
            email: user.email ?? "",
          });
          return;
        }

        setProfile({
          role: (row.role as string) ?? null,
          firstName: (row.first_name as string) ?? "",
          lastName: (row.last_name as string) ?? "",
          email: ((row.email as string) || user.email) ?? "",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, loading };
}
