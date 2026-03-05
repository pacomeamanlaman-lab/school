"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { BookOpen, Hash } from "lucide-react";

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
  });

  useEffect(() => {
    if (matiere) {
      setFormData({
        nom: matiere.nom || "",
        coefficient: matiere.coefficient || 1,
        couleur: matiere.couleur || "#00aef0",
      });
    } else {
      setFormData({
        nom: "",
        coefficient: 1,
        couleur: "#00aef0",
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
    setFormData({ ...formData, [e.target.name]: value });
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
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
          >
            {matiere ? "Modifier" : "Ajouter"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
