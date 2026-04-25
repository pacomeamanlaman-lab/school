"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { BookOpen, Hash } from "lucide-react";
import {
  NIVEAUX_PRIMAIRE_CI,
  NIVEAUX_SECONDAIRE_CI,
  niveauxPourFiltreCycle,
} from "@/lib/cycles-scolaires-ci";

interface AddMatiereModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  matiere?: any;
}

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

export default function AddMatiereModal({ isOpen, onClose, onSubmit, matiere }: AddMatiereModalProps) {
  const [formData, setFormData] = useState({
    nom: "",
    coefficient: 1,
    couleur: "#00aef0",
    cycle: "Primaire",
    niveaux: [...NIVEAUX_PRIMAIRE_CI] as string[],
    active: true,
  });

  useEffect(() => {
    if (matiere) {
      setFormData({
        nom: matiere.nom || "",
        coefficient: matiere.coefficient || 1,
        couleur: matiere.couleur || "#00aef0",
        cycle: matiere.cycle || "Primaire",
        niveaux: matiere.niveaux || [...NIVEAUX_PRIMAIRE_CI],
        active: matiere.active !== false,
      });
    } else {
      setFormData({
        nom: "",
        coefficient: 1,
        couleur: "#00aef0",
        cycle: "Primaire",
        niveaux: [...NIVEAUX_PRIMAIRE_CI],
        active: true,
      });
    }
  }, [matiere, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(matiere ? { ...matiere, ...formData } : formData);
    }
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === "coefficient" ? parseInt(e.target.value) : e.target.value;
    if (e.target.name === "cycle") {
      const cycle = value as "Primaire" | "Secondaire" | "Les_deux";
      const niveaux =
        cycle === "Primaire"
          ? [...NIVEAUX_PRIMAIRE_CI]
          : cycle === "Secondaire"
            ? [...NIVEAUX_SECONDAIRE_CI]
            : niveauxPourFiltreCycle("Les_deux");
      setFormData({ ...formData, cycle, niveaux });
      return;
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const niveauxDisponibles =
    formData.cycle === "Primaire"
      ? [...NIVEAUX_PRIMAIRE_CI]
      : formData.cycle === "Secondaire"
        ? [...NIVEAUX_SECONDAIRE_CI]
        : niveauxPourFiltreCycle("Les_deux");

  const toggleNiveau = (niveau: string) => {
    const exists = formData.niveaux.includes(niveau);
    const nextNiveaux = exists
      ? formData.niveaux.filter((n) => n !== niveau)
      : [...formData.niveaux, niveau];
    setFormData({ ...formData, niveaux: nextNiveaux });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={matiere ? "Modifier la matière" : "Ajouter une matière"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nom de la matière <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              placeholder="Mathématiques"
            />
          </div>
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
              onChange={handleChange}
              required
              min="1"
              max="5"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Coefficient entre 1 et 5</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Cycle pédagogique <span className="text-danger">*</span>
          </label>
          <select
            name="cycle"
            value={formData.cycle}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
          >
            <option value="Primaire">Primaire</option>
            <option value="Secondaire">Secondaire</option>
            <option value="Les_deux">Les deux</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Niveaux concernés <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {niveauxDisponibles.map((niveau) => (
              <label
                key={niveau}
                className="flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={formData.niveaux.includes(niveau)}
                  onChange={() => toggleNiveau(niveau)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <span>{niveau}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Sélectionnez au moins un niveau.</p>
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
                onClick={() => setFormData({ ...formData, couleur: couleur.valeur })}
                className={`w-full h-10 rounded-lg border-2 transition ${
                  formData.couleur === couleur.valeur ? "border-primary scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: couleur.valeur }}
                title={couleur.nom}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="color"
              name="couleur"
              value={formData.couleur}
              onChange={handleChange}
              className="w-12 h-10 rounded-lg border border-input cursor-pointer"
            />
            <span className="text-sm text-muted-foreground">ou choisir une couleur personnalisée</span>
          </div>
        </div>

        {/* Actions */}
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
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
          >
            {matiere ? "Modifier" : "Ajouter"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
