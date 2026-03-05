"use client";

import { useState } from "react";
import { Filter, Download, Eye, FileText, Send, FileSpreadsheet } from "lucide-react";
import { exportBulletinToPDF } from "@/utils/pdfExport";
import { exportBulletinsToExcel } from "@/utils/excelExport";

// Données de démonstration
const classesData = [
  { id: 1, name: "CP - Classe A", niveau: "CP" },
  { id: 2, name: "CE1 - Classe A", niveau: "CE1" },
  { id: 3, name: "CE2 - Classe A", niveau: "CE2" },
  { id: 4, name: "CM1 - Classe A", niveau: "CM1" },
  { id: 5, name: "CM2 - Classe A", niveau: "CM2" },
  { id: 6, name: "6ème - Classe A", niveau: "6ème" },
];

const trimestres = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];

const studentsData = [
  {
    id: 1,
    firstName: "Marie",
    lastName: "Dupont",
    classe: "CP - Classe A",
    moyenne: 15.5,
    rang: 1,
    notes: [
      { matiere: "Français", note: 16, coef: 3, appreciation: "Très bon travail" },
      { matiere: "Mathématiques", note: 17, coef: 3, appreciation: "Excellente élève" },
      { matiere: "Histoire-Géo", note: 14, coef: 2, appreciation: "Bien" },
      { matiere: "Sciences", note: 15, coef: 2, appreciation: "Satisfaisant" },
      { matiere: "Anglais", note: 16, coef: 2, appreciation: "Très bien" },
      { matiere: "EPS", note: 15, coef: 1, appreciation: "Bon niveau" },
    ],
    appreciationGenerale: "Excellente élève, sérieuse et appliquée. Continue ainsi !",
  },
  {
    id: 2,
    firstName: "Jean",
    lastName: "Martin",
    classe: "CP - Classe A",
    moyenne: 13.2,
    rang: 3,
    notes: [
      { matiere: "Français", note: 12, coef: 3, appreciation: "Peut mieux faire" },
      { matiere: "Mathématiques", note: 14, coef: 3, appreciation: "En progrès" },
      { matiere: "Histoire-Géo", note: 13, coef: 2, appreciation: "Satisfaisant" },
      { matiere: "Sciences", note: 13, coef: 2, appreciation: "Correct" },
      { matiere: "Anglais", note: 14, coef: 2, appreciation: "Bien" },
      { matiere: "EPS", note: 13, coef: 1, appreciation: "Moyen" },
    ],
    appreciationGenerale: "Élève sérieux mais doit fournir plus d'efforts en français.",
  },
  {
    id: 3,
    firstName: "Sophie",
    lastName: "Bernard",
    classe: "CP - Classe A",
    moyenne: 16.8,
    rang: 1,
    notes: [
      { matiere: "Français", note: 18, coef: 3, appreciation: "Excellente maîtrise" },
      { matiere: "Mathématiques", note: 17, coef: 3, appreciation: "Très bon niveau" },
      { matiere: "Histoire-Géo", note: 16, coef: 2, appreciation: "Très bien" },
      { matiere: "Sciences", note: 17, coef: 2, appreciation: "Excellent" },
      { matiere: "Anglais", note: 16, coef: 2, appreciation: "Très bien" },
      { matiere: "EPS", note: 15, coef: 1, appreciation: "Bien" },
    ],
    appreciationGenerale: "Élève brillante et motivée. Félicitations !",
  },
];

