"use client";

export const TIMETABLE_TECH_CONFIG_STORAGE_KEY = "school.timetable.techConfig.v1";

export const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;
export type DayName = (typeof DAY_NAMES)[number];

export type SlotType = "course" | "break" | "lunch";

export type TimetableBreak = {
  id: string;
  label: string;
  start: string;
  end: string;
  type: "break" | "lunch";
  enabled: boolean;
};

export type TimetableTechConfig = {
  dayStart: string;
  dayEnd: string;
  courseDurationMin: number;
  activeDays: DayName[];
  dayEndOverrides: Partial<Record<DayName, string>>;
  breaks: TimetableBreak[];
};

export type GeneratedTimeSlot = {
  id: number;
  debut: string;
  fin: string;
  type: SlotType;
  label?: string;
};

export const DEFAULT_TIMETABLE_TECH_CONFIG: TimetableTechConfig = {
  dayStart: "08:00",
  dayEnd: "16:15",
  courseDurationMin: 60,
  activeDays: [...DAY_NAMES],
  dayEndOverrides: {
    Mercredi: "12:20",
  },
  breaks: [
    { id: "morning-break", label: "Recreation", start: "10:00", end: "10:20", type: "break", enabled: true },
    {
      id: "lunch-break",
      label: "Pause dejeuner",
      start: "12:20",
      end: "14:00",
      type: "lunch",
      enabled: true,
    },
    { id: "afternoon-break", label: "Pause", start: "15:00", end: "15:15", type: "break", enabled: true },
  ],
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function toHHMM(totalMinutes: number): string {
  const safe = Math.max(0, totalMinutes);
  const hours = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (safe % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function normalizeBreaks(breaks: TimetableBreak[]): TimetableBreak[] {
  return [...breaks]
    .filter((row) => row.enabled && row.start && row.end && toMinutes(row.end) > toMinutes(row.start))
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

function sanitizeConfig(raw: Partial<TimetableTechConfig> | null | undefined): TimetableTechConfig {
  if (!raw) return { ...DEFAULT_TIMETABLE_TECH_CONFIG };

  const dayStart = raw.dayStart ?? DEFAULT_TIMETABLE_TECH_CONFIG.dayStart;
  const dayEnd = raw.dayEnd ?? DEFAULT_TIMETABLE_TECH_CONFIG.dayEnd;
  const activeDays = (raw.activeDays ?? DEFAULT_TIMETABLE_TECH_CONFIG.activeDays).filter((d): d is DayName =>
    DAY_NAMES.includes(d as DayName)
  );
  const courseDurationMin = Math.max(30, Math.min(120, Number(raw.courseDurationMin) || 60));

  const dayEndOverrides: Partial<Record<DayName, string>> = {};
  DAY_NAMES.forEach((day) => {
    const maybe = raw.dayEndOverrides?.[day];
    if (maybe) dayEndOverrides[day] = maybe;
  });

  return {
    dayStart,
    dayEnd,
    courseDurationMin,
    activeDays: activeDays.length > 0 ? activeDays : [...DEFAULT_TIMETABLE_TECH_CONFIG.activeDays],
    dayEndOverrides,
    breaks: raw.breaks?.length ? raw.breaks : [...DEFAULT_TIMETABLE_TECH_CONFIG.breaks],
  };
}

export function loadTimetableTechConfigFromStorage(): TimetableTechConfig {
  if (typeof window === "undefined") return { ...DEFAULT_TIMETABLE_TECH_CONFIG };
  try {
    const raw = window.localStorage.getItem(TIMETABLE_TECH_CONFIG_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_TIMETABLE_TECH_CONFIG };
    return sanitizeConfig(JSON.parse(raw) as Partial<TimetableTechConfig>);
  } catch {
    return { ...DEFAULT_TIMETABLE_TECH_CONFIG };
  }
}

export function saveTimetableTechConfigToStorage(config: TimetableTechConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TIMETABLE_TECH_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function generateTimeSlots(config: TimetableTechConfig): GeneratedTimeSlot[] {
  const slots: GeneratedTimeSlot[] = [];
  const dayStartMin = toMinutes(config.dayStart);
  const dayEndMin = toMinutes(config.dayEnd);
  const breaks = normalizeBreaks(config.breaks);
  let current = dayStartMin;
  let slotId = 1;

  while (current < dayEndMin) {
    const currentBreak = breaks.find((row) => toMinutes(row.start) === current);
    if (currentBreak) {
      slots.push({
        id: slotId++,
        debut: currentBreak.start,
        fin: currentBreak.end,
        type: currentBreak.type,
        label: currentBreak.label,
      });
      current = toMinutes(currentBreak.end);
      continue;
    }

    const nextBreak = breaks.find((row) => toMinutes(row.start) > current);
    const nextBreakStart = nextBreak ? toMinutes(nextBreak.start) : Number.POSITIVE_INFINITY;
    const nextCourseEnd = Math.min(current + config.courseDurationMin, nextBreakStart, dayEndMin);
    if (nextCourseEnd <= current) break;

    slots.push({
      id: slotId++,
      debut: toHHMM(current),
      fin: toHHMM(nextCourseEnd),
      type: "course",
    });
    current = nextCourseEnd;
  }

  return slots;
}

export function getDisabledSlotIdsByDay(
  config: TimetableTechConfig,
  slots: GeneratedTimeSlot[]
): Record<string, number[]> {
  const result: Record<string, number[]> = {};
  DAY_NAMES.forEach((day) => {
    const dayEnd = config.dayEndOverrides[day];
    if (!dayEnd) {
      result[day] = [];
      return;
    }
    const dayEndMin = toMinutes(dayEnd);
    result[day] = slots.filter((slot) => toMinutes(slot.debut) >= dayEndMin).map((slot) => slot.id);
  });
  return result;
}

