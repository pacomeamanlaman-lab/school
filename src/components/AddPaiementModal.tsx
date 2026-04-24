"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Coins, Calendar, CreditCard, FileText } from "lucide-react";

interface AddPaiementModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    studentId: number;
    studentName: string;
    classe: string;
    montantTotal: number;
    montantPaye: number;
  } | null;
  onSubmit?: (data: any) => void;
}

const emptyForm = () => ({
  montant: "",
  datePaiement: new Date().toISOString().split("T")[0],
  modePaiement: "especes",
  numeroRecu: "",
  remarques: "",
});

export default function AddPaiementModal({ isOpen, onClose, student, onSubmit }: AddPaiementModalProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [solderComplet, setSolderComplet] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSolderComplet(false);
    setFormData(emptyForm());
  }, [isOpen, student?.studentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && student) {
      onSubmit({
        studentId: student.studentId,
        studentName: student.studentName,
        ...formData,
      });
    }
    setSolderComplet(false);
    setFormData(emptyForm());
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMontantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!student) return;
    const reste = student.montantTotal - student.montantPaye;
    if (solderComplet) {
      if (val === "") {
        setSolderComplet(false);
      } else {
        const num = parseFloat(val);
        if (!Number.isNaN(num) && Math.abs(num - reste) > 0.001) {
          setSolderComplet(false);
        }
      }
    }
    setFormData({ ...formData, montant: val });
  };

  const handleSolderChange = (checked: boolean) => {
    if (!student) return;
    const reste = student.montantTotal - student.montantPaye;
    setSolderComplet(checked);
    if (checked && reste > 0) {
      setFormData((f) => ({ ...f, montant: String(reste) }));
    } else {
      setFormData((f) => ({ ...f, montant: "" }));
    }
  };

  if (!student) return null;

  const resteAPayer = student.montantTotal - student.montantPaye;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enregistrer un paiement" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info élève */}
        <div className="p-4 bg-muted/30 border border-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{student.studentName}</p>
              <p className="text-xs text-muted-foreground">{student.classe}</p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-secondary/10 text-secondary rounded-md font-medium">
              {student.classe}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-semibold text-foreground">{student.montantTotal.toLocaleString()} FCFA</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Déjà payé</p>
              <p className="text-sm font-semibold text-success">{student.montantPaye.toLocaleString()} FCFA</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reste</p>
              <p className="text-sm font-semibold text-warning">{resteAPayer.toLocaleString()} FCFA</p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Montant */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Montant du paiement <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="number"
                name="montant"
                value={formData.montant}
                onChange={handleMontantChange}
                required
                max={resteAPayer}
                min={0}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="25000"
              />
            </div>
            <div className="mt-2 flex items-start gap-2">
              <input
                type="checkbox"
                id="solder-complet"
                checked={solderComplet}
                disabled={resteAPayer <= 0}
                onChange={(e) => handleSolderChange(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <label htmlFor="solder-complet" className="text-sm text-foreground cursor-pointer leading-snug">
                <span className="font-medium">Solder</span>
                <span className="text-muted-foreground">
                  {" "}
                  — remplir avec le reste dû ({resteAPayer.toLocaleString()} FCFA)
                </span>
              </label>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date du paiement <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="date"
                name="datePaiement"
                value={formData.datePaiement}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Mode de paiement */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Mode de paiement <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                name="modePaiement"
                value={formData.modePaiement}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none"
              >
                <option value="especes">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="virement">Virement bancaire</option>
                <option value="mobile">Mobile Money</option>
              </select>
            </div>
          </div>

          {/* Numéro reçu */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Numéro de reçu
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                name="numeroRecu"
                value={formData.numeroRecu}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="REC-2024-001"
              />
            </div>
          </div>

          {/* Remarques */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Remarques
            </label>
            <textarea
              name="remarques"
              value={formData.remarques}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition resize-none"
              placeholder="1er versement, paiement en 3 fois..."
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
            Enregistrer le paiement
          </button>
        </div>
      </form>
    </Modal>
  );
}
