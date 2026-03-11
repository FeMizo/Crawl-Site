import { useEffect, useState } from "react";

const UI_COPY = {
  es: {
    navDashboard: "Inicio",
    navRoadmap: "Roadmap",
    navProjects: "Proyectos",
    navHistory: "Historial",
    navSettings: "Ajustes",
    navLogin: "Iniciar sesion",
    navRegister: "Registro",
    statusActive: "Activo",
    statusGuest: "Invitado",
    statusPublicAccess: "Acceso publico",
    dashboardKicker: "Paginas / Panel",
    dashboardTitleFallback: "Panel",
    dashboardDescriptionLoading: "Cargando proyecto...",
    btnProjects: "Proyectos",
    btnRename: "Renombrar",
    btnDelete: "Eliminar",
    statRuns: "Rastreos",
    statProject: "Proyecto",
    hintRecent: "Recientes",
    hintActive: "Activo",
    historyTitle: "Historial",
    withIssues: "con problemas",
    noSavedHistory: "Todavia no hay historial guardado.",
    loadingDashboard: "Cargando dashboard...",
    promptRename: "Nuevo nombre del proyecto",
    confirmDelete: "Esto eliminara el proyecto y su historial. Continuar?",
    seoScoreStat: "Puntaje SEO",
  },
  en: {
    navDashboard: "Home",
    navRoadmap: "Roadmap",
    navProjects: "Projects",
    navHistory: "History",
    navSettings: "Settings",
    navLogin: "Sign in",
    navRegister: "Register",
    statusActive: "Active",
    statusGuest: "Guest",
    statusPublicAccess: "Public access",
    dashboardKicker: "Pages / Dashboard",
    dashboardTitleFallback: "Dashboard",
    dashboardDescriptionLoading: "Loading project...",
    btnProjects: "Projects",
    btnRename: "Rename",
    btnDelete: "Delete",
    statRuns: "Crawls",
    statProject: "Project",
    hintRecent: "Recent",
    hintActive: "Active",
    historyTitle: "History",
    withIssues: "with issues",
    noSavedHistory: "No saved history yet.",
    loadingDashboard: "Loading dashboard...",
    promptRename: "New project name",
    confirmDelete: "This will delete the project and its history. Continue?",
    seoScoreStat: "SEO Score",
  },
};

function normalizeLang(input) {
  return input === "en" ? "en" : "es";
}

export function getUiLanguage() {
  if (typeof window === "undefined") return "es";
  return normalizeLang(window.localStorage.getItem("seoCrawlerLang") || "es");
}

export function tUi(lang, key) {
  const locale = normalizeLang(lang);
  return UI_COPY[locale][key] || key;
}

export function useUiLanguage() {
  const [lang, setLang] = useState("es");

  useEffect(() => {
    const update = (nextLang) => {
      setLang(normalizeLang(nextLang || getUiLanguage()));
    };

    update(getUiLanguage());

    const onStorage = (event) => {
      if (event.key === "seoCrawlerLang") update(event.newValue);
    };
    const onLangChange = (event) => {
      update(event?.detail?.lang);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("seo-lang-change", onLangChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("seo-lang-change", onLangChange);
    };
  }, []);

  return lang;
}
