// ─────────────────────────────────────────────────────────────────────────────
// Fix para Node v25+ en el servidor.
//
// Node 25 expone un `globalThis.localStorage` / `sessionStorage` experimental
// incluso del lado del servidor, pero SIN un archivo de respaldo válido sus
// métodos (getItem, setItem, …) NO son funciones. Cualquier librería que haga
// `typeof localStorage !== "undefined"` durante el SSR cree que está en el
// navegador, llama a `.getItem()` y revienta con:
//   TypeError: localStorage.getItem is not a function   → HTTP 500
//
// Aquí reemplazamos esos globals rotos por una implementación en memoria que
// sí funciona, de modo que el renderizado del servidor no falle.
// ─────────────────────────────────────────────────────────────────────────────

function makeMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

function patch(name: "localStorage" | "sessionStorage") {
  const g = globalThis as unknown as Record<string, { getItem?: unknown } | undefined>;
  const current = g[name];

  // No existe (servidor "normal") o ya funciona → no tocar nada.
  if (typeof current === "undefined") return;
  if (current && typeof current.getItem === "function") return;

  try {
    Object.defineProperty(globalThis, name, {
      value: makeMemoryStorage(),
      configurable: true,
      writable: true,
    });
  } catch {
    /* Si no se puede redefinir, lo dejamos como está. */
  }
}

export function fixServerStorage() {
  // Solo en servidor. En el navegador el localStorage real funciona perfecto.
  if (typeof window !== "undefined") return;
  patch("localStorage");
  patch("sessionStorage");
}

// Se ejecuta al importar el módulo (cubre el realm donde se renderiza la página).
fixServerStorage();
