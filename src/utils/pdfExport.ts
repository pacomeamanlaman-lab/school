import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exporte un élément HTML en PDF
 * @param elementId - L'ID de l'élément HTML à capturer
 * @param filename - Le nom du fichier PDF à générer
 */
export async function exportElementToPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  try {
    // Cloner l'élément pour éviter de modifier l'original
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);

    // Convertir les couleurs modernes (oklch/oklab) en RGB
    const allElements = clone.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlEl);

      // Forcer les couleurs calculées (converties en RGB)
      if (computedStyle.backgroundColor) {
        htmlEl.style.backgroundColor = computedStyle.backgroundColor;
      }
      if (computedStyle.color) {
        htmlEl.style.color = computedStyle.color;
      }
      if (computedStyle.borderColor) {
        htmlEl.style.borderColor = computedStyle.borderColor;
      }
    });

    // Capture l'élément HTML en canvas avec scale réduit
    const canvas = await html2canvas(clone, {
      scale: 1.5, // Réduit de 2 à 1.5 pour moins de poids
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Nettoyer le clone
    document.body.removeChild(clone);

    // Conversion en PDF avec compression JPEG
    const imgData = canvas.toDataURL('image/jpeg', 0.85); // JPEG avec qualité 85%
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true, // Active la compression
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Ajoute la première page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Ajoute des pages supplémentaires si nécessaire
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // Télécharge le PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Exporte un bulletin scolaire en PDF
 * @param studentName - Nom de l'élève
 * @param trimestre - Trimestre concerné
 */
export async function exportBulletinToPDF(studentName: string, trimestre: string): Promise<void> {
  const filename = `Bulletin_${studentName.replace(/\s+/g, '_')}_${trimestre}.pdf`;
  await exportElementToPDF('bulletin-content', filename);
}

/**
 * Exporte un emploi du temps en PDF
 * @param className - Nom de la classe
 */
export async function exportScheduleToPDF(className: string): Promise<void> {
  const filename = `Emploi_du_temps_${className.replace(/\s+/g, '_')}.pdf`;
  await exportElementToPDF('schedule-table', filename);
}

/**
 * Exporte une feuille de notes en PDF
 * @param className - Nom de la classe
 * @param matiere - Matière concernée
 * @param trimestre - Trimestre concerné
 */
export async function exportNotesToPDF(className: string, matiere: string, trimestre: string): Promise<void> {
  const filename = `Notes_${className}_${matiere}_${trimestre}.pdf`.replace(/\s+/g, '_');
  await exportElementToPDF('notes-table', filename);
}

/**
 * Exporte une feuille d'absences en PDF
 * @param className - Nom de la classe
 * @param date - Date de l'appel
 */
export async function exportAbsencesToPDF(className: string, date: string): Promise<void> {
  const filename = `Absences_${className}_${date}.pdf`.replace(/\s+/g, '_');
  await exportElementToPDF('absences-table', filename);
}

/**
 * Exporte une liste d'élèves en PDF
 * @param className - Nom de la classe (optionnel)
 */
export async function exportStudentListToPDF(className?: string): Promise<void> {
  const filename = className
    ? `Liste_eleves_${className.replace(/\s+/g, '_')}.pdf`
    : 'Liste_eleves.pdf';
  await exportElementToPDF('students-table', filename);
}
