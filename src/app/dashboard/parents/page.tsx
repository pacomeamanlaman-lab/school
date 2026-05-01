"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Users, Phone, Mail, Edit, Trash2, FileSpreadsheet, MessageCircle } from "lucide-react";
import FlashNotice from "@/components/FlashNotice";
import WhatsAppNotifyModal from "@/components/WhatsAppNotifyModal";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { buildManualWhatsAppContext, type WhatsAppNotifyContext } from "@/lib/whatsapp-templates-mvp";
import AddParentModal from "@/components/AddParentModal";
import { createClient } from "@/lib/supabase/client";
import { embedOne } from "@/lib/supabase/embed";

type Enfant = { id: string; nom: string; classe: string };
type ParentRow = {
  id: string;
  nom: string;
  telephone: string;
  email: string;
  adresse: string;
  profession: string;
  telephoneSecondaire: string;
  enfants: Enfant[];
};

export default function ParentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [parents, setParents] = useState<ParentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<ParentRow | null>(null);
  const [waContext, setWaContext] = useState<WhatsAppNotifyContext | null>(null);
  const { notice, flash } = useFlashNotice();

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);
    try {
      const { data, error: e1 } = await supabase.from("parents").select(`
          id, nom, telephone, telephone_secondaire, email, adresse, profession,
          student_parents ( students ( id, first_name, last_name, classes ( name ) ) )
        `);
      if (e1) throw e1;

      const rows: ParentRow[] = (data ?? []).map((p) => {
        const sps = (p as { student_parents?: unknown[] }).student_parents ?? [];
        const enfants: Enfant[] = [];
        for (const sp of sps) {
          const st = embedOne<{ id: string; first_name: string; last_name: string; classes?: unknown }>(
            (sp as { students?: unknown }).students
          );
          if (!st) continue;
          const cl = embedOne<{ name: string }>(st.classes);
          enfants.push({
            id: st.id,
            nom: `${st.first_name} ${st.last_name}`,
            classe: cl?.name ?? "—",
          });
        }
        return {
          id: p.id as string,
          nom: p.nom as string,
          telephone: p.telephone as string,
          telephoneSecondaire: (p.telephone_secondaire as string | null) ?? "",
          email: (p.email as string | null) ?? "",
          adresse: (p.adresse as string | null) ?? "",
          profession: (p.profession as string | null) ?? "",
          enfants,
        };
      });
      setParents(rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
      setParents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredParents = useMemo(
    () =>
      parents.filter(
        (parent) =>
          parent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (parent.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          parent.telephone.includes(searchTerm)
      ),
    [parents, searchTerm]
  );

  const handleAddParent = async (newParent: Record<string, unknown>) => {
    const supabase = createClient();
    const { error: err } = await supabase.from("parents").insert({
      nom: String(newParent.nom),
      telephone: String(newParent.telephone),
      telephone_secondaire: String(newParent.telephoneSecondaire || "").trim() || null,
      email: String(newParent.email || "").trim() || null,
      adresse: String(newParent.adresse || "").trim() || null,
      profession: String(newParent.profession || "").trim() || null,
    });
    if (err) {
      flash(err.message, "error");
      return;
    }
    setIsAddModalOpen(false);
    await load();
    flash("Parent enregistré.", "success");
  };

  const handleEditParent = async (updated: Record<string, unknown> & { id: string }) => {
    const supabase = createClient();
    const { error: err } = await supabase
      .from("parents")
      .update({
        nom: String(updated.nom),
        telephone: String(updated.telephone),
        telephone_secondaire: String(updated.telephoneSecondaire || "").trim() || null,
        email: String(updated.email || "").trim() || null,
        adresse: String(updated.adresse || "").trim() || null,
        profession: String(updated.profession || "").trim() || null,
      })
      .eq("id", String(updated.id));
    if (err) {
      flash(err.message, "error");
      return;
    }
    setEditingParent(null);
    await load();
    flash("Fiche parent mise à jour.", "success");
  };

  const handleDeleteParent = async (id: string) => {
    if (!confirm("Supprimer ce parent ?")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("parents").delete().eq("id", id);
    if (err) {
      flash(err.message, "error");
      return;
    }
    await load();
    flash("Parent supprimé.", "success");
  };

  return (
    <div className="space-y-6">
      <FlashNotice payload={notice} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parents / Tuteurs</h1>
          <p className="text-muted-foreground">Données Supabase</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Ajouter un parent
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-input rounded-lg text-success font-medium"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export (données affichées)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Parents</p>
          <p className="text-2xl font-bold mt-1">{loading ? "…" : parents.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Avec email</p>
          <p className="text-2xl font-bold mt-1">{parents.filter((p) => p.email).length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Avec téléphone</p>
          <p className="text-2xl font-bold mt-1">{parents.filter((p) => p.telephone).length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Résultats</p>
          <p className="text-2xl font-bold mt-1">{filteredParents.length}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-8 text-center text-muted-foreground">Chargement…</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-6 py-4 text-sm font-semibold">Parent</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Profession</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Enfants</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParents.map((parent) => (
                  <tr key={parent.id} className="border-b border-border hover:bg-accent/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium">{parent.nom}</p>
                          <p className="text-sm text-muted-foreground">{parent.adresse || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {parent.telephone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {parent.email || "—"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{parent.profession || "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {parent.enfants.map((e) => (
                          <span
                            key={e.id}
                            className="inline-flex px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
                          >
                            {e.nom} ({e.classe})
                          </span>
                        ))}
                        {parent.enfants.length === 0 && (
                          <span className="text-xs text-muted-foreground">Aucun lien élève</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setWaContext(
                              buildManualWhatsAppContext({
                                parentNomComplet: parent.nom,
                                whatsapp: parent.telephone || null,
                                sujet: "Information établissement",
                                eleveOuEnfants:
                                  parent.enfants.map((e) => `${e.nom} (${e.classe})`).join(", ") || "vos enfants",
                              })
                            )
                          }
                          className="p-2 rounded-lg text-[#128C7E]"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => setEditingParent(parent)} className="p-2 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => handleDeleteParent(parent.id)} className="p-2 rounded-lg">
                          <Trash2 className="w-4 h-4 text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddParentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddParent} />

      {editingParent ? (
        <AddParentModal
          isOpen
          onClose={() => setEditingParent(null)}
          onSubmit={handleEditParent}
          parent={{
            id: editingParent.id,
            nom: editingParent.nom,
            telephone: editingParent.telephone,
            telephoneSecondaire: editingParent.telephoneSecondaire,
            email: editingParent.email,
            adresse: editingParent.adresse,
            profession: editingParent.profession,
          }}
        />
      ) : null}

      <WhatsAppNotifyModal
        isOpen={!!waContext}
        onClose={() => setWaContext(null)}
        context={waContext}
        onConfirmSend={(ctx) => {
          console.log("[WhatsApp] simulé:", ctx);
          flash("Envoi simulé (API à brancher).", "info");
        }}
      />
    </div>
  );
}
