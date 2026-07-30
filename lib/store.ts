"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import { api } from "./api-client";
import type {
  Task,
  Wunsch,
  RaumProfil,
  Protokoll,
  Foto,
  Rechnung,
  Angebot,
  BautagebuchEintrag,
  MangelChatMessage,
  Bereich,
  AktiverTab,
} from "./types";

// Server-Antworten enthalten `null` für leere optionale Felder (Prisma),
// unsere TS-Typen erwarten `undefined`. Für die UI-Logik (`if (task.flaeche)`)
// macht das keinen Unterschied, hier vereinheitlichen wir es trotzdem sauber.
function nullsToUndefined<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === null ? undefined : v;
  }
  return out as T;
}

interface ServerState {
  tasks: Task[];
  wuensche: Wunsch[];
  raumProfile: RaumProfil[];
  protokolle: Protokoll[];
  fotos: Foto[];
  rechnungen: Rechnung[];
  angebote: Angebot[];
  bautagebuch: BautagebuchEintrag[];
  mangelChat: MangelChatMessage[];
}

interface BauSchlauState {
  tasks: Task[];
  wuensche: Wunsch[];
  raumProfile: RaumProfil[];
  protokolle: Protokoll[];
  fotos: Foto[];
  rechnungen: Rechnung[];
  angebote: Angebot[];
  bautagebuch: BautagebuchEintrag[];
  mangelChat: MangelChatMessage[];

  aktiverTab: AktiverTab;
  aktiverBereichFilter: Bereich | null;

  hydrated: boolean;
  syncError: string | null;
  clearSyncError: () => void;
  hydrateFromServer: () => Promise<void>;

  setAktiverTab: (tab: AktiverTab) => void;
  setAktiverBereichFilter: (bereich: Bereich | null) => void;

  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  addWunsch: (text: string) => Wunsch;
  updateWunsch: (id: string, patch: Partial<Wunsch>) => void;
  deleteWunsch: (id: string) => void;

  addRaumProfil: (profil: Omit<RaumProfil, "id" | "createdAt">) => RaumProfil;
  updateRaumProfil: (id: string, patch: Partial<RaumProfil>) => void;
  deleteRaumProfil: (id: string) => void;

  addProtokoll: (protokoll: Omit<Protokoll, "id" | "createdAt">) => Protokoll;
  updateProtokoll: (id: string, patch: Partial<Protokoll>) => void;
  deleteProtokoll: (id: string) => void;

  addFoto: (foto: Omit<Foto, "id">) => Foto;
  deleteFoto: (id: string) => void;

  addRechnung: (r: Omit<Rechnung, "id">) => Rechnung;
  deleteRechnung: (id: string) => void;

  addAngebot: (a: Omit<Angebot, "id" | "erstelltAm">) => Angebot;
  deleteAngebot: (id: string) => void;

  addBautagebuchEintrag: (e: Omit<BautagebuchEintrag, "id">) => BautagebuchEintrag;

  addMangelChatMessage: (m: Omit<MangelChatMessage, "id" | "createdAt">) => void;

  importLegacyLocalStorageData: () => Promise<void>;
}

function onSyncFail(set: (partial: Partial<BauSchlauState>) => void, message: string) {
  return (err: unknown) => {
    console.error(message, err);
    set({ syncError: message });
  };
}

