"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Save, RotateCcw } from "lucide-react";
import {
  DAY_NAMES,
  DEFAULT_TIMETABLE_TECH_CONFIG,
  type DayName,
  generateTimeSlots,
  getDisabledSlotIdsByDay,
  loadTimetableTechConfigFromStorage,
  saveTimetableTechConfigToStorage,
  type TimetableTechConfig,
} from "@/lib/timetable-tech-config";

export default function TimetableConfigPage() {
  const [config, setConfig] = useState<TimetableTechConfig>(() => loadTimetableTechConfigFromStorage());
  const [feedback, setFeedback] = useState("");

  const slots = useMemo(() => generateTimeSlots(config), [config]);
  const disabledByDay = useMemo(() => getDisabledSlotIdsByDay(config, slots), [config, slots]);

  const toggleDay = (day: DayName) => {
    setConfig((prev) => {
      const exists = prev.activeDays.includes(day);
      const nextDays = exists ? prev.activeDays.filter((d) => d !== day) : [...prev.activeDays, day];
      return { ...prev, activeDays: nextDays };
    });
  };

  const handleSave = () => {
    if (config.activeDays.length === 0) {
      setFeedback("Selectionnez au moins un jour actif.");
      return;
    }
    saveTimetableTechConfigToStorage(config);
    setFeedback("Configuration enregistree localement (MVP).");
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_TIMETABLE_TECH_CONFIG });
    setFeedback("Configuration reinitialisee avec le modele par defaut.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Retour aux parametres
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Configuration technique EDT</h1>
          <p className="text-muted-foreground">
            Definis les horaires de journee, les recreations et les pauses pour generer la grille.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Debut de journee</label>
            <input
              type="time"
              value={config.dayStart}
              onChange={(e) => setConfig((prev) => ({ ...prev, dayStart: e.target.value }))}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Fin de journee</label>
            <input
              type="time"
              value={config.dayEnd}
              onChange={(e) => setConfig((prev) => ({ ...prev, dayEnd: e.target.value }))}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Duree d'un cours (min)</label>
            <input
              type="number"
              min={30}
              max={120}
              value={config.courseDurationMin}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, courseDurationMin: Math.max(30, Number(e.target.value) || 60) }))
              }
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-2">Jours actifs</p>
          <div className="flex flex-wrap gap-3">
            {DAY_NAMES.map((day) => {
              const checked = config.activeDays.includes(day);
              return (
                <label key={day} className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={checked} onChange={() => toggleDay(day)} className="h-4 w-4" />
                  {day}
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-2">Fin specifique par jour (optionnel)</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {DAY_NAMES.map((day) => (
              <div key={day}>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{day}</label>
                <input
                  type="time"
                  value={config.dayEndOverrides[day] || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      dayEndOverrides: {
                        ...prev.dayEndOverrides,
                        [day]: e.target.value || undefined,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Exemple: mettre Mercredi a 12:20 pour une demi-journee.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-2">Recreations et pauses</p>
          <div className="space-y-3">
            {config.breaks.map((row) => (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end rounded-lg border border-border p-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Libelle</label>
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        breaks: prev.breaks.map((b) => (b.id === row.id ? { ...b, label: e.target.value } : b)),
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Debut</label>
                  <input
                    type="time"
                    value={row.start}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        breaks: prev.breaks.map((b) => (b.id === row.id ? { ...b, start: e.target.value } : b)),
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Fin</label>
                  <input
                    type="time"
                    value={row.end}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        breaks: prev.breaks.map((b) => (b.id === row.id ? { ...b, end: e.target.value } : b)),
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        breaks: prev.breaks.map((b) => (b.id === row.id ? { ...b, enabled: e.target.checked } : b)),
                      }))
                    }
                  />
                  Actif
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-background border border-input hover:bg-accent rounded-lg transition font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            Reinitialiser
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </button>
        </div>
        {feedback && <p className="text-sm text-info">{feedback}</p>}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">Apercu des creneaux generes</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-2 text-sm font-semibold text-foreground">#</th>
                <th className="text-left px-4 py-2 text-sm font-semibold text-foreground">Horaire</th>
                <th className="text-left px-4 py-2 text-sm font-semibold text-foreground">Type</th>
                <th className="text-left px-4 py-2 text-sm font-semibold text-foreground">Libelle</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.id} className="border-b border-border">
                  <td className="px-4 py-2 text-sm text-foreground">{slot.id}</td>
                  <td className="px-4 py-2 text-sm text-foreground">
                    {slot.debut} - {slot.fin}
                  </td>
                  <td className="px-4 py-2 text-sm text-foreground">{slot.type}</td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">{slot.label || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-sm font-medium text-foreground mb-1">Creneaux neutralises par jour</p>
          <p className="text-xs text-muted-foreground">
            Les slots neutralises restent visibles dans la grille, avec l'etat "Ferme (demi-journee)".
          </p>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            {DAY_NAMES.map((day) => (
              <div key={day} className="text-xs text-foreground">
                <span className="font-medium">{day}:</span>{" "}
                {disabledByDay[day]?.length ? disabledByDay[day].join(", ") : "aucun"}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

