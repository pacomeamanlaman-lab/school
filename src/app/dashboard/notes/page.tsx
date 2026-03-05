"use client";

import { useState } from "react";
import { Filter, Save, Download, Award, TrendingUp } from "lucide-react";

// Données de démonstration
const classesData = [
  { id: 1, name: "CP - Classe A", niveau: "CP" },
  { id: 2, name: "CE1 - Classe A", niveau: "CE1" },
  { id: 3, name: "CE2 - Classe A", niveau: "CE2" },
  { id: 4, name: "CM1 - Classe A", niveau: "CM1" },
  { id: 5, name: "CM2 - Classe A", niveau: "CM2" },
  { id: 6, name: "6ème - Classe A", niveau: "6ème" },
];

const matieres = [
  { id: 1, name: "Français", coef: 3 },
  { id: 2, name: "Mathématiques", coef: 3 },
  { id: 3, name: "Histoire-Géo", coef: 2 },
  { id: 4, name: "Sciences", coef: 2 },
  { id: 5, name: "Anglais", coef: 2 },
  { id: 6, name: "EPS", coef: 1 },
];

const studentsData = [
  { id: 1, firstName: "Marie", lastName: "Dupont", classe: "CP - Classe A" },
  { id: 2, firstName: "Jean", lastName: "Martin", classe: "CP - Classe A" },
  { id: 3, firstName: "Sophie", lastName: "Bernard", classe: "CP - Classe A" },
  { id: 4, firstName: "Lucas", lastName: "Petit", classe: "CP - Classe A" },
  { id: 5, firstName: "Emma", lastName: "Dubois", classe: "CP - Classe A" },
];

const trimestres = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];

export default function NotesPage() {
  const [selectedClass, setSelectedClass] = useState("CP - Classe A");
  const [selectedMatiere, setSelectedMatiere] = useState("Français");
  const [selectedTrimestre, setSelectedTrimestre] = useState("Trimestre 1");
  const [notes, setNotes] = useState<Record<number, number>>({});

  const filteredStudents = studentsData.filter((s) => s.classe === selectedClass);
  const currentMatiere = matieres.find((m) => m.name === selectedMatiere);

  const handleNoteChange = (studentId: number, value: string) => {
    const note = parseFloat(value);
    if (!isNaN(note) && note >= 0 && note <= 20) {
      setNotes({ ...notes, [studentId]: note });
    } else if (value === "") {
      const newNotes = { ...notes };
      delete newNotes[studentId];
      setNotes(newNotes);
    }
  };

  const calculateMoyenne = () => {
    const notesArray = Object.values(notes);
    if (notesArray.length === 0) return 0;
    return (notesArray.reduce((acc, n) => acc + n, 0) / notesArray.length).toFixed(2);
  };

  const handleSaveNotes = () => {
    // TODO: Sauvegarder dans Supabase
    console.log("Sauvegarde notes:", {
      classe: selectedClass,
      matiere: selectedMatiere,
      trimestre: selectedTrimestre,
      notes,
    });
    alert("Notes enregistrées avec succès !");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notes & Évaluations</h1>
        <p className="text-muted-foreground">Saisie et consultation des notes par matière</p>
      </div>

      {/* Filtres */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* Matière */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Matière <span className="text-danger">*</span>
            </label>
            <select
              value={selectedMatiere}
              onChange={(e) => setSelectedMatiere(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none"
            >
              {matieres.map((matiere) => (
                <option key={matiere.id} value={matiere.name}>
                  {matiere.name} (Coef {matiere.coef})
                </option>
              ))}
            </select>
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
          <div className="flex items-end gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-background border border-input hover:bg-accent rounded-lg transition font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Élèves</p>
          <p className="text-2xl font-bold text-foreground mt-1">{filteredStudents.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Notes saisies</p>
          <p className="text-2xl font-bold text-foreground mt-1">{Object.keys(notes).length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Moyenne classe</p>
          <p className="text-2xl font-bold text-primary mt-1">{calculateMoyenne()}/20</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Coefficient</p>
          <p className="text-2xl font-bold text-foreground mt-1">{currentMatiere?.coef || 1}</p>
        </div>
      </div>

      {/* Saisie des notes */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Saisie des notes - {selectedMatiere} ({selectedTrimestre})
          </h3>
          <button
            onClick={handleSaveNotes}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Élève</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Note / 20</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Appréciation</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Rang</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                const studentNote = notes[student.id];
                const appreciation =
                  studentNote >= 16
                    ? "Très bien"
                    : studentNote >= 14
                    ? "Bien"
                    : studentNote >= 12
                    ? "Assez bien"
                    : studentNote >= 10
                    ? "Passable"
                    : studentNote
                    ? "Insuffisant"
                    : "-";

                const appreciationColor =
                  studentNote >= 16
                    ? "text-success"
                    : studentNote >= 14
                    ? "text-primary"
                    : studentNote >= 10
                    ? "text-warning"
                    : "text-danger";

                return (
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
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={notes[student.id] || ""}
                        onChange={(e) => handleNoteChange(student.id, e.target.value)}
                        placeholder="--"
                        className="w-24 px-3 py-2 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition text-center font-semibold text-lg"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-medium ${appreciationColor}`}>{appreciation}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {studentNote ? (
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-md text-sm font-semibold">
                          <Award className="w-4 h-4" />
                          {index + 1}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Résumé */}
        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Moyenne de la classe</p>
                <p className="text-2xl font-bold text-primary">{calculateMoyenne()}/20</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Note la plus haute</p>
                <p className="text-xl font-bold text-success">
                  {Object.values(notes).length > 0 ? Math.max(...Object.values(notes)).toFixed(1) : "--"}/20
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Note la plus basse</p>
                <p className="text-xl font-bold text-danger">
                  {Object.values(notes).length > 0 ? Math.min(...Object.values(notes)).toFixed(1) : "--"}/20
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Taux de réussite (≥10/20)</p>
              <p className="text-2xl font-bold text-foreground">
                {Object.values(notes).length > 0
                  ? Math.round((Object.values(notes).filter((n) => n >= 10).length / Object.values(notes).length) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
