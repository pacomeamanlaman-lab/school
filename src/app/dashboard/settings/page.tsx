"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { School, Calendar, BookOpen, Save, Plus, Edit, Trash2, Coins, ListPlus, Clock3 } from "lucide-react";
import AddMatiereModal from "@/components/AddMatiereModal";
import AddTrimestreModal from "@/components/AddTrimestreModal";
import Modal from "@/components/Modal";
import CoefficientGrilleReferencePanel from "@/components/CoefficientGrilleReferencePanel";
import type { FiltreCycleFrais } from "@/lib/cycles-scolaires-ci";
import {
  inferCycleFromNiveau,
  niveauxPourFiltreCycle,
  NIVEAUX_PRIMAIRE_CI,
  NIVEAUX_SECONDAIRE_CI,
} from "@/lib/cycles-scolaires-ci";
import type { FraisDraftLine, FraisScolaireItem } from "@/lib/frais-scolaires";
import {
  clearFraisDraftStorage,
  createDraftLine,
  getDefaultFrais,
  loadFraisDraftFromStorage,
  loadFraisFromStorage,
  saveFraisDraftToStorage,
  saveFraisToStorage,
} from "@/lib/frais-scolaires";
import type {
  CoefficientGrilleReferenceRow,
  NiveauCoeffReference,
  SerieBacReference,
} from "@/lib/coefficients-grille-reference";
import { loadCoeffGrilleFromStorage, saveCoeffGrilleToStorage } from "@/lib/coefficients-grille-reference";

type CycleMatiere = "Primaire" | "Secondaire" | "Les_deux";

type MatiereItem = {
  id: number;
  nom: string;
  coefficient: number;
  coefficientMode?: "unique" | "par_cycle" | "par_niveau";
  coefficientsParCycle?: {
    primaire: number;
    secondaire: number;
  };
  coefficientsParNiveau?: Record<string, number>;
  couleur: string;
  cycle: CycleMatiere;
  niveaux: string[];
  seriesTerminale?: Array<"A1" | "A2" | "B" | "C" | "D">;
  active: boolean;
};

const ALL_NIVEAUX = [...NIVEAUX_PRIMAIRE_CI, ...NIVEAUX_SECONDAIRE_CI];

