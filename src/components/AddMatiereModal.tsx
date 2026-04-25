"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { BookOpen, Hash, ListPlus, Trash2 } from "lucide-react";
import {
  NIVEAUX_PRIMAIRE_CI,
  NIVEAUX_SECONDAIRE_CI,
  niveauxPourFiltreCycle,
} from "@/lib/cycles-scolaires-ci";

type CycleMatiere = "Primaire" | "Secondaire" | "Les_deux";

type MatiereFormData = {
  nom: string;
  nomOption: string;
  coefficient: number;
  coefficientMode: "unique" | "par_cycle";
  coefficientPrimaire: number;
  coefficientSecondaire: number;
  couleur: string;
  cycle: CycleMatiere;
  niveaux: string[];
  active: boolean;
};

type MatiereDraftLine = MatiereFormData & { draftId: string };

interface AddMatiereModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  onSubmitBatch?: (data: any[]) => void;
  matiere?: any;
  existingMatieres?: Array<{ nom: string; cycle: CycleMatiere }>;
}

const MATIERE_DRAFT_STORAGE_KEY = "school_matieres_draft_queue";

const couleursPredefinies = [
  { nom: "Bleu", valeur: "#00aef0" },
  { nom: "Vert turquoise", valeur: "#10a7aa" },
  { nom: "Vert", valeur: "#10b981" },
  { nom: "Jaune", valeur: "#f59e0b" },
  { nom: "Orange", valeur: "#f97316" },
  { nom: "Rouge", valeur: "#ef4444" },
  { nom: "Rose", valeur: "#ec4899" },
  { nom: "Violet", valeur: "#8b5cf6" },
  { nom: "Indigo", valeur: "#6366f1" },
  { nom: "Gris", valeur: "#6b7280" },
];

const MATIERES_PREDEFINIES: Record<
  CycleMatiere,
  Array<{ nom: string; coefficient: number }>
> = {
  Primaire: [
    { nom: "Français", coefficient: 3 },
    { nom: "Mathématiques", coefficient: 3 },
    { nom: "Sciences", coefficient: 2 },
    { nom: "Histoire-Géo", coefficient: 2 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "EPS", coefficient: 1 },
    { nom: "Arts plastiques", coefficient: 1 },
    { nom: "Musique", coefficient: 1 },
  ],
  Secondaire: [
    { nom: "Français", coefficient: 3 },
    { nom: "Mathématiques", coefficient: 3 },
    { nom: "Physique-Chimie", coefficient: 2 },
    { nom: "SVT", coefficient: 2 },
    { nom: "Histoire-Géo", coefficient: 2 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "EPS", coefficient: 1 },
    { nom: "Informatique", coefficient: 1 },
  ],
  Les_deux: [
    { nom: "Français", coefficient: 3 },
    { nom: "Mathématiques", coefficient: 3 },
    { nom: "Sciences", coefficient: 2 },
    { nom: "Histoire-Géo", coefficient: 2 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "EPS", coefficient: 1 },
    { nom: "Arts plastiques", coefficient: 1 },
    { nom: "Musique", coefficient: 1 },
  ],
};

const emptyForm = (): MatiereFormData => ({
  nom: "",
  nomOption: "",
  coefficient: 1,
  coefficientMode: "unique",
  coefficientPrimaire: 1,
  coefficientSecondaire: 1,
  couleur: "#00aef0",
  cycle: "Primaire",
  niveaux: [...NIVEAUX_PRIMAIRE_CI],
  active: true,
});

function newDraftId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function saveDraftQueue(queue: MatiereDraftLine[]): void {
  if (typeof window !== "undefined") {
    if (queue.length === 0) {
      localStorage.removeItem(MATIERE_DRAFT_STORAGE_KEY);
    } else {
      localStorage.setItem(MATIERE_DRAFT_STORAGE_KEY, JSON.stringify(queue));
    }
  }
}

