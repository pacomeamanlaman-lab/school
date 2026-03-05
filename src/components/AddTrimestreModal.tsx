"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Calendar } from "lucide-react";

interface AddTrimestreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  trimestre?: any;
}

export default function AddTrimestreModal({ isOpen, onClose, onSubmit, trimestre }: AddTrimestreModalProps) {
  const [formData, setFormData] = useState({
    nom: "",
    dateDebut: "",
    dateFin: "",
  });

  useEffect(() => {
    if (trimestre) {
      setFormData({
        nom: trimestre.nom || "",
        dateDebut: trimestre.dateDebut || "",
        dateFin: trimestre.dateFin || "",
      });
    } else {
      setFormData({
        nom: "",
        dateDebut: "",
        dateFin: "",
      });
    }
  }, [trimestre, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(trimestre ? { ...trimestre, ...formData } : formData);
    }
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={trimestre ? "Modifier le trimestre" : "Ajouter un trimestre"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nom du trimestre <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              placeholder="Trimestre 1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date de début <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              name="dateDebut"
              value={formData.dateDebut}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date de fin <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              name="dateFin"
              value={formData.dateFin}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
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
            {trimestre ? "Modifier" : "Ajouter"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