export const useBauSchlauStore = create<BauSchlauState>()(
  persist(
    (set, get) => ({
      tasks: [],
      wuensche: [],
      raumProfile: [],
      protokolle: [],
      fotos: [],
      rechnungen: [],
      angebote: [],
      bautagebuch: [],
      mangelChat: [],

      aktiverTab: "dashboard",
      aktiverBereichFilter: null,

      hydrated: false,
      syncError: null,
      clearSyncError: () => set({ syncError: null }),

      hydrateFromServer: async () => {
        try {
          const data = await api.state.get<ServerState>();
          set({
            tasks: data.tasks.map(nullsToUndefined),
            wuensche: data.wuensche.map(nullsToUndefined),
            raumProfile: data.raumProfile.map(nullsToUndefined),
            protokolle: data.protokolle.map(nullsToUndefined),
            fotos: data.fotos.map(nullsToUndefined),
            rechnungen: data.rechnungen.map(nullsToUndefined),
            angebote: data.angebote.map(nullsToUndefined),
            bautagebuch: data.bautagebuch.map(nullsToUndefined),
            mangelChat: data.mangelChat.map(nullsToUndefined),
            hydrated: true,
          });
        } catch (err) {
          console.error("Laden vom Server fehlgeschlagen, nutze lokalen Zwischenspeicher:", err);
          set({
            hydrated: true,
            syncError: "Verbindung zur Datenbank fehlgeschlagen – zeige zuletzt gespeicherten Stand.",
          });
        }
      },

      setAktiverTab: (tab) => set({ aktiverTab: tab }),
      setAktiverBereichFilter: (bereich) =>
        set((s) => ({
          aktiverBereichFilter: s.aktiverBereichFilter === bereich ? null : bereich,
        })),

      addTask: (task) => {
        const now = new Date().toISOString();
        const newTask: Task = { ...task, id: uuid(), createdAt: now, updatedAt: now };
        set((s) => ({ tasks: [newTask, ...s.tasks] }));
        api.tasks.create(newTask).catch(onSyncFail(set, "Aufgabe konnte nicht gespeichert werden."));
        return newTask;
      },
      updateTask: (id, patch) => {
        const existing = get().tasks.find((t) => t.id === id);
        if (!existing) return;
        const updatedAt = new Date().toISOString();
        let erledigtAm: string | undefined = existing.erledigtAm;
        if (patch.status === "erledigt" && existing.status !== "erledigt") erledigtAm = updatedAt;
        else if (patch.status && patch.status !== "erledigt") erledigtAm = undefined;

        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt, erledigtAm } : t)),
        }));
        api.tasks
          .update(id, { ...patch, updatedAt, erledigtAm: erledigtAm ?? null })
          .catch(onSyncFail(set, "Änderung konnte nicht gespeichert werden."));
      },
      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
        api.tasks.remove(id).catch(onSyncFail(set, "Löschen konnte nicht gespeichert werden."));
      },

      addWunsch: (text) => {
        const w: Wunsch = { id: uuid(), text, uebernommen: false, createdAt: new Date().toISOString() };
        set((s) => ({ wuensche: [w, ...s.wuensche] }));
        api.wuensche.create(w).catch(onSyncFail(set, "Wunsch konnte nicht gespeichert werden."));
        return w;
      },
      updateWunsch: (id, patch) => {
        set((s) => ({ wuensche: s.wuensche.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
        api.wuensche.update(id, patch).catch(onSyncFail(set, "Wunsch-Änderung konnte nicht gespeichert werden."));
      },
      deleteWunsch: (id) => {
        set((s) => ({ wuensche: s.wuensche.filter((w) => w.id !== id) }));
        api.wuensche.remove(id).catch(onSyncFail(set, "Löschen konnte nicht gespeichert werden."));
      },

      addRaumProfil: (profil) => {
        const p: RaumProfil = { ...profil, id: uuid(), createdAt: new Date().toISOString() };
        set((s) => ({ raumProfile: [p, ...s.raumProfile] }));
        api.raumProfile.create(p).catch(onSyncFail(set, "Raumprofil konnte nicht gespeichert werden."));
        return p;
      },
      updateRaumProfil: (id, patch) => {
        set((s) => ({
          raumProfile: s.raumProfile.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }));
        api.raumProfile.update(id, patch).catch(onSyncFail(set, "Änderung konnte nicht gespeichert werden."));
      },
      deleteRaumProfil: (id) => {
        set((s) => ({ raumProfile: s.raumProfile.filter((p) => p.id !== id) }));
        api.raumProfile.remove(id).catch(onSyncFail(set, "Löschen konnte nicht gespeichert werden."));
      },

      addProtokoll: (protokoll) => {
        const p: Protokoll = { ...protokoll, id: uuid(), createdAt: new Date().toISOString() };
        set((s) => ({ protokolle: [p, ...s.protokolle] }));
        api.protokolle.create(p).catch(onSyncFail(set, "Protokoll konnte nicht gespeichert werden."));
        return p;
      },
      updateProtokoll: (id, patch) => {
        set((s) => ({
          protokolle: s.protokolle.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }));
        api.protokolle.update(id, patch).catch(onSyncFail(set, "Änderung konnte nicht gespeichert werden."));
      },
      deleteProtokoll: (id) => {
        set((s) => ({ protokolle: s.protokolle.filter((p) => p.id !== id) }));
        api.protokolle.remove(id).catch(onSyncFail(set, "Löschen konnte nicht gespeichert werden."));
      },

      addFoto: (foto) => {
        const f: Foto = { ...foto, id: uuid() };
        set((s) => ({ fotos: [f, ...s.fotos] }));
        api.fotos.create(f).catch(onSyncFail(set, "Foto konnte nicht gespeichert werden."));
        return f;
      },
      deleteFoto: (id) => {
        set((s) => ({ fotos: s.fotos.filter((f) => f.id !== id) }));
        api.fotos.remove(id).catch(onSyncFail(set, "Löschen konnte nicht gespeichert werden."));
      },

      addRechnung: (r) => {
        const rec: Rechnung = { ...r, id: uuid() };
        set((s) => ({ rechnungen: [rec, ...s.rechnungen] }));
        api.rechnungen.create(rec).catch(onSyncFail(set, "Rechnung konnte nicht gespeichert werden."));
        return rec;
      },
      deleteRechnung: (id) => {
        set((s) => ({ rechnungen: s.rechnungen.filter((r) => r.id !== id) }));
        api.rechnungen.remove(id).catch(onSyncFail(set, "Löschen konnte nicht gespeichert werden."));
      },

      addAngebot: (a) => {
        const angebot: Angebot = { ...a, id: uuid(), erstelltAm: new Date().toISOString() };
        set((s) => ({ angebote: [angebot, ...s.angebote] }));
        api.angebote.create(angebot).catch(onSyncFail(set, "Angebot konnte nicht gespeichert werden."));
        return angebot;
      },
      deleteAngebot: (id) => {
        set((s) => ({ angebote: s.angebote.filter((a) => a.id !== id) }));
        api.angebote.remove(id).catch(onSyncFail(set, "Löschen konnte nicht gespeichert werden."));
      },

      addBautagebuchEintrag: (e) => {
        const entry: BautagebuchEintrag = { ...e, id: uuid() };
        set((s) => ({ bautagebuch: [entry, ...s.bautagebuch] }));
        api.bautagebuch.create(entry).catch(onSyncFail(set, "Eintrag konnte nicht gespeichert werden."));
        return entry;
      },

      addMangelChatMessage: (m) => {
        const message: MangelChatMessage = { ...m, id: uuid(), createdAt: new Date().toISOString() };
        set((s) => ({ mangelChat: [...s.mangelChat, message] }));
        api.mangelChat.create(message).catch(onSyncFail(set, "Nachricht konnte nicht gespeichert werden."));
      },

      importLegacyLocalStorageData: async () => {
        const state = get();
        const payload = {
          tasks: state.tasks,
          wuensche: state.wuensche,
          raumProfile: state.raumProfile,
          protokolle: state.protokolle,
          fotos: state.fotos,
          rechnungen: state.rechnungen,
          angebote: state.angebote,
          bautagebuch: state.bautagebuch,
          mangelChat: state.mangelChat,
        };
        await api.import.legacyLocalStorage(payload);
        await get().hydrateFromServer();
      },
    }),
    {
      name: "bau-schlau-storage",
      version: 2,
      migrate: (persistedState) => persistedState as BauSchlauState,
      partialize: (s) => ({
        tasks: s.tasks,
        wuensche: s.wuensche,
        raumProfile: s.raumProfile,
        protokolle: s.protokolle,
        fotos: s.fotos,
        rechnungen: s.rechnungen,
        angebote: s.angebote,
        bautagebuch: s.bautagebuch,
        mangelChat: s.mangelChat,
        aktiverTab: s.aktiverTab,
      }),
    }
  )
);

export const useTasksByBereich = (bereich: Bereich | null) => {
  const tasks = useBauSchlauStore((s) => s.tasks);
  if (!bereich) return tasks;
  return tasks.filter((t) => t.bereich === bereich);
};

export { uuid };
