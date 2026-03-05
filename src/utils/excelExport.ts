import * as XLSX from 'xlsx';

/**
 * Exporte des notes en Excel
 */
export function exportNotesToExcel(
  className: string,
  matiere: string,
  trimestre: string,
  students: Array<{ firstName: string; lastName: string; note?: number; appreciation?: string }>
) {
  const data = students.map((student, index) => ({
    'N°': index + 1,
    'Nom': student.lastName,
    'Prénom': student.firstName,
    'Note /20': student.note || '',
    'Appréciation': student.appreciation || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Notes');

  // Largeur des colonnes
  ws['!cols'] = [
    { wch: 5 },  // N°
    { wch: 15 }, // Nom
    { wch: 15 }, // Prénom
    { wch: 10 }, // Note
    { wch: 30 }, // Appréciation
  ];

  const filename = `Notes_${className}_${matiere}_${trimestre}.xlsx`.replace(/\s+/g, '_');
  XLSX.writeFile(wb, filename);
}

/**
 * Exporte des absences en Excel
 */
export function exportAbsencesToExcel(
  className: string,
  date: string,
  students: Array<{
    firstName: string;
    lastName: string;
    status?: 'present' | 'absent' | 'late' | null;
    motif?: string;
  }>
) {
  const data = students.map((student, index) => ({
    'N°': index + 1,
    'Nom': student.lastName,
    'Prénom': student.firstName,
    'Statut': student.status === 'present' ? 'Présent'
             : student.status === 'absent' ? 'Absent'
             : student.status === 'late' ? 'Retard'
             : 'Non renseigné',
    'Motif': student.motif || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Absences');

  // Largeur des colonnes
  ws['!cols'] = [
    { wch: 5 },  // N°
    { wch: 15 }, // Nom
    { wch: 15 }, // Prénom
    { wch: 15 }, // Statut
    { wch: 40 }, // Motif
  ];

  const filename = `Absences_${className}_${date}.xlsx`.replace(/\s+/g, '_');
  XLSX.writeFile(wb, filename);
}

/**
 * Exporte la liste des élèves en Excel
 */
export function exportStudentsToExcel(
  students: Array<{
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    classe: string;
    parent?: { name?: string; phone?: string };
  }>
) {
  const data = students.map((student, index) => ({
    'N°': index + 1,
    'Nom': student.lastName,
    'Prénom': student.firstName,
    'Date de naissance': student.dateOfBirth,
    'Classe': student.classe,
    'Parent': student.parent?.name || '',
    'Téléphone': student.parent?.phone || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Élèves');

  // Largeur des colonnes
  ws['!cols'] = [
    { wch: 5 },  // N°
    { wch: 15 }, // Nom
    { wch: 15 }, // Prénom
    { wch: 15 }, // Date naissance
    { wch: 15 }, // Classe
    { wch: 20 }, // Parent
    { wch: 15 }, // Téléphone
  ];

  const filename = `Liste_eleves_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Exporte la liste des bulletins (résumé) en Excel
 */
export function exportBulletinsToExcel(
  className: string,
  trimestre: string,
  students: Array<{
    firstName: string;
    lastName: string;
    moyenne: number;
    rang: number;
  }>
) {
  const data = students.map((student) => ({
    'Nom': student.lastName,
    'Prénom': student.firstName,
    'Moyenne': student.moyenne.toFixed(2),
    'Rang': `${student.rang}/${students.length}`,
    'Statut': student.moyenne >= 10 ? 'Admis' : 'Non admis',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bulletins');

  // Largeur des colonnes
  ws['!cols'] = [
    { wch: 15 }, // Nom
    { wch: 15 }, // Prénom
    { wch: 10 }, // Moyenne
    { wch: 10 }, // Rang
    { wch: 15 }, // Statut
  ];

  const filename = `Bulletins_${className}_${trimestre}.xlsx`.replace(/\s+/g, '_');
  XLSX.writeFile(wb, filename);
}

/**
 * Exporte la liste du personnel en Excel
 */
export function exportStaffToExcel(
  staff: Array<{
    firstName: string;
    lastName: string;
    role: string;
    email?: string;
    phone?: string;
    matiere?: string;
  }>
) {
  const data = staff.map((person, index) => ({
    'N°': index + 1,
    'Nom': person.lastName,
    'Prénom': person.firstName,
    'Fonction': person.role,
    'Matière': person.matiere || '-',
    'Email': person.email || '',
    'Téléphone': person.phone || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Personnel');

  // Largeur des colonnes
  ws['!cols'] = [
    { wch: 5 },  // N°
    { wch: 15 }, // Nom
    { wch: 15 }, // Prénom
    { wch: 20 }, // Fonction
    { wch: 20 }, // Matière
    { wch: 30 }, // Email
    { wch: 15 }, // Téléphone
  ];

  const filename = `Personnel_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
