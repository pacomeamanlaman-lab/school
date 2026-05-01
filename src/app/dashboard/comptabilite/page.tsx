"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Coins, Search, Filter, TrendingUp, TrendingDown, AlertCircle, Plus, Eye } from "lucide-react";
import AddPaiementModal, { type PaiementSubmitPayload } from "@/components/AddPaiementModal";
import FlashNotice from "@/components/FlashNotice";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { createClient } from "@/lib/supabase/client";
import { embedOne } from "@/lib/supabase/embed";

export type DossierFinancier = {
  fraisScolaireId: string;
  studentId: string;
  studentName: string;
  classe: string;
  montantTotal: number;
  montantPaye: number;
  statutPaiement: string;
  dernierPaiement: string | null;
};

export default function ComptabilitePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isAddPaiementModalOpen, setIsAddPaiementModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<DossierFinancier | null>(null);
  const [fraisScolaires, setFraisScolaires] = useState<DossierFinancier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notice, flash } = useFlashNotice();

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);
    try {
      const { data: fraisRows, error: e1 } = await supabase.from("frais_scolaires").select(`
          id, student_id, montant_total, montant_paye, statut_paiement,
          students ( first_name, last_name, classes ( name ) )
        `);
      if (e1) throw e1;

      const { data: payRows } = await supabase
        .from("paiements")
        .select("frais_scolaire_id, date_paiement")
        .order("date_paiement", { ascending: false });

      const lastByFrais = new Map<string, string>();
      for (const p of payRows ?? []) {
        const fid = p.frais_scolaire_id as string;
        if (!lastByFrais.has(fid)) lastByFrais.set(fid, p.date_paiement as string);
      }

      const list: DossierFinancier[] = (fraisRows ?? []).map((f) => {
        const st = embedOne<{ first_name: string; last_name: string; classes?: unknown }>(
          (f as { students?: unknown }).students
        );
        const cl = embedOne<{ name: string }>(st?.classes);
        return {
          fraisScolaireId: f.id as string,
          studentId: f.student_id as string,
          studentName: st ? `${st.first_name} ${st.last_name}` : "—",
          classe: cl?.name ?? "—",
          montantTotal: Number(f.montant_total),
          montantPaye: Number(f.montant_paye),
          statutPaiement: f.statut_paiement as string,
          dernierPaiement: lastByFrais.get(f.id as string) ?? null,
        };
      });
      setFraisScolaires(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
      setFraisScolaires([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredFrais = useMemo(() => {
    return fraisScolaires.filter((frais) => {
      const matchSearch = frais.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = selectedFilter === "all" || frais.statutPaiement === selectedFilter;
      return matchSearch && matchFilter;
    });
  }, [fraisScolaires, searchTerm, selectedFilter]);

  const stats = useMemo(() => {
    return {
      total: fraisScolaires.reduce((sum, f) => sum + f.montantTotal, 0),
      paye: fraisScolaires.reduce((sum, f) => sum + f.montantPaye, 0),
      restant: fraisScolaires.reduce((sum, f) => sum + (f.montantTotal - f.montantPaye), 0),
      nombreImpaye: fraisScolaires.filter((f) => f.statutPaiement === "impaye").length,
    };
  }, [fraisScolaires]);

  const handleAddPaiement = (studentId: string) => {
    const row = fraisScolaires.find((f) => f.studentId === studentId);
    if (row) {
      setSelectedStudent(row);
      setIsAddPaiementModalOpen(true);
    }
  };

  const handleSavePaiement = async (data: PaiementSubmitPayload) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      flash("Session requise.", "error");
      return;
    }

    const montant = parseFloat(String(data.montant));
    if (Number.isNaN(montant) || montant <= 0) {
      flash("Montant invalide.", "error");
      return;
    }

    const mode = data.modePaiement as "especes" | "cheque" | "virement" | "mobile_money";
    const { error: e1 } = await supabase.from("paiements").insert({
      frais_scolaire_id: data.fraisScolaireId,
      montant,
      date_paiement: data.datePaiement,
      mode_paiement: mode,
      numero_recu: data.numeroRecu?.trim() || null,
      remarques: data.remarques?.trim() || null,
      created_by: user.id,
    });
    if (e1) {
      flash(e1.message, "error");
      return;
    }

    const row = fraisScolaires.find((f) => f.fraisScolaireId === data.fraisScolaireId);
    if (!row) {
      await load();
      flash("Paiement enregistré.", "success");
      return;
    }
    const nouveauMontantPaye = row.montantPaye + montant;
    const nouveauStatut =
      nouveauMontantPaye >= row.montantTotal ? "paye" : nouveauMontantPaye > 0 ? "partiel" : "impaye";

    const { error: e2 } = await supabase
      .from("frais_scolaires")
      .update({ montant_paye: nouveauMontantPaye, statut_paiement: nouveauStatut })
      .eq("id", data.fraisScolaireId);
    if (e2) {
      flash(e2.message, "error");
      return;
    }

    setIsAddPaiementModalOpen(false);
    setSelectedStudent(null);
    await load();
    flash("Paiement enregistré.", "success");
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "paye":
        return "bg-success/10 text-success border-success/20";
      case "partiel":
        return "bg-warning/10 text-warning border-warning/20";
      case "impaye":
        return "bg-danger/10 text-danger border-danger/20";
      default:
        return "bg-muted";
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "paye":
        return "Payé";
      case "partiel":
        return "Partiel";
      case "impaye":
        return "Non payé";
      default:
        return statut;
    }
  };

  return (
    <div className="space-y-6">
      <FlashNotice payload={notice} />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comptabilité & Frais scolaires</h1>
        <p className="text-muted-foreground">Supabase (frais_scolaires, paiements)</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total attendu</p>
              <p className="text-2xl font-bold mt-1">{loading ? "…" : stats.total.toLocaleString()} FCFA</p>
            </div>
            <Coins className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="bg-card border border-success/20 bg-success/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-success">Total payé</p>
              <p className="text-2xl font-bold mt-1">{loading ? "…" : stats.paye.toLocaleString()} FCFA</p>
            </div>
            <TrendingUp className="w-8 h-8 text-success" />
          </div>
        </div>
        <div className="bg-card border border-warning/20 bg-warning/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warning">Reste</p>
              <p className="text-2xl font-bold mt-1">{loading ? "…" : stats.restant.toLocaleString()} FCFA</p>
            </div>
            <TrendingDown className="w-8 h-8 text-warning" />
          </div>
        </div>
        <div className="bg-card border border-danger/20 bg-danger/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-danger">Impayés</p>
              <p className="text-2xl font-bold mt-1">{loading ? "…" : stats.nombreImpaye}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-danger" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher un élève…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-input rounded-lg appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="all">Tous les statuts</option>
              <option value="paye">Payé</option>
              <option value="partiel">Partiel</option>
              <option value="impaye">Non payé</option>
            </select>
          </div>
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
                  <th className="text-left px-6 py-4 text-sm font-semibold">Élève</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Classe</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Total</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Payé</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Reste</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Statut</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Dernier paiement</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFrais.map((frais) => {
                  const reste = frais.montantTotal - frais.montantPaye;
                  const pourcentage = frais.montantTotal ? (frais.montantPaye / frais.montantTotal) * 100 : 0;
                  return (
                    <tr key={frais.fraisScolaireId} className="border-b border-border hover:bg-accent/50">
                      <td className="px-6 py-4 font-medium">{frais.studentName}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 bg-secondary/10 text-secondary rounded-md text-sm">
                          {frais.classe}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">{frais.montantTotal.toLocaleString()} FCFA</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">{frais.montantPaye.toLocaleString()} FCFA</p>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              pourcentage === 100 ? "bg-success" : pourcentage > 0 ? "bg-warning" : "bg-danger"
                            }`}
                            style={{ width: `${Math.min(100, pourcentage)}%` }}
                          />
                        </div>
                      </td>
                      <td className={`px-6 py-4 font-semibold ${reste === 0 ? "text-success" : "text-warning"}`}>
                        {reste.toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-sm font-medium border ${getStatutBadge(
                            frais.statutPaiement
                          )}`}
                        >
                          {getStatutLabel(frais.statutPaiement)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {frais.dernierPaiement ? new Date(frais.dernierPaiement).toLocaleDateString("fr-FR") : "Aucun"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleAddPaiement(frais.studentId)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          Paiement
                        </button>
                        <button type="button" className="p-2 ml-1 text-muted-foreground" title="Détail">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border text-sm text-muted-foreground">
          {filteredFrais.length} dossier(s) affiché(s) sur {fraisScolaires.length}
        </div>
      </div>

      <AddPaiementModal
        isOpen={isAddPaiementModalOpen}
        onClose={() => {
          setIsAddPaiementModalOpen(false);
          setSelectedStudent(null);
        }}
        student={
          selectedStudent
            ? {
                fraisScolaireId: selectedStudent.fraisScolaireId,
                studentId: selectedStudent.studentId,
                studentName: selectedStudent.studentName,
                classe: selectedStudent.classe,
                montantTotal: selectedStudent.montantTotal,
                montantPaye: selectedStudent.montantPaye,
              }
            : null
        }
        onSubmit={handleSavePaiement}
      />
    </div>
  );
}
