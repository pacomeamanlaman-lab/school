"use client";

import { useState } from "react";
import Modal from "./Modal";
import { User, Mail, Phone, Calendar, MapPin, Heart, FileText, Upload, X } from "lucide-react";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  student?: any;
}

export default function AddStudentModal({ isOpen, onClose, onSubmit, student }: AddStudentModalProps) {
  const [formData, setFormData] = useState({
    firstName: student?.firstName || "",
    lastName: student?.lastName || "",
    dateNaissance: student?.dateNaissance || "",
    genre: student?.genre || "M",
    classe: student?.classe || "",
    email: student?.email || "",
    phone: student?.phone || "",
    adresse: student?.adresse || "",
    groupeSanguin: student?.groupeSanguin || "",
    maladiesParticulieres: student?.maladiesParticulieres || "",
    pieceNaissance: student?.pieceNaissance || "",
    parentName: student?.parentName || "",
    parentPhone: student?.parentPhone || "",
    parentPhoneSecondaire: student?.parentPhoneSecondaire || "",
    parentEmail: student?.parentEmail || "",
  });

  const [uploadedFile, setUploadedFile] = useState<{ name: string; preview: string } | null>(
    student?.pieceNaissanceFile || null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      const dataToSubmit = student
        ? { ...student, ...formData, pieceNaissanceFile: uploadedFile }
        : { ...formData, pieceNaissanceFile: uploadedFile };
      onSubmit(dataToSubmit);
    }
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert('Format non supporté. Utilisez PDF, JPG ou PNG.');
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Fichier trop volumineux. Maximum 5MB.');
        return;
      }

      // Créer preview avec FileReader
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFile({
          name: file.name,
          preview: reader.result as string, // Base64 pour le MVP
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={student ? "Modifier l'élève" : "Ajouter un élève"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations élève */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Informations de l'élève
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
                Date de naissance <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Genre <span className="text-danger">*</span>
              </label>
              <select
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              >
                <option value="M">Garçon</option>
                <option value="F">Fille</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Classe <span className="text-danger">*</span>
              </label>
              <select
                name="classe"
                value={formData.classe}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              >
                <option value="">Sélectionner une classe</option>
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
                Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
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

        {/* Informations médicales */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Informations médicales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Groupe sanguin
              </label>
              <select
                name="groupeSanguin"
                value={formData.groupeSanguin}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              >
                <option value="">Non renseigné</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Maladies particulières / Allergies
              </label>
              <textarea
                name="maladiesParticulieres"
                value={formData.maladiesParticulieres}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition resize-none"
                placeholder="Asthme, allergies alimentaires, diabète, etc."
              />
            </div>
          </div>
        </div>

        {/* Pièces jointes */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Pièces administratives
          </h3>

          <div className="space-y-4">
            {/* Numéro extrait */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Numéro extrait de naissance
              </label>
              <input
                type="text"
                name="pieceNaissance"
                value={formData.pieceNaissance}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="Ex: 2024/123/ABC"
              />
            </div>

            {/* Upload fichier */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Document (Extrait de naissance)
              </label>

              {!uploadedFile ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, JPG, PNG (max. 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">Fichier prêt à être enregistré</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1.5 hover:bg-danger/10 rounded-lg transition text-danger"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                📌 MVP : Fichier stocké en local (base64). Migration vers Supabase Storage en Phase 3.
              </p>
            </div>
          </div>
        </div>

        {/* Informations parent/tuteur */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Informations du parent/tuteur
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nom complet <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Téléphone principal <span className="text-danger">*</span>
              </label>
              <input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Téléphone secondaire
              </label>
              <input
                type="tel"
                name="parentPhoneSecondaire"
                value={formData.parentPhoneSecondaire}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="+33 6 98 76 54 32"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="jean.dupont@example.com"
              />
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
            {student ? "Modifier" : "Ajouter l'élève"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
