// Dünner fetch-Wrapper für die Bau-Schlau REST-API. Jede Store-Mutation in
// lib/store.ts ruft parallel zum lokalen State-Update die passende Funktion
// hier auf, damit Änderungen dauerhaft in der Postgres-Datenbank landen.

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Anfrage fehlgeschlagen (${res.status})`);
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

const post = <T>(path: string, data: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(data) });
const patch = <T>(path: string, data: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(data) });
const del = (path: string) => request<{ ok: true }>(path, { method: "DELETE" });

export const api = {
  state: {
    get: <T>() => request<T>("/api/state"),
  },
  tasks: {
    create: (data: unknown) => post("/api/tasks", data),
    update: (id: string, data: unknown) => patch(`/api/tasks/${id}`, data),
    remove: (id: string) => del(`/api/tasks/${id}`),
  },
  wuensche: {
    create: (data: unknown) => post("/api/wuensche", data),
    update: (id: string, data: unknown) => patch(`/api/wuensche/${id}`, data),
    remove: (id: string) => del(`/api/wuensche/${id}`),
  },
  raumProfile: {
    create: (data: unknown) => post("/api/raumprofile", data),
    update: (id: string, data: unknown) => patch(`/api/raumprofile/${id}`, data),
    remove: (id: string) => del(`/api/raumprofile/${id}`),
  },
  protokolle: {
    create: (data: unknown) => post("/api/protokolle", data),
    update: (id: string, data: unknown) => patch(`/api/protokolle/${id}`, data),
    remove: (id: string) => del(`/api/protokolle/${id}`),
  },
  fotos: {
    create: (data: unknown) => post("/api/fotos", data),
    remove: (id: string) => del(`/api/fotos/${id}`),
  },
  rechnungen: {
    create: (data: unknown) => post("/api/rechnungen", data),
    remove: (id: string) => del(`/api/rechnungen/${id}`),
  },
  angebote: {
    create: (data: unknown) => post("/api/angebote", data),
    remove: (id: string) => del(`/api/angebote/${id}`),
  },
  bautagebuch: {
    create: (data: unknown) => post("/api/bautagebuch", data),
  },
  mangelChat: {
    create: (data: unknown) => post("/api/mangelchat", data),
  },
  import: {
    legacyLocalStorage: (payload: unknown) => post("/api/import", payload),
  },
  ai: {
    wunsch: <T>(text: string) => post<T>("/api/ai/wunsch", { text }),
    protokoll: <T>(text: string) => post<T>("/api/ai/protokoll", { text }),
    angebot: <T>(text: string) => post<T>("/api/ai/angebot", { text }),
    mangel: (history: { role: string; text: string }[]) =>
      post<{ text: string }>("/api/ai/mangel", { history }),
  },
};