export default function BulletinsPage() {
  const [selectedClass, setSelectedClass] = useState("CP - Classe A");
  const [selectedTrimestre, setSelectedTrimestre] = useState("Trimestre 1");
  const [selectedStudent, setSelectedStudent] = useState<typeof studentsData[0] | null>(null);

  const filteredStudents = studentsData.filter((s) => s.classe === selectedClass);

  const handleGeneratePDF = async (student: typeof studentsData[0]) => {
    // Ouvrir le modal d'abord
    setSelectedStudent(student);

    // Attendre que le modal s'affiche
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      await exportBulletinToPDF(
        `${student.firstName} ${student.lastName}`,
        selectedTrimestre
      );
      setSelectedStudent(null);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      alert("Erreur lors de la génération du PDF");
      setSelectedStudent(null);
    }
  };

  const handleGenerateAllPDF = async () => {
    for (const student of filteredStudents) {
      setSelectedStudent(student);
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        await exportBulletinToPDF(
          `${student.firstName} ${student.lastName}`,
          selectedTrimestre
        );
      } catch (error) {
        console.error(`Erreur pour ${student.firstName} ${student.lastName}:`, error);
      }
    }
    setSelectedStudent(null);
    alert(`${filteredStudents.length} bulletins générés avec succès !`);
  };

  const handleExportExcel = () => {
    exportBulletinsToExcel(selectedClass, selectedTrimestre, filteredStudents);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bulletins scolaires</h1>
        <p className="text-muted-foreground">Génération et consultation des bulletins</p>
      </div>

      {/* Filtres */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Classe */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Classe <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none"
              >
                {classesData.map((classe) => (
                  <option key={classe.id} value={classe.name}>
                    {classe.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Trimestre */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Trimestre <span className="text-danger">*</span>
            </label>
            <select
              value={selectedTrimestre}
              onChange={(e) => setSelectedTrimestre(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none"
            >
              {trimestres.map((trimestre) => (
                <option key={trimestre} value={trimestre}>
                  {trimestre}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-3">
            <button
              onClick={handleGenerateAllPDF}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              Exporter en PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-success rounded-lg transition font-medium border border-input shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exporter en Excel
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Bulletins à générer</p>
          <p className="text-2xl font-bold text-foreground mt-1">{filteredStudents.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Moyenne de classe</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {(filteredStudents.reduce((acc, s) => acc + s.moyenne, 0) / filteredStudents.length).toFixed(2)}/20
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Période</p>
          <p className="text-lg font-bold text-foreground mt-1">{selectedTrimestre}</p>
        </div>
      </div>

      {/* Liste des élèves */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Élèves - {selectedClass} ({filteredStudents.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Élève</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Moyenne</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Rang</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Statut</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-border hover:bg-accent/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {student.firstName} {student.lastName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-lg font-bold ${
                        student.moyenne >= 16
                          ? "text-success"
                          : student.moyenne >= 14
                          ? "text-primary"
                          : student.moyenne >= 10
                          ? "text-warning"
                          : "text-danger"
                      }`}
                    >
                      {student.moyenne.toFixed(2)}/20
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-md text-sm font-semibold">
                      {student.rang}
                      {student.rang === 1 ? "er" : "ème"} / {filteredStudents.length}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${
                        student.moyenne >= 10
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {student.moyenne >= 10 ? "Admis" : "Non admis"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="flex items-center gap-2 px-3 py-2 bg-background border border-input hover:bg-accent rounded-lg transition text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Aperçu
                      </button>
                      <button
                        onClick={() => handleGeneratePDF(student)}
                        className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-lg transition text-sm font-medium">
                        <Send className="w-4 h-4" />
                        Envoyer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Aperçu Bulletin */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedStudent(null)}
          ></div>
          <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-4xl my-8">
            {/* Header modal */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Bulletin scolaire - {selectedTrimestre}
              </h3>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 hover:bg-accent rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Contenu bulletin */}
            <div id="bulletin-content" className="p-8 bg-white">
              {/* En-tête */}
              <div className="text-center mb-6 pb-6 border-b-2 border-primary">
                <h2 className="text-3xl font-bold text-primary mb-2">BULLETIN SCOLAIRE</h2>
                <p className="text-lg text-foreground">École Primaire & Collège</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedTrimestre} - Année 2024-2025</p>
              </div>

              {/* Infos élève */}
              <div className="grid grid-cols-2 gap-4 mb-6 bg-muted p-4 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Nom et prénom</p>
                  <p className="font-semibold text-foreground">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Classe</p>
                  <p className="font-semibold text-foreground">{selectedStudent.classe}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Moyenne générale</p>
                  <p className="font-bold text-primary text-xl">{selectedStudent.moyenne.toFixed(2)}/20</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rang</p>
                  <p className="font-semibold text-foreground">
                    {selectedStudent.rang}
                    {selectedStudent.rang === 1 ? "er" : "ème"} / {filteredStudents.length}
                  </p>
                </div>
              </div>

              {/* Notes par matière */}
              <div className="mb-6">
                <h4 className="font-semibold text-foreground mb-3">Notes par matière</h4>
                <table className="w-full border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left px-4 py-2 border-b border-border text-sm">Matière</th>
                      <th className="text-center px-4 py-2 border-b border-border text-sm">Coef.</th>
                      <th className="text-center px-4 py-2 border-b border-border text-sm">Note</th>
                      <th className="text-left px-4 py-2 border-b border-border text-sm">Appréciation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudent.notes.map((note, index) => (
                      <tr key={index} className="border-b border-border">
                        <td className="px-4 py-2 text-sm font-medium">{note.matiere}</td>
                        <td className="px-4 py-2 text-center text-sm">{note.coef}</td>
                        <td className="px-4 py-2 text-center">
                          <span
                            className={`font-bold ${
                              note.note >= 16
                                ? "text-success"
                                : note.note >= 14
                                ? "text-primary"
                                : note.note >= 10
                                ? "text-warning"
                                : "text-danger"
                            }`}
                          >
                            {note.note.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">{note.appreciation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Appréciation générale */}
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Appréciation générale</h4>
                <p className="text-sm text-foreground">{selectedStudent.appreciationGenerale}</p>
              </div>

              {/* Footer */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Signature du Directeur</p>
                  <div className="h-16 border-b border-dashed border-border"></div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Visa des parents</p>
                  <div className="h-16 border-b border-dashed border-border"></div>
                </div>
              </div>
            </div>

            {/* Actions modal */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-background border border-input hover:bg-accent rounded-lg transition font-medium"
              >
                Fermer
              </button>
              <button
                onClick={() => handleGeneratePDF(selectedStudent)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
              >
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