function loadDraftQueue(): MatiereDraftLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MATIERE_DRAFT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((r) => {
        const row = r as Record<string, unknown>;
        const nom = String(row.nom ?? "").trim();
        const coefficient = Number(row.coefficient) || 1;
        const coefficientMode =
          row.coefficientMode === "par_cycle" ? "par_cycle" : "unique";
        const coefficientPrimaire = Number(row.coefficientPrimaire) || coefficient;
        const coefficientSecondaire = Number(row.coefficientSecondaire) || coefficient;
        const couleur = String(row.couleur ?? "#00aef0");
        const cycle = row.cycle as CycleMatiere;
        const niveaux = Array.isArray(row.niveaux)
          ? row.niveaux.map(String).filter(Boolean)
          : [];
        const active = row.active !== false;
        if (!nom || niveaux.length === 0) return null;
        return {
          draftId: typeof row.draftId === "string" ? row.draftId : newDraftId(),
          nom,
          nomOption: nom,
          coefficient,
          coefficientMode,
          coefficientPrimaire,
          coefficientSecondaire,
          couleur,
          cycle: cycle || "Primaire",
          niveaux,
          active,
        } satisfies MatiereDraftLine;
      })
      .filter((x): x is MatiereDraftLine => x !== null);
  } catch {
    return [];
  }
}

