"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Student = Database["public"]["Tables"]["students"]["Row"];
type StudentInsert = Database["public"]["Tables"]["students"]["Insert"];
type StudentUpdate = Database["public"]["Tables"]["students"]["Update"];

type LinkedParent = {
  nom: string;
  telephone: string;
  telephone_secondaire: string | null;
  email: string | null;
};

/** Ligne renvoyée par `.select('*, classes(...), student_parents(...)')` */
export type StudentWithClass = Student & {
  classes: { id: string; name: string; niveau: string } | null;
  student_parents?: { parents: LinkedParent | null }[] | null;
};

const STUDENT_SELECT = `*,
  classes ( id, name, niveau ),
  student_parents ( parents ( nom, telephone, telephone_secondaire, email ) )`;

/** Après INSERT, évite les jointures `student_parents` vides qui peuvent poser problème à certains clients PostgREST. */
const STUDENT_INSERT_SELECT = `*,
  classes ( id, name, niveau )`;

export function useStudents() {
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("students").select(STUDENT_SELECT).order("created_at", { ascending: false });

      if (error) throw error;
      setStudents((data as StudentWithClass[]) || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add student
  const addStudent = async (student: StudentInsert) => {
    try {
      const { data, error } = await supabase
        .from("students")
        .insert(student)
        .select(STUDENT_INSERT_SELECT)
        .single();

      if (error) throw error;

      const row = {
        ...(data as StudentWithClass),
        student_parents: [] as StudentWithClass["student_parents"],
      };
      setStudents((prev) => [row, ...prev]);
      return { data: row, error: null };
    } catch (err: any) {
      console.error('Error adding student:', err);
      return { data: null, error: err.message };
    }
  };

  // Update student
  const updateStudent = async (id: string, updates: StudentUpdate) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select(STUDENT_SELECT)
        .single();

      if (error) throw error;

      setStudents((prev) =>
        prev.map((s) => (s.id === id ? (data as StudentWithClass) : s))
      );
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating student:', err);
      return { data: null, error: err.message };
    }
  };

  // Delete student
  const deleteStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Mettre à jour la liste locale
      setStudents((prev) => prev.filter((s) => s.id !== id));
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting student:', err);
      return { error: err.message };
    }
  };

  // Charger les étudiants au montage
  useEffect(() => {
    fetchStudents();

    // Real-time subscription
    const channel = supabase
      .channel('students-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
        },
        () => {
          void fetchStudents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    students,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    refresh: fetchStudents,
  };
}
