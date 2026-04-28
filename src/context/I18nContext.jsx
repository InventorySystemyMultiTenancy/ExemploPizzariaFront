import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const I18N_API_URL = import.meta.env.VITE_I18N_URL || "http://localhost:3001";
const SISTEMA = "website";
const DEFAULT_LOCALE = "pt-BR";
const STORAGE_NS = `i18n_${SISTEMA}`;
const ANON_LOCALE_KEY = `${STORAGE_NS}_locale`;
const LEGACY_ANON_LOCALE_KEY = "i18n_locale";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

const I18nContext = createContext(null);

// ─── helpers de localStorage ────────────────────────────────────────────────

function readUserId() {
  try {
    const raw = localStorage.getItem("pc_user");
    return raw ? (JSON.parse(raw)?.id ?? null) : null;
  } catch {
    return null;
  }
}

function localeStorageKey(userId) {
  return userId ? `${STORAGE_NS}_locale_${userId}` : ANON_LOCALE_KEY;
}

function readLocale(userId) {
  // Tenta chave do usuário (namespaced) → chave anônima (namespaced) → legado → padrão
  return (
    localStorage.getItem(localeStorageKey(userId)) ||
    localStorage.getItem(ANON_LOCALE_KEY) ||
    localStorage.getItem(LEGACY_ANON_LOCALE_KEY) ||
    DEFAULT_LOCALE
  );
}

function saveLocale(userId, locale) {
  localStorage.setItem(localeStorageKey(userId), locale);
  // Salva também na chave anônima como fallback para usuários não logados
  localStorage.setItem(ANON_LOCALE_KEY, locale);
}

function cacheKey(locale) {
  return `${STORAGE_NS}_cache_${locale}`;
}

function readCache(locale) {
  try {
    const raw = localStorage.getItem(cacheKey(locale));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null; // expirado
    return data;
  } catch {
    return null;
  }
}

function writeCache(locale, data) {
  try {
    localStorage.setItem(
      cacheKey(locale),
      JSON.stringify({ data, ts: Date.now() }),
    );
  } catch {
    // localStorage cheio — ignora silenciosamente
  }
}

// ─── fetch ──────────────────────────────────────────────────────────────────

async function fetchTranslations(locale) {
  const res = await fetch(
    `${I18N_API_URL}/traducoes/${SISTEMA}/${encodeURIComponent(locale)}`,
  );
  if (!res.ok) throw new Error(`I18n fetch failed: ${res.status}`);
  return res.json();
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function I18nProvider({ children }) {
  const [userId, setUserId] = useState(readUserId);
  const [locale, setLocaleState] = useState(() => readLocale(readUserId()));
  const [translations, setTranslations] = useState({});
  const [direction, setDirection] = useState("ltr");
  const [loading, setLoading] = useState(true);

  // Carrega traduções para o locale atual (cache + stale-while-revalidate)
  useEffect(() => {
    let cancelled = false;

    const apply = (data) => {
      setTranslations(data.traducoes || {});
      const dir = data.direcao || "ltr";
      setDirection(dir);
      document.documentElement.setAttribute("dir", dir);
      document.documentElement.setAttribute("lang", locale);
    };

    const cached = readCache(locale);

    if (cached) {
      // Usa cache imediatamente — zero flash de carregamento
      apply(cached);
      Promise.resolve().then(() => {
        if (!cancelled) setLoading(false);
      });

      // Atualiza em background (stale-while-revalidate)
      fetchTranslations(locale)
        .then((data) => {
          if (cancelled) return;
          writeCache(locale, data);
          apply(data);
        })
        .catch(() => {
          /* mantém cache em uso */
        });
    } else {
      // Sem cache: busca com loading
      Promise.resolve().then(() => {
        if (!cancelled) setLoading(true);
      });
      fetchTranslations(locale)
        .then((data) => {
          if (cancelled) return;
          writeCache(locale, data);
          apply(data);
        })
        .catch(() => {
          // Falha total: mantém traduções anteriores
          if (!cancelled) setLoading(false);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [locale]);

  // Reage a login/logout via evento disparado pelo AuthContext
  useEffect(() => {
    const handleAuthChange = (e) => {
      const newUser = e.detail?.user ?? null;
      const newUserId = newUser?.id ?? null;
      setUserId(newUserId);
      // Carrega o locale salvo desse usuário (ou anônimo)
      const savedLocale = readLocale(newUserId);
      setLocaleState(savedLocale);
    };

    window.addEventListener("pc_auth_change", handleAuthChange);
    return () => window.removeEventListener("pc_auth_change", handleAuthChange);
  }, []);

  const setLocale = useCallback(
    (newLocale) => {
      saveLocale(userId, newLocale);
      setLocaleState(newLocale);
    },
    [userId],
  );

  const t = useCallback(
    (key, fallback) => translations[key] ?? fallback ?? key,
    [translations],
  );

  const refreshTranslations = useCallback(async () => {
    try {
      const data = await fetchTranslations(locale);
      writeCache(locale, data);

      setTranslations(data.traducoes || {});
      const dir = data.direcao || "ltr";
      setDirection(dir);
      document.documentElement.setAttribute("dir", dir);
      document.documentElement.setAttribute("lang", locale);
      return true;
    } catch {
      return false;
    }
  }, [locale]);

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        direction,
        loading,
        refreshTranslations,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook para consumir o contexto de I18n.
 * Uso: const { t, locale, setLocale, direction } = useTranslation();
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx)
    throw new Error("useTranslation deve ser usado dentro de I18nProvider");
  return ctx;
}