export default function AddMatiereModal({
  isOpen,
  onClose,
  onSubmit,
  onSubmitBatch,
  matiere,
  existingMatieres = [],
}: AddMatiereModalProps) {
  const isEditMode = !!matiere;
  const [formData, setFormData] = useState<MatiereFormData>(emptyForm);
  const [draftQueue, setDraftQueue] = useState<MatiereDraftLine[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode) {
      const cycle = (matiere.cycle || "Primaire") as CycleMatiere;
      const nom = matiere.nom || "";
      const isPredef = MATIERES_PREDEFINIES[cycle].some((m) => m.nom === nom);
      setFormData({
        nom,
        nomOption: isPredef ? nom : "__custom__",
        coefficient: matiere.coefficient || 1,
        coefficientMode: matiere.coefficientMode || "unique",
        coefficientPrimaire:
          matiere.coefficientsParCycle?.primaire ?? matiere.coefficient ?? 1,
        coefficientSecondaire:
          matiere.coefficientsParCycle?.secondaire ?? matiere.coefficient ?? 1,
        couleur: matiere.couleur || "#00aef0",
        cycle,
        niveaux: matiere.niveaux || [...NIVEAUX_PRIMAIRE_CI],
        active: matiere.active !== false,
      });
    } else {
      setFormData(emptyForm());
      setDraftQueue(loadDraftQueue());
    }
  }, [isOpen, isEditMode, matiere]);

  const niveauxDisponibles =
    formData.cycle === "Primaire"
      ? [...NIVEAUX_PRIMAIRE_CI]
      : formData.cycle === "Secondaire"
        ? [...NIVEAUX_SECONDAIRE_CI]
        : niveauxPourFiltreCycle("Les_deux");
  const matieresPredefinies = MATIERES_PREDEFINIES[formData.cycle];

  const persistQueue = (next: MatiereDraftLine[]) => {
    setDraftQueue(next);
    saveDraftQueue(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const numericFields = ["coefficient", "coefficientPrimaire", "coefficientSecondaire"];
    const value = numericFields.includes(e.target.name)
      ? parseInt(e.target.value, 10) || 0
      : e.target.value;
    if (e.target.name === "cycle") {
      const cycle = value as CycleMatiere;
      const niveaux =
        cycle === "Primaire"
          ? [...NIVEAUX_PRIMAIRE_CI]
          : cycle === "Secondaire"
            ? [...NIVEAUX_SECONDAIRE_CI]
            : niveauxPourFiltreCycle("Les_deux");
      const defaultMatiere = MATIERES_PREDEFINIES[cycle][0];
      setFormData({
        ...formData,
        cycle,
        niveaux,
        nomOption: defaultMatiere?.nom || "",
        nom: defaultMatiere?.nom || "",
        coefficient: defaultMatiere?.coefficient || formData.coefficient,
        coefficientMode: "unique",
        coefficientPrimaire: defaultMatiere?.coefficient || formData.coefficient,
        coefficientSecondaire: defaultMatiere?.coefficient || formData.coefficient,
      });
      return;
    }
    if (e.target.name === "coefficientMode") {
      const nextMode = value as "unique" | "par_cycle";
      setFormData({
        ...formData,
        coefficientMode: nextMode,
        coefficientPrimaire:
          nextMode === "par_cycle" ? formData.coefficientPrimaire : formData.coefficient,
        coefficientSecondaire:
          nextMode === "par_cycle" ? formData.coefficientSecondaire : formData.coefficient,
      });
      return;
    }
    if (e.target.name === "nomOption") {
      const nomOption = value as string;
      if (nomOption === "__custom__") {
        setFormData({ ...formData, nomOption, nom: "" });
        return;
      }
      const selected = matieresPredefinies.find((m) => m.nom === nomOption);
      setFormData({
        ...formData,
        nomOption,
        nom: nomOption,
        coefficient: selected?.coefficient ?? formData.coefficient,
        coefficientPrimaire: selected?.coefficient ?? formData.coefficientPrimaire,
        coefficientSecondaire: selected?.coefficient ?? formData.coefficientSecondaire,
      });
      return;
    }
    if (e.target.name === "active") {
      const isActive =
        (e.target as HTMLInputElement).type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value === "active";
      setFormData({ ...formData, active: isActive });
      return;
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const toggleNiveau = (niveau: string) => {
    const exists = formData.niveaux.includes(niveau);
    const nextNiveaux = exists
      ? formData.niveaux.filter((n) => n !== niveau)
      : [...formData.niveaux, niveau];
    setFormData({ ...formData, niveaux: nextNiveaux });
  };

  const validateForm = (): string | null => {
    if (!formData.nom.trim()) return "Le nom de la matière est requis.";
    if (formData.coefficient < 1 || formData.coefficient > 5) return "Le coefficient doit être entre 1 et 5.";
    if (
      formData.cycle === "Les_deux" &&
      formData.coefficientMode === "par_cycle" &&
      (formData.coefficientPrimaire < 1 ||
        formData.coefficientPrimaire > 5 ||
        formData.coefficientSecondaire < 1 ||
        formData.coefficientSecondaire > 5)
    ) {
      return "Les coefficients primaire et secondaire doivent être entre 1 et 5.";
    }
    if (formData.niveaux.length === 0) return "Sélectionnez au moins un niveau.";
    return null;
  };

  const isDuplicateInExisting = (nom: string, cycle: CycleMatiere): boolean =>
    existingMatieres.some(
      (m) => m.nom.trim().toLowerCase() === nom.trim().toLowerCase() && m.cycle === cycle
    );

  const isDuplicateInQueue = (nom: string, cycle: CycleMatiere): boolean =>
    draftQueue.some(
      (m) => m.nom.trim().toLowerCase() === nom.trim().toLowerCase() && m.cycle === cycle
    );

  const buildMatierePayload = (data: MatiereFormData) => {
    const base = {
      nom: data.nom.trim(),
      coefficientMode: data.coefficientMode,
      coefficient:
        data.cycle === "Les_deux" && data.coefficientMode === "par_cycle"
          ? data.coefficientPrimaire
          : data.coefficient,
      couleur: data.couleur,
      cycle: data.cycle,
      niveaux: data.niveaux,
      active: data.active,
    };
    if (data.cycle === "Les_deux" && data.coefficientMode === "par_cycle") {
      return {
        ...base,
        coefficientsParCycle: {
          primaire: data.coefficientPrimaire,
          secondaire: data.coefficientSecondaire,
        },
      };
    }
    return {
      ...base,
      coefficientsParCycle: undefined,
      coefficientPrimaire: data.coefficient,
      coefficientSecondaire: data.coefficient,
    };
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }
    onSubmit?.({ ...matiere, ...buildMatierePayload(formData) });
    onClose();
  };

  const handleAddToQueue = () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }
    const nom = formData.nom.trim();
    if (isDuplicateInExisting(nom, formData.cycle)) {
      alert("Cette matière existe déjà dans ce cycle.");
      return;
    }
    if (isDuplicateInQueue(nom, formData.cycle)) {
      alert("Cette matière est déjà dans la liste d'attente.");
      return;
    }
    const nextLine: MatiereDraftLine = { ...formData, nom, draftId: newDraftId() };
    persistQueue([...draftQueue, nextLine]);
    setFormData({ ...emptyForm(), coefficient: formData.coefficient });
  };

  const handleRemoveQueueLine = (draftId: string) => {
    persistQueue(draftQueue.filter((l) => l.draftId !== draftId));
  };

  const handleClearQueue = () => {
    persistQueue([]);
  };

  const handleValidateQueue = () => {
    if (draftQueue.length === 0) {
      alert("Ajoutez au moins une matière à la liste.");
      return;
    }
    onSubmitBatch?.(
      draftQueue.map(({ draftId: _draftId, ...line }) => buildMatierePayload(line))
    );
    persistQueue([]);
    setFormData(emptyForm());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Modifier la matière" : "Ajouter des matières"}
      size={isEditMode ? "md" : "lg"}
    >
      {isEditMode ? (
        <form onSubmit={handleSubmitEdit} className="space-y-6">
          <MatiereFormFields
            formData={formData}
            niveauxDisponibles={niveauxDisponibles}
            onChange={handleChange}
            onToggleNiveau={toggleNiveau}
            onColorSelect={(couleur) => setFormData((prev) => ({ ...prev, couleur }))}
            matieresPredefinies={matieresPredefinies}
          />
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-background border border-input hover:bg-accent rounded-lg transition font-medium text-foreground"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={formData.niveaux.length === 0}
              className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20 disabled:pointer-events-none disabled:opacity-50"
            >
              Modifier
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground">
            Ajoutez plusieurs matières dans cette fenêtre, puis validez en bloc.
          </p>
          <div className="flex flex-col gap-5 lg:flex-row">
            <div className="flex-1 min-w-0">
              <MatiereFormFields
                formData={formData}
                niveauxDisponibles={niveauxDisponibles}
                onChange={handleChange}
                onToggleNiveau={toggleNiveau}
                onColorSelect={(couleur) => setFormData((prev) => ({ ...prev, couleur }))}
                matieresPredefinies={matieresPredefinies}
              />
              <button
                type="button"
                onClick={handleAddToQueue}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-2.5 font-medium text-success transition hover:bg-success/20"
              >
                <ListPlus className="h-4 w-4" />
                Ajouter à la liste
              </button>
            </div>
            <aside className="w-full rounded-xl border border-border bg-muted/20 p-4 lg:w-[260px]">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">En attente</p>
                {draftQueue.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearQueue}
                    className="text-xs font-medium text-danger hover:underline"
                  >
                    Tout vider
                  </button>
                )}
              </div>
              {draftQueue.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune matière pour l'instant.</p>
              ) : (
                <ul className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
                  {draftQueue.map((line) => (
                    <li
                      key={line.draftId}
                      className="rounded-lg border border-border bg-card px-2.5 py-2 text-sm"
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{line.nom}</p>
                          <p className="text-xs text-muted-foreground">
                            {line.cycle === "Les_deux" ? "Les deux" : line.cycle} •{" "}
                            {line.cycle === "Les_deux" && line.coefficientMode === "par_cycle"
                              ? `P:${line.coefficientPrimaire} / S:${line.coefficientSecondaire}`
                              : `Coef ${line.coefficient}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQueueLine(line.draftId)}
                          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-danger"
                          aria-label={`Retirer ${line.nom}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {line.niveaux.length > 2
                          ? `${line.niveaux.slice(0, 2).join(", ")} +${line.niveaux.length - 2}`
                          : line.niveaux.join(", ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
          <div className="flex flex-col-reverse gap-3 pt-4 border-t border-border sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-background border border-input hover:bg-accent rounded-lg transition font-medium"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleValidateQueue}
              disabled={draftQueue.length === 0}
              className="px-4 py-2 bg-success hover:bg-success/90 text-white rounded-lg transition font-medium disabled:pointer-events-none disabled:opacity-50"
            >
              Enregistrer les ajouts
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function MatiereFormFields({
  formData,
  niveauxDisponibles,
  onChange,
  onToggleNiveau,
  onColorSelect,
  matieresPredefinies,
}: {
  formData: MatiereFormData;
  niveauxDisponibles: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onToggleNiveau: (niveau: string) => void;
  onColorSelect: (couleur: string) => void;
  matieresPredefinies: Array<{ nom: string; coefficient: number }>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Cycle pédagogique <span className="text-danger">*</span>
          </label>
          <select
            name="cycle"
            value={formData.cycle}
            onChange={onChange}
            className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
          >
            <option value="Primaire">Primaire</option>
            <option value="Secondaire">Secondaire</option>
            <option value="Les_deux">Les deux</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nom de la matière <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              name="nomOption"
              value={formData.nomOption || ""}
              onChange={onChange}
              required
              className="w-full appearance-none pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            >
              <option value="">Choisir une matière...</option>
              {matieresPredefinies.map((m) => (
                <option key={m.nom} value={m.nom}>
                  {m.nom}
                </option>
              ))}
              <option value="__custom__">Autre (personnalisée)</option>
            </select>
          </div>
          {formData.nomOption === "__custom__" && (
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={onChange}
              required
              className="mt-2 w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              placeholder="Saisir une matière personnalisée"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Coefficient <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="number"
              name="coefficient"
              value={formData.coefficient}
              onChange={onChange}
              required
              min="1"
              max="5"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Le coefficient proposé est modifiable selon votre besoin.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Statut
          </label>
          <select
            name="active"
            value={formData.active ? "active" : "inactive"}
            onChange={onChange}
            className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Une matière inactive reste disponible pour l'historique et peut être réactivée.
          </p>
        </div>
      </div>

      {formData.cycle === "Les_deux" && (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <label className="block text-sm font-medium text-foreground mb-2">
            Mode coefficient (cycle mixte)
          </label>
          <select
            name="coefficientMode"
            value={formData.coefficientMode}
            onChange={onChange}
            className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="unique">Coefficient unique (tous niveaux)</option>
            <option value="par_cycle">Coefficient par cycle (Primaire / Secondaire)</option>
          </select>

          {formData.coefficientMode === "par_cycle" && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Coefficient Primaire
                </label>
                <input
                  type="number"
                  name="coefficientPrimaire"
                  value={formData.coefficientPrimaire}
                  min="1"
                  max="5"
                  onChange={onChange}
                  className="w-full px-3 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Coefficient Secondaire
                </label>
                <input
                  type="number"
                  name="coefficientSecondaire"
                  value={formData.coefficientSecondaire}
                  min="1"
                  max="5"
                  onChange={onChange}
                  className="w-full px-3 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Niveaux concernés <span className="text-danger">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {niveauxDisponibles.map((niveau) => (
            <label
              key={niveau}
              className="flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={formData.niveaux.includes(niveau)}
                onChange={() => onToggleNiveau(niveau)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <span>{niveau}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Couleur <span className="text-danger">*</span>
        </label>
        <div className="grid grid-cols-5 gap-2">
          {couleursPredefinies.map((couleur) => (
            <button
              key={couleur.valeur}
              type="button"
              onClick={() => onColorSelect(couleur.valeur)}
              className={`w-full h-10 rounded-lg border-2 transition ${
                formData.couleur === couleur.valeur ? "border-primary scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: couleur.valeur }}
              title={couleur.nom}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