export default function SettingsPage() {
  const [schoolInfo, setSchoolInfo] = useState({
    nom: "École Primaire & Collège Saint-Exupéry",
    adresse: "123 Avenue de l'Éducation, 75001 Paris",
    telephone: "+33 1 23 45 67 89",
    email: "contact@ecole-saint-exupery.fr",
    siteWeb: "www.ecole-saint-exupery.fr",
    directeur: "M. Pierre Dupont",
  });

  const [anneeScolaire, setAnneeScolaire] = useState({
    annee: "2024-2025",
    dateDebut: "2024-09-01",
    dateFin: "2025-06-30",
    active: true,
  });

  const [trimestres, setTrimestres] = useState([
    { id: 1, nom: "Trimestre 1", dateDebut: "2024-09-01", dateFin: "2024-12-20" },
    { id: 2, nom: "Trimestre 2", dateDebut: "2025-01-06", dateFin: "2025-03-28" },
    { id: 3, nom: "Trimestre 3", dateDebut: "2025-04-14", dateFin: "2025-06-30" },
  ]);

  const [matieres, setMatieres] = useState<MatiereItem[]>([
    {
      id: 1,
      nom: "Français",
      coefficient: 3,
      couleur: "#00aef0",
      cycle: "Les_deux",
      niveaux: ALL_NIVEAUX,
      active: true,
    },
    {
      id: 2,
      nom: "Mathématiques",
      coefficient: 3,
      couleur: "#10a7aa",
      cycle: "Les_deux",
      niveaux: ALL_NIVEAUX,
      active: true,
    },
    {
      id: 3,
      nom: "Histoire-Géo",
      coefficient: 2,
      couleur: "#f59e0b",
      cycle: "Secondaire",
      niveaux: [...NIVEAUX_SECONDAIRE_CI],
      active: true,
    },
    {
      id: 4,
      nom: "Sciences",
      coefficient: 2,
      couleur: "#10b981",
      cycle: "Les_deux",
      niveaux: ALL_NIVEAUX,
      active: true,
    },
    {
      id: 5,
      nom: "Anglais",
      coefficient: 2,
      couleur: "#8b5cf6",
      cycle: "Secondaire",
      niveaux: [...NIVEAUX_SECONDAIRE_CI],
      active: true,
    },
    {
      id: 6,
      nom: "EPS",
      coefficient: 1,
      couleur: "#ef4444",
      cycle: "Les_deux",
      niveaux: ALL_NIVEAUX,
      active: true,
    },
    {
      id: 7,
      nom: "Arts plastiques",
      coefficient: 1,
      couleur: "#ec4899",
      cycle: "Primaire",
      niveaux: [...NIVEAUX_PRIMAIRE_CI],
      active: true,
    },
    {
      id: 8,
      nom: "Musique",
      coefficient: 1,
      couleur: "#6366f1",
      cycle: "Primaire",
      niveaux: [...NIVEAUX_PRIMAIRE_CI],
      active: true,
    },
  ]);

  const [fraisScolaires, setFraisScolaires] = useState<FraisScolaireItem[]>(getDefaultFrais());
  const [editingFrais, setEditingFrais] = useState<{ id: number; montant: number } | null>(null);
  const [isAddFraisOpen, setIsAddFraisOpen] = useState(false);
  const [newFraisForm, setNewFraisForm] = useState<{
    filtreCycle: FiltreCycleFrais;
    niveau: string;
    montant: number;
  }>({ filtreCycle: "Primaire", niveau: "", montant: 0 });
  const [fraisDraftQueue, setFraisDraftQueue] = useState<FraisDraftLine[]>([]);

  // Charger les frais depuis localStorage au montage
  useEffect(() => {
    setFraisScolaires(loadFraisFromStorage());
  }, []);

  const [isAddMatiereOpen, setIsAddMatiereOpen] = useState(false);
  const [editingMatiere, setEditingMatiere] = useState<any>(null);
  const [matiereCycleFilter, setMatiereCycleFilter] = useState<"all" | CycleMatiere>("all");
  const [matiereNiveauFilter, setMatiereNiveauFilter] = useState("all");
  const [matiereSearch, setMatiereSearch] = useState("");
  const [isCoeffGrilleModalOpen, setIsCoeffGrilleModalOpen] = useState(false);
  const [coeffGrilleRows, setCoeffGrilleRows] = useState<CoefficientGrilleReferenceRow[]>([]);
  const [coeffCycleFilter, setCoeffCycleFilter] = useState<"all" | "Primaire" | "Secondaire">("all");
  const [coeffNiveauFilter, setCoeffNiveauFilter] = useState<"all" | NiveauCoeffReference>("all");
  const [coeffSerieFilter, setCoeffSerieFilter] = useState<"all" | SerieBacReference>("all");
  const [coeffSearch, setCoeffSearch] = useState("");
  const [isAddTrimestreOpen, setIsAddTrimestreOpen] = useState(false);
  const [editingTrimestre, setEditingTrimestre] = useState<any>(null);

  useEffect(() => {
    if (!isCoeffGrilleModalOpen) return;
    setCoeffGrilleRows(loadCoeffGrilleFromStorage());
    setCoeffCycleFilter("all");
    setCoeffNiveauFilter("all");
    setCoeffSerieFilter("all");
    setCoeffSearch("");
  }, [isCoeffGrilleModalOpen]);

  const handleUpdateCoeffGrilleRow = (id: number, next: number) => {
    setCoeffGrilleRows((rows) => {
      const updated = rows.map((r) =>
        r.id === id ? { ...r, coefficient: Math.max(1, Math.min(9, next || 1)) } : r
      );
      saveCoeffGrilleToStorage(updated);
      return updated;
    });
  };

  const handleSaveSchoolInfo = () => {
    alert("Informations de l'école enregistrées avec succès !");
  };

  const handleAddMatiere = (newMatiere: Omit<MatiereItem, "id">) => {
    const nom = newMatiere.nom.trim();
    if (!nom || newMatiere.niveaux.length === 0) {
      alert("Veuillez renseigner la matière et au moins un niveau.");
      return;
    }

    const duplicate = matieres.some(
      (m) => m.nom.toLowerCase() === nom.toLowerCase() && m.cycle === newMatiere.cycle
    );
    if (duplicate) {
      alert("Une matière avec ce nom existe déjà pour ce cycle.");
      return;
    }

    const nextId = matieres.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    setMatieres([...matieres, { ...newMatiere, nom, id: nextId }]);
  };

  const handleAddMatieresBatch = (rows: Omit<MatiereItem, "id">[]) => {
    if (rows.length === 0) return;
    let nextId = matieres.reduce((max, m) => Math.max(max, m.id), 0);
    const merged = [...matieres];
    let added = 0;

    for (const row of rows) {
      const nom = row.nom.trim();
      if (!nom || row.niveaux.length === 0) continue;
      const exists = merged.some(
        (m) => m.nom.toLowerCase() === nom.toLowerCase() && m.cycle === row.cycle
      );
      if (exists) continue;
      nextId += 1;
      merged.push({ ...row, nom, id: nextId });
      added += 1;
    }

    setMatieres(merged);
    alert(`${added} matière(s) ajoutée(s)${added < rows.length ? " (doublons ignorés)." : "."}`);
  };

  const handleEditMatiere = (updatedMatiere: MatiereItem) => {
    const nom = updatedMatiere.nom.trim();
    if (!nom || updatedMatiere.niveaux.length === 0) {
      alert("Veuillez renseigner la matière et au moins un niveau.");
      return;
    }
    setMatieres(
      matieres.map((m) =>
        m.id === updatedMatiere.id ? { ...updatedMatiere, nom } : m
      )
    );
    setEditingMatiere(null);
  };

  const handleDeleteMatiere = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette matière ?")) {
      setMatieres(matieres.filter((m) => m.id !== id));
    }
  };

  const handleToggleMatiereActive = (id: number) => {
    setMatieres(matieres.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
  };

  const handleAddTrimestre = (newTrimestre: any) => {
    const trimestre = {
      id: trimestres.length + 1,
      ...newTrimestre,
    };
    setTrimestres([...trimestres, trimestre]);
  };

  const handleEditTrimestre = (updatedTrimestre: any) => {
    setTrimestres(trimestres.map(t => t.id === updatedTrimestre.id ? updatedTrimestre : t));
    setEditingTrimestre(null);
  };

  const handleUpdateFrais = (id: number, nouveauMontant: number) => {
    setFraisScolaires(
      fraisScolaires.map((f) => (f.id === id ? { ...f, montant: nouveauMontant } : f))
    );
    setEditingFrais(null);
  };

  const handleSaveFrais = () => {
    saveFraisToStorage(fraisScolaires);
    alert("Configuration des frais scolaires enregistrée avec succès !");
    console.log("Frais scolaires sauvegardés:", fraisScolaires);
  };

  const persistDraft = (next: FraisDraftLine[]) => {
    setFraisDraftQueue(next);
    saveFraisDraftToStorage(next);
  };

  const handleAddFraisToDraft = () => {
    if (!newFraisForm.niveau || newFraisForm.montant <= 0) {
      alert("Veuillez remplir tous les champs correctement");
      return;
    }

    const niveauLower = newFraisForm.niveau.toLowerCase();
    if (fraisScolaires.some((f) => f.niveau.toLowerCase() === niveauLower)) {
      alert("Ce niveau existe déjà dans les frais enregistrés.");
      return;
    }
    if (fraisDraftQueue.some((f) => f.niveau.toLowerCase() === niveauLower)) {
      alert("Ce niveau est déjà dans la liste d'attente.");
      return;
    }

    const cycle = inferCycleFromNiveau(newFraisForm.niveau);
    const line = createDraftLine(newFraisForm.niveau, newFraisForm.montant, cycle);
    persistDraft([...fraisDraftQueue, line]);
    setNewFraisForm((prev) => ({ ...prev, niveau: "" }));
  };

  const handleRemoveDraftLine = (draftId: string) => {
    persistDraft(fraisDraftQueue.filter((l) => l.draftId !== draftId));
  };

  const handleClearDraftQueue = () => {
    persistDraft([]);
  };

  const handleValidateFraisDraft = () => {
    if (fraisDraftQueue.length === 0) {
      alert("Ajoutez au moins un niveau à la liste avant d'enregistrer.");
      return;
    }

    const count = fraisDraftQueue.length;
    let maxId = fraisScolaires.reduce((m, f) => Math.max(m, f.id), 0);
    const merged = [...fraisScolaires];
    for (const line of fraisDraftQueue) {
      if (merged.some((f) => f.niveau.toLowerCase() === line.niveau.toLowerCase())) {
        continue;
      }
      maxId += 1;
      merged.push({
        id: maxId,
        niveau: line.niveau,
        montant: line.montant,
        cycle: line.cycle,
      });
    }

    setFraisScolaires(merged);
    saveFraisToStorage(merged);
    clearFraisDraftStorage();
    setFraisDraftQueue([]);
    setNewFraisForm({ filtreCycle: "Primaire", niveau: "", montant: 0 });
    setIsAddFraisOpen(false);
    alert(`${count} niveau(x) ajouté(s) et enregistré(s) localement.`);
  };

  const closeAddFraisModal = () => {
    setIsAddFraisOpen(false);
    setNewFraisForm({ filtreCycle: "Primaire", niveau: "", montant: 0 });
  };

  const handleDeleteFrais = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce niveau de frais ?")) {
      setFraisScolaires(fraisScolaires.filter((f) => f.id !== id));
    }
  };

  const niveauxDisponiblesFiltreMatieres =
    matiereCycleFilter === "all"
      ? niveauxPourFiltreCycle("Les_deux")
      : matiereCycleFilter === "Les_deux"
        ? niveauxPourFiltreCycle("Les_deux")
        : niveauxPourFiltreCycle(matiereCycleFilter);

  const matieresFiltrees = matieres
    .filter((matiere) => {
      const matchSearch = matiere.nom.toLowerCase().includes(matiereSearch.toLowerCase());
      const matchCycle =
        matiereCycleFilter === "all" ||
        matiere.cycle === matiereCycleFilter ||
        matiere.cycle === "Les_deux";
      const matchNiveau =
        matiereNiveauFilter === "all" || matiere.niveaux.includes(matiereNiveauFilter);
      return matchSearch && matchCycle && matchNiveau;
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr-FR"));

  const isMatierePrimaireOnly = (matiere: MatiereItem): boolean =>
    matiere.cycle === "Primaire" &&
    matiere.niveaux.length > 0 &&
    matiere.niveaux.every((niveau) =>
      NIVEAUX_PRIMAIRE_CI.includes(niveau as (typeof NIVEAUX_PRIMAIRE_CI)[number])
    );

  const formatCoefficientLabel = (matiere: MatiereItem): string => {
    if (isMatierePrimaireOnly(matiere)) {
      return "N/A (primaire)";
    }
    if (
      matiere.cycle === "Les_deux" &&
      matiere.coefficientMode === "par_cycle" &&
      matiere.coefficientsParCycle
    ) {
      return `P:${matiere.coefficientsParCycle.primaire} / S:${matiere.coefficientsParCycle.secondaire}`;
    }
    if (matiere.coefficientMode === "par_niveau" && matiere.coefficientsParNiveau) {
      return "Par niveau";
    }
    return String(matiere.coefficient);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Configuration générale de l'établissement</p>
      </div>

      {/* Informations de l'école */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <School className="w-5 h-5 text-primary" />
          Informations de l'école
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nom de l'établissement <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={schoolInfo.nom}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, nom: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Directeur/Directrice <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={schoolInfo.directeur}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, directeur: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Adresse <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={schoolInfo.adresse}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, adresse: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Téléphone <span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              value={schoolInfo.telephone}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, telephone: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={schoolInfo.email}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Site Web
            </label>
            <input
              type="url"
              value={schoolInfo.siteWeb}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, siteWeb: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSaveSchoolInfo}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>
      </div>

      {/* Année scolaire */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-secondary" />
          Année scolaire
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Année <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={anneeScolaire.annee}
              onChange={(e) => setAnneeScolaire({ ...anneeScolaire, annee: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date de début <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={anneeScolaire.dateDebut}
              onChange={(e) => setAnneeScolaire({ ...anneeScolaire, dateDebut: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date de fin <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={anneeScolaire.dateFin}
              onChange={(e) => setAnneeScolaire({ ...anneeScolaire, dateFin: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id="active"
            checked={anneeScolaire.active}
            onChange={(e) => setAnneeScolaire({ ...anneeScolaire, active: e.target.checked })}
            className="w-4 h-4 text-primary border-input rounded focus:ring-2 focus:ring-ring"
          />
          <label htmlFor="active" className="text-sm font-medium text-foreground">
            Année scolaire active
          </label>
        </div>
      </div>

      {/* Configuration technique EDT */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-primary" />
              Configuration technique des emplois du temps
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Definis les horaires, pauses/recreations, jours actifs et demi-journees (MVP).
            </p>
          </div>
          <Link
            href="/dashboard/settings/timetable-config"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition"
          >
            Configurer l&apos;EDT
          </Link>
        </div>
      </div>

      {/* Trimestres */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-info" />
            Trimestres
          </h3>
          <button
            onClick={() => setIsAddTrimestreOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-info/10 hover:bg-info/20 text-info rounded-lg transition font-medium border border-info/20"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        <div className="space-y-3">
          {trimestres.map((trimestre) => (
            <div key={trimestre.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <p className="font-semibold text-foreground">{trimestre.nom}</p>
                <p className="text-sm text-muted-foreground">
                  Du {new Date(trimestre.dateDebut).toLocaleDateString('fr-FR')} au {new Date(trimestre.dateFin).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingTrimestre(trimestre)}
                  className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-primary"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frais scolaires par classe */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Coins className="w-5 h-5 text-warning" />
              Frais scolaires par niveau
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Montant annuel appliqué automatiquement lors de l'inscription d'un élève
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewFraisForm({ filtreCycle: "Primaire", niveau: "", montant: 0 });
                setFraisDraftQueue(loadFraisDraftFromStorage());
                setIsAddFraisOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-success/10 hover:bg-success/20 text-success rounded-lg transition font-medium border border-success/20"
            >
              <Plus className="w-4 h-4" />
              Ajouter niveau
            </button>
            <button
              onClick={handleSaveFrais}
              className="flex items-center gap-2 px-4 py-2.5 bg-warning/10 hover:bg-warning/20 text-warning rounded-lg transition font-medium border border-warning/20"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fraisScolaires.map((frais) => (
            <div key={frais.id} className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {frais.cycle}
                  </p>
                  <span className="text-sm font-semibold text-foreground">{frais.niveau}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingFrais({ id: frais.id, montant: frais.montant })}
                    className="p-1.5 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-primary"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFrais(frais.id)}
                    className="p-1.5 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingFrais?.id === frais.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editingFrais.montant}
                    onChange={(e) =>
                      setEditingFrais({
                        ...editingFrais,
                        montant: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="flex-1 px-3 py-2 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdateFrais(editingFrais.id, editingFrais.montant)}
                    className="px-3 py-2 bg-success hover:bg-success/90 text-white rounded-lg transition text-sm font-medium"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingFrais(null)}
                    className="px-3 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition text-sm font-medium"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-warning">{frais.montant.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">FCFA</span>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                par an
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-info/10 border border-info/20 rounded-lg">
          <p className="text-sm text-info flex items-start gap-2">
            <span className="font-bold">ℹ️</span>
            <span>
              Ces montants seront appliqués automatiquement lors de l'inscription d'un nouvel élève.
              Un dossier financier sera créé dans le module Comptabilité avec le montant correspondant au niveau de classe.
            </span>
          </p>
        </div>

        {/* Modal ajout niveau */}
        {isAddFraisOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAddFraisModal}></div>
            <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <h3 className="text-lg font-semibold text-foreground mb-1">Ajouter un niveau de frais</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Les lignes ajoutées restent en brouillon (navigateur) jusqu&apos;à « Enregistrer les ajouts » — prêt pour un
                envoi Supabase ultérieur.
              </p>

              <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Type de cycle <span className="text-danger">*</span>
                    </label>
                    <select
                      value={newFraisForm.filtreCycle}
                      onChange={(e) => {
                        const filtreCycle = e.target.value as FiltreCycleFrais;
                        setNewFraisForm({ filtreCycle, niveau: "", montant: newFraisForm.montant });
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                    >
                      <option value="Primaire">Primaire (Maternelle au CM2)</option>
                      <option value="Secondaire">Secondaire (6ème à la Terminale)</option>
                      <option value="Les_deux">Les deux (tous les niveaux)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Niveau de classe <span className="text-danger">*</span>
                    </label>
                    <select
                      value={newFraisForm.niveau}
                      onChange={(e) =>
                        setNewFraisForm({ ...newFraisForm, niveau: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                    >
                      <option value="">Sélectionner un niveau</option>
                      {niveauxPourFiltreCycle(newFraisForm.filtreCycle).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Montant annuel (FCFA) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      value={newFraisForm.montant || ""}
                      onChange={(e) =>
                        setNewFraisForm({
                          ...newFraisForm,
                          montant: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                      placeholder="50000"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddFraisToDraft}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-2.5 font-medium text-success transition hover:bg-success/20"
                  >
                    <ListPlus className="h-4 w-4" />
                    Ajouter à la liste
                  </button>
                </div>

                <aside className="w-full shrink-0 rounded-xl border border-border bg-muted/20 p-4 lg:w-[240px] lg:self-stretch">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      En attente
                    </p>
                    {fraisDraftQueue.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearDraftQueue}
                        className="text-xs font-medium text-danger hover:underline"
                      >
                        Tout vider
                      </button>
                    )}
                  </div>
                  {fraisDraftQueue.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun niveau pour l&apos;instant.</p>
                  ) : (
                    <ul className="max-h-[min(280px,40vh)] space-y-2 overflow-y-auto pr-1">
                      {fraisDraftQueue.map((line) => (
                        <li
                          key={line.draftId}
                          className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{line.niveau}</p>
                            <p className="text-xs text-muted-foreground">{line.cycle}</p>
                            <p className="text-xs font-semibold text-warning">
                              {line.montant.toLocaleString()} FCFA
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftLine(line.draftId)}
                            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-danger"
                            aria-label={`Retirer ${line.niveau}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </aside>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeAddFraisModal}
                  className="px-4 py-2 bg-background border border-input hover:bg-accent rounded-lg transition font-medium"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  disabled={fraisDraftQueue.length === 0}
                  onClick={handleValidateFraisDraft}
                  className="px-4 py-2 bg-success hover:bg-success/90 text-white rounded-lg transition font-medium disabled:pointer-events-none disabled:opacity-50"
                >
                  Enregistrer les ajouts
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Matières */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-success" />
              Matières & Coefficients
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Gestion par cycle et niveaux pour les écoles primaire/secondaire mixtes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCoeffGrilleModalOpen(true)}
              className="text-sm text-primary hover:underline"
            >
              Grille officielle
            </button>
            <button
              onClick={() => setIsAddMatiereOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-success/10 hover:bg-success/20 text-success rounded-lg transition font-medium border border-success/20"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input
            type="search"
            value={matiereSearch}
            onChange={(e) => setMatiereSearch(e.target.value)}
            placeholder="Rechercher une matière..."
            className="px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={matiereCycleFilter}
            onChange={(e) => {
              setMatiereCycleFilter(e.target.value as "all" | CycleMatiere);
              setMatiereNiveauFilter("all");
            }}
            className="px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Tous les cycles</option>
            <option value="Primaire">Primaire</option>
            <option value="Secondaire">Secondaire</option>
            <option value="Les_deux">Les deux</option>
          </select>
          <select
            value={matiereNiveauFilter}
            onChange={(e) => setMatiereNiveauFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Tous les niveaux</option>
            {niveauxDisponiblesFiltreMatieres.map((niveau) => (
              <option key={niveau} value={niveau}>
                {niveau}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Matière</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Cycle</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Niveaux concernés</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Coefficient</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Statut</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {matieresFiltrees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Aucune matière ne correspond aux filtres actuels.
                  </td>
                </tr>
              ) : (
                matieresFiltrees.map((matiere) => (
                  <tr key={matiere.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full"
                          style={{ backgroundColor: matiere.couleur }}
                        ></span>
                        <span className="font-medium text-foreground">{matiere.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center rounded-md bg-info/10 px-2 py-0.5 text-info">
                        {matiere.cycle === "Les_deux" ? "Les deux" : matiere.cycle}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {matiere.niveaux.length > 3
                        ? `${matiere.niveaux.slice(0, 3).join(", ")} +${matiere.niveaux.length - 3}`
                        : matiere.niveaux.join(", ")}
                      {matiere.coefficientMode === "par_niveau" &&
                        matiere.coefficientsParNiveau && (
                          <span className="block text-xs text-info mt-1">
                            {Object.entries(matiere.coefficientsParNiveau)
                              .slice(0, 3)
                              .map(([niveau, coef]) => `${niveau}:${coef}`)
                              .join(" • ")}
                          </span>
                        )}
                      {matiere.niveaux.includes("Terminale") &&
                        matiere.seriesTerminale &&
                        matiere.seriesTerminale.length > 0 && (
                          <span className="block text-xs text-info mt-1">
                            Séries: {matiere.seriesTerminale.join(", ")}
                          </span>
                        )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      {isMatierePrimaireOnly(matiere) ? (
                        <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-muted-foreground">
                          {formatCoefficientLabel(matiere)}
                        </span>
                      ) : (
                        <span className="text-foreground">{formatCoefficientLabel(matiere)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => handleToggleMatiereActive(matiere.id)}
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          matiere.active
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {matiere.active ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingMatiere(matiere)}
                          className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-primary"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMatiere(matiere.id)}
                          className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-danger"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isCoeffGrilleModalOpen}
        onClose={() => setIsCoeffGrilleModalOpen(false)}
        title="Grille des coefficients (référence)"
        size="xl"
      >
        <div className="space-y-4">
          <CoefficientGrilleReferencePanel
            rows={coeffGrilleRows}
            onUpdateRow={handleUpdateCoeffGrilleRow}
            search={coeffSearch}
            onSearchChange={setCoeffSearch}
            cycleFilter={coeffCycleFilter}
            onCycleFilterChange={setCoeffCycleFilter}
            niveauFilter={coeffNiveauFilter}
            onNiveauFilterChange={setCoeffNiveauFilter}
            serieFilter={coeffSerieFilter}
            onSerieFilterChange={setCoeffSerieFilter}
          />
          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Les modifications sont enregistrées localement (MVP), identiques sur la page dédiée.
            </p>
            <Link
              href="/dashboard/settings/coefficients-reference"
              onClick={() => setIsCoeffGrilleModalOpen(false)}
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition"
            >
              Ouvrir en plein écran
            </Link>
          </div>
        </div>
      </Modal>

      <AddMatiereModal
        isOpen={isAddMatiereOpen}
        onClose={() => setIsAddMatiereOpen(false)}
        onSubmit={handleAddMatiere}
        onSubmitBatch={handleAddMatieresBatch}
        existingMatieres={matieres.map((m) => ({ nom: m.nom, cycle: m.cycle }))}
      />

      {editingMatiere && (
        <AddMatiereModal
          isOpen={!!editingMatiere}
          onClose={() => setEditingMatiere(null)}
          onSubmit={handleEditMatiere}
          matiere={editingMatiere}
          existingMatieres={matieres.map((m) => ({ nom: m.nom, cycle: m.cycle }))}
        />
      )}

      <AddTrimestreModal
        isOpen={isAddTrimestreOpen}
        onClose={() => setIsAddTrimestreOpen(false)}
        onSubmit={handleAddTrimestre}
      />

      {editingTrimestre && (
        <AddTrimestreModal
          isOpen={!!editingTrimestre}
          onClose={() => setEditingTrimestre(null)}
          onSubmit={handleEditTrimestre}
          trimestre={editingTrimestre}
        />
      )}
    </div>
  );
}
