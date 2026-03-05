"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { User, Mail, Phone, BookOpen, School } from "lucide-react";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  staff?: any;
}

export default function AddStaffModal({ isOpen, onClose, onSubmit, staff }: AddStaffModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    role: "Enseignant",
    matiere: "",
    classe: "",
    email: "",
    phone: "",
    adresse: "",
    dateEmbauche: "",
    statut: "active",
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        firstName: staff.firstName || "",
        lastName: staff.lastName || "",
        role: staff.role || "Enseignant",
        matiere: staff.matiere || "",
        classe: staff.classe || "",
        email: staff.email || "",
        phone: staff.phone || "",
        adresse: staff.adresse || "",
        dateEmbauche: staff.dateEmbauche || "",
        statut: staff.statut || "active",
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        role: "Enseignant",
        matiere: "",
        classe: "",
        email: "",
        phone: "",
        adresse: "",
        dateEmbauche: "",
        statut: "active",
      });
    }
  }, [staff, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(staff ? { ...staff, ...formData } : formData);
    }
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isEnseignant = formData.role === "Enseignant";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={staff ? "Modifier le membre du personnel" : "Ajouter un membre du personnel"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations personnelles */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Informations personnelles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Prénom <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="Marie"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nom <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="Dupont"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="marie.dupont@ecole.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Téléphone <span className="text-danger">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Adresse
            </label>
            <textarea
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition resize-none"
              placeholder="12 Rue de l'École, 75001 Paris"
            />
          </div>
        </div>

        {/* Informations professionnelles */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Informations professionnelles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Rôle <span className="text-danger">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              >
                <option value="Enseignant">Enseignant</option>
                <option value="Directeur">Directeur</option>
                <option value="Secrétaire">Secrétaire</option>
                <option value="Surveillant">Surveillant</option>
                <option value="Personnel administratif">Personnel administratif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date d'embauche
              </label>
              <input
                type="date"
                name="dateEmbauche"
                value={formData.dateEmbauche}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
            </div>

            {isEnseignant && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Matière enseignée
                  </label>
                  <input
                    type="text"
                    name="matiere"
                    value={formData.matiere}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                    placeholder="Mathématiques"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Classe titulaire
                  </label>
                  <select
                    name="classe"
                    value={formData.classe}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                  >
                    <option value="">Aucune</option>
                    <option value="CP - Classe A">CP - Classe A</option>
                    <option value="CE1 - Classe A">CE1 - Classe A</option>
                    <option value="CE2 - Classe A">CE2 - Classe A</option>
                    <option value="CM1 - Classe A">CM1 - Classe A</option>
                    <option value="CM2 - Classe A">CM2 - Classe A</option>
                    <option value="6ème - Classe A">6ème - Classe A</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Statut
              </label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              >
                <option value="active">Actif</option>
                <option value="conge">En congé</option>
                <option value="suspendu">Suspendu</option>
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
                Les identifiants de connexion seront générés automatiquement et envoyés par email.
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
            {staff ? "Modifier" : "Ajouter le membre"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
