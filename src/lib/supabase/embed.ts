/** PostgREST peut renvoyer une ligne liée comme objet ou tableau à un élément. */
export function embedOne<T extends object>(raw: unknown): T | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) return (raw[0] as T | undefined) ?? null;
  return raw as T;
}
