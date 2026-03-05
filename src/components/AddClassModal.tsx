"use client";

import { useState } from "react";
import Modal from "./Modal";
import { School, Users, MapPin, User } from "lucide-react";

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddClassModal({ isOpen, onClose }: AddClassModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    niveau: "",
    capacite: 30,
    titulaire: "",
    salle: "",
    anneeScolaire: "2024-2025",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Ajouter la classe à Supabase
    console.log("Nouvelle classe:", formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === "number" ? parseInt(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer une classe" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de base */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <School className="w-4 h-4" />
            Informations de la classe
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Niveau <span className="text-danger">*</span>
              </label>
              <select
                name="niveau"
                value={formData.niveau}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              >
                <option value="">Sélectionner un niveau</option>
                <option value="CP">CP</option>
                <option value="CE1">CE1</option>
                <option value="CE2">CE2</option>
                <option value="CM1">CM1</option>
                <option value="CM2">CM2</option>
                <option value="6ème">6ème</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nom de la classe <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="Classe A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Capacité maximale <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                name="capacite"
                value={formData.capacite}
                onChange={handleChange}
                required
                min="1"
                max="50"
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Salle
              </label>
              <input
                type="text"
                name="salle"
                value={formData.salle}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="Salle 101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Année scolaire <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="anneeScolaire"
                value={formData.anneeScolaire}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="2024-2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Titulaire
              </label>
              <select
                name="titulaire"
                value={formData.titulaire}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              >
                <option value="">Aucun (à définir plus tard)</option>
                <option value="Mme Dupont">Mme Dupont</option>
                <option value="M. Martin">M. Martin</option>
                <option value="Mme Bernard">Mme Bernard</option>
                <option value="M. Petit">M. Petit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Info complémentaire */}
        <div className="bg-muted border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-info/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <School className="w-4 h-4 text-info" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Information</p>
              <p className="text-xs text-muted-foreground mt-1">
                Vous pourrez affecter les élèves à cette classe après sa création.
              </p>
            </div>
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
            Créer la classe
          </button>
        </div>
      </form>
    </Modal>
  );
}
