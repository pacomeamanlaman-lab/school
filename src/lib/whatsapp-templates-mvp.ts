/** Aperçus MVP pour futurs templates Meta WhatsApp (pas d’appel API ici). */

export type WhatsAppFieldRow = { label: string; value: string };

export type WhatsAppNotifyContext = {
  /** Nom technique du template côté Meta (à créer / approuver plus tard) */
  metaTemplateName: string;
  /** Titre affiché dans l’UI */
  title: string;
  /** Texte tel qu’il pourrait être envoyé une fois le template validé */
  bodyPreview: string;
  fields: WhatsAppFieldRow[];
  whatsappE164: string | null;
};

type DemoParent = {
  parentPrenom: string;
  parentNom: string;
  whatsapp: string | null;
};

const DEMO_PARENT_BY_STUDENT_LASTNAME: Record<string, DemoParent> = {
  Dupont: { parentPrenom: "Jean", parentNom: "Dupont", whatsapp: "+225 07 12 34 56 78" },
  Martin: { parentPrenom: "Sophie", parentNom: "Martin", whatsapp: "+225 07 98 76 54 32" },
  Bernard: { parentPrenom: "Pierre", parentNom: "Bernard", whatsapp: "+225 05 11 22 33 44" },
  Petit: { parentPrenom: "Marie", parentNom: "Petit", whatsapp: "+225 01 02 03 04 05" },
  Dubois: { parentPrenom: "Claire", parentNom: "Dubois", whatsapp: null },
};

export function resolveDemoParentForStudent(
  _studentFirstName: string,
  studentLastName: string
): DemoParent & { parentDisplayName: string } {
  const row = DEMO_PARENT_BY_STUDENT_LASTNAME[studentLastName];
  if (!row) {
    return {
      parentPrenom: "Parent",
      parentNom: "",
      parentDisplayName: "Parent",
      whatsapp: null,
    };
  }
  return {
    ...row,
    parentDisplayName: `${row.parentPrenom} ${row.parentNom}`.trim(),
  };
}

function formatDateLongFr(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

export function buildAbsenceWhatsAppContext(params: {
  studentFirstName: string;
  studentLastName: string;
  classe: string;
  dateISO: string;
  motif?: string;
}): WhatsAppNotifyContext {
  const parent = resolveDemoParentForStudent(params.studentFirstName, params.studentLastName);
  const eleve = `${params.studentFirstName} ${params.studentLastName}`;
  const dateFr = formatDateLongFr(params.dateISO);
  const motifPart = params.motif?.trim() ? ` Motif : ${params.motif.trim()}.` : "";
  const bodyPreview = `Bonjour ${parent.parentPrenom}, absence signalée pour ${eleve} le ${dateFr}.${motifPart}`;

  return {
    metaTemplateName: "absence_signalee_v1",
    title: "Absence signalée",
    bodyPreview,
    fields: [
      { label: "Prénom du parent", value: parent.parentPrenom },
      { label: "Élève", value: eleve },
      { label: "Classe", value: params.classe },
      { label: "Date", value: dateFr },
      ...(params.motif?.trim() ? [{ label: "Motif", value: params.motif.trim() }] : []),
    ],
    whatsappE164: parent.whatsapp,
  };
}

export function buildNoteWhatsAppContext(params: {
  studentFirstName: string;
  studentLastName: string;
  classe: string;
  matiere: string;
  trimestre: string;
  note: string;
}): WhatsAppNotifyContext {
  const parent = resolveDemoParentForStudent(params.studentFirstName, params.studentLastName);
  const eleve = `${params.studentFirstName} ${params.studentLastName}`;
  const bodyPreview = `Bonjour ${parent.parentPrenom}, la note de ${params.matiere} de ${eleve} (${params.note}/20, ${params.trimestre}) est disponible.`;

  return {
    metaTemplateName: "note_disponible_v1",
    title: "Note disponible",
    bodyPreview,
    fields: [
      { label: "Prénom du parent", value: parent.parentPrenom },
      { label: "Élève", value: eleve },
      { label: "Classe", value: params.classe },
      { label: "Matière", value: params.matiere },
      { label: "Trimestre", value: params.trimestre },
      { label: "Note", value: `${params.note}/20` },
    ],
    whatsappE164: parent.whatsapp,
  };
}

export function buildBulletinWhatsAppContext(params: {
  studentFirstName: string;
  studentLastName: string;
  classe: string;
  trimestre: string;
  moyenne: string;
}): WhatsAppNotifyContext {
  const parent = resolveDemoParentForStudent(params.studentFirstName, params.studentLastName);
  const eleve = `${params.studentFirstName} ${params.studentLastName}`;
  const bodyPreview = `Bonjour ${parent.parentPrenom}, le bulletin de ${eleve} pour ${params.trimestre} est disponible (moyenne : ${params.moyenne}/20).`;

  return {
    metaTemplateName: "bulletin_disponible_v1",
    title: "Bulletin disponible",
    bodyPreview,
    fields: [
      { label: "Prénom du parent", value: parent.parentPrenom },
      { label: "Élève", value: eleve },
      { label: "Classe", value: params.classe },
      { label: "Période", value: params.trimestre },
      { label: "Moyenne générale", value: `${params.moyenne}/20` },
    ],
    whatsappE164: parent.whatsapp,
  };
}

export function buildManualWhatsAppContext(params: {
  parentNomComplet: string;
  whatsapp: string | null;
  sujet: string;
  eleveOuEnfants: string;
}): WhatsAppNotifyContext {
  const prenom = params.parentNomComplet.trim().split(/\s+/)[0] || "Parent";
  const bodyPreview = `Bonjour ${prenom}, message de l'établissement : ${params.sujet} (concernant : ${params.eleveOuEnfants}).`;

  return {
    metaTemplateName: "message_etablissement_v1",
    title: "Message établissement",
    bodyPreview,
    fields: [
      { label: "Parent / tuteur", value: params.parentNomComplet },
      { label: "Sujet", value: params.sujet },
      { label: "Concernant", value: params.eleveOuEnfants },
    ],
    whatsappE164: params.whatsapp?.trim() || null,
  };
}
