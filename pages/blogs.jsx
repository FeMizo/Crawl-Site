import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Icon from "../components/ui/Icon";
import Modal from "../components/ui/Modal";
import Notifications, { useNotifications } from "../components/ui/Notifications";
import StatCard from "../components/ui/StatCard";
import useSessionUser from "../hooks/useSessionUser";
import { tUi, useUiLanguage } from "../lib/ui-language";

const EMPTY_BLOG = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  keywords: "",
  status: "draft",
};

const DEFAULT_BRIEF = {
  primaryKeywords: "",
  secondaryKeywords: "",
  title: "",
  slug: "",
  language: "es",
  tone: "profesional",
  writingStyle: "articulo educativo",
  audience: "clientes potenciales",
  intent: "informacional",
  length: "medio",
  cta: "",
  outline: "",
  includeFaq: true,
  useCrawlContext: true,
  useRecommendation: false,
};

const SELECT_OPTIONS = {
  language: [["es", "Espanol"], ["en", "English"]],
  tone: [["profesional", "Profesional"], ["cercano", "Cercano"], ["tecnico", "Tecnico"], ["ejecutivo", "Ejecutivo"], ["comercial", "Comercial"]],
  writingStyle: [["guia practica", "Guia practica"], ["articulo educativo", "Articulo educativo"], ["comparativa", "Comparativa"], ["lista/checklist", "Lista / checklist"], ["landing seo", "Landing SEO"]],
  intent: [["informacional", "Informacional"], ["comercial", "Comercial"], ["transaccional", "Transaccional"], ["local", "Local"]],
  length: [["corto", "Corto"], ["medio", "Medio"], ["largo", "Largo"]],
};

function keywordString(value) {
  return Array.isArray(value) ? value.filter(Boolean).join(", ") : String(value || "");
}

function estimateTokens(brief, recommendation, project) {
  const payloadLength = JSON.stringify({ brief, recommendation, project }).length;
  const inputTokens = Math.ceil(payloadLength / 4) + 450;
  const outputTokens = brief.length === "largo" ? 3200 : brief.length === "corto" ? 1400 : 2300;
  return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens };
}

export default function BlogsPage() {
  const router = useRouter();
  const lang = useUiLanguage();
  const t = (key) => tUi(lang, key);
  const { sessionUser, sessionHydrated, setSessionUser, clearSessionUser } = useSessionUser();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [connection, setConnection] = useState(null);
  const [drive, setDrive] = useState(null);
  const [limits, setLimits] = useState({ maxBlogs: 0, blogsUsed: 0, blogsRemaining: 0 });
  const [projectRuns, setProjectRuns] = useState([]);
  const [activeBlogId, setActiveBlogId] = useState("");
  const [form, setForm] = useState(EMPTY_BLOG);
  const [wpForm, setWpForm] = useState({ siteUrl: "", username: "", appPassword: "" });
  const [wpModalOpen, setWpModalOpen] = useState(false);
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [drivePopupOpen, setDrivePopupOpen] = useState(false);
  const [blogConfigOpen, setBlogConfigOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [blogBrief, setBlogBrief] = useState(DEFAULT_BRIEF);
  const [busy, setBusy] = useState(false);
  const { notifications, notify, dismiss } = useNotifications();

  const activeBlog = useMemo(
    () => blogs.find((blog) => blog.id === activeBlogId) || null,
    [blogs, activeBlogId],
  );

  const tokenEstimate = useMemo(
    () => estimateTokens(blogBrief, selectedRecommendation, project),
    [blogBrief, selectedRecommendation, project],
  );

  useEffect(() => {
    if (!sessionHydrated) return;
    if (!sessionUser) {
      router.replace("/login?next=/blogs");
      return;
    }
    fetch("/api/projects?limit=24")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          clearSessionUser();
          router.replace("/login?next=/blogs");
          return null;
        }
        if (!response.ok) throw new Error(data.error || "No se pudieron cargar proyectos");
        return data;
      })
      .then((data) => {
        if (!data) return;
        setSessionUser(data.viewer || null);
        setProjects(data.projects || []);
        const nextProjectId = router.query.projectId || data.projects?.[0]?.id || "";
        setProjectId(String(nextProjectId));
      })
      .catch((err) => notify({ tone: "error", title: "No se pudieron cargar proyectos", message: err.message }));
  }, [sessionHydrated, sessionUser, router.query.projectId]);

  useEffect(() => {
    if (!projectId) return;
    loadProject(projectId);
  }, [projectId]);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "seo-crawler:google-drive-connected") {
        setDrivePopupOpen(false);
        setDriveModalOpen(false);
        notify({ tone: "success", title: "Google Drive conectado" });
        if (projectId) loadProject(projectId);
      }
      if (event.data?.type === "seo-crawler:google-drive-failed") {
        setDrivePopupOpen(false);
        setDriveModalOpen(false);
        notify({ tone: "error", title: "No se pudo conectar Drive", message: event.data?.message || "OAuth falló." });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [projectId, notify]);

  const loadProject = async (id) => {
    setBusy(true);
    try {
      const [projectResponse, blogResponse] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/blogs`),
      ]);
      const projectData = await projectResponse.json().catch(() => ({}));
      const blogData = await blogResponse.json().catch(() => ({}));
      if (!projectResponse.ok) throw new Error(projectData.error || "No se pudo cargar el proyecto");
      if (!blogResponse.ok) throw new Error(blogData.error || "No se pudieron cargar blogs");
      setProject(blogData.project || projectData.project);
      setProjectRuns(projectData.project?.crawlRuns || []);
      setBlogs(blogData.blogs || []);
      setConnection(blogData.wordpressConnection || null);
      setDrive(blogData.googleDriveConnection || null);
      setLimits(blogData.limits || { maxBlogs: 0, blogsUsed: blogData.blogs?.length || 0, blogsRemaining: 0 });
      setActiveBlogId(blogData.blogs?.[0]?.id || "");
      setForm(EMPTY_BLOG);
      setWpForm((current) => ({
        siteUrl: blogData.wordpressConnection?.siteUrl || current.siteUrl,
        username: blogData.wordpressConnection?.username || current.username,
        appPassword: "",
      }));
    } catch (err) {
      notify({ tone: "error", title: "No se pudieron cargar los blogs", message: err.message || "Error cargando blogs" });
    } finally {
      setBusy(false);
    }
  };

  const loadRecommendations = async () => {
    const runId = projectRuns[0]?.id;
    if (!projectId || !runId) {
      notify({ tone: "error", title: "Falta crawl", message: "Primero ejecuta un crawl del proyecto." });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/ai/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudieron generar recomendaciones");
      setRecommendations(data.recommendations || []);
      notify({ tone: "success", title: "Recomendaciones listas" });
    } catch (err) {
      notify({ tone: "error", title: "No se pudieron generar recomendaciones", message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const openBlogConfig = (recommendation = null) => {
    const outline = keywordString(recommendation?.suggestedH2s).replace(/, /g, "\n");
    setSelectedRecommendation(recommendation);
    setBlogBrief({
      ...DEFAULT_BRIEF,
      primaryKeywords: recommendation?.primaryKeyword || form.keywords || "",
      secondaryKeywords: keywordString(recommendation?.secondaryKeywords),
      title: recommendation?.suggestedTitle || form.title || "",
      language: "es",
      intent: recommendation?.intent || "informacional",
      outline,
      useRecommendation: Boolean(recommendation),
    });
    setBlogConfigOpen(true);
  };

  const submitBlog = async (generate) => {
    const primaryKeywords = blogBrief.primaryKeywords.split(",").map((item) => item.trim()).filter(Boolean);
    const secondaryKeywords = blogBrief.secondaryKeywords.split(",").map((item) => item.trim()).filter(Boolean);
    const outline = blogBrief.outline.split("\n").map((item) => item.trim()).filter(Boolean);
    if (!primaryKeywords.length && !blogBrief.title.trim()) {
      notify({ tone: "error", title: "Faltan keywords", message: "Agrega al menos una keyword o un titulo." });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/blogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generate,
          mode: generate ? "ai" : "empty",
          recommendationId: selectedRecommendation?.id,
          keyword: primaryKeywords[0],
          keywords: [...primaryKeywords, ...secondaryKeywords],
          title: blogBrief.title,
          slug: blogBrief.slug,
          runId: selectedRecommendation?.runId || projectRuns[0]?.id,
          brief: {
            ...blogBrief,
            source: selectedRecommendation ? "recommendation" : "custom",
            recommendationId: selectedRecommendation?.id || "",
            primaryKeywords,
            secondaryKeywords,
            primaryKeyword: primaryKeywords[0] || blogBrief.title,
            outline,
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo crear blog");
      setBlogs((current) => [data.blog, ...current]);
      setLimits((current) => ({
        ...current,
        blogsUsed: current.blogsUsed + 1,
        blogsRemaining: Math.max(0, current.blogsRemaining - 1),
      }));
      setActiveBlogId(data.blog.id);
      setBlogConfigOpen(false);
      notify({ tone: "success", title: generate ? "Blog generado" : "Borrador creado" });
    } catch (err) {
      notify({ tone: "error", title: "No se pudo crear blog", message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const saveBlog = async () => {
    if (!activeBlog) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/blogs/${activeBlog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          keywords: form.keywords.split(",").map((item) => item.trim()).filter(Boolean),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo guardar");
      setBlogs((current) => current.map((blog) => (blog.id === data.blog.id ? data.blog : blog)));
      notify({ tone: "success", title: "Blog guardado" });
    } catch (err) {
      notify({ tone: "error", title: "No se pudo guardar", message: err.message });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!activeBlog) {
      setForm(EMPTY_BLOG);
      return;
    }
    setForm({
      title: activeBlog.title || "",
      slug: activeBlog.slug || "",
      excerpt: activeBlog.excerpt || "",
      content: activeBlog.content || "",
      keywords: (activeBlog.keywords || []).join(", "),
      status: activeBlog.status || "draft",
    });
  }, [activeBlogId]);

  const saveWordPress = async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/wordpress-connection`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wpForm),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo guardar WordPress");
      setConnection(data.connection);
      setWpForm((current) => ({ ...current, appPassword: "" }));
      setWpModalOpen(false);
      notify({ tone: "success", title: "WordPress conectado" });
    } catch (err) {
      notify({ tone: "error", title: "No se pudo conectar WordPress", message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const connectDrive = async () => {
    const popup = window.open("", "seoDriveLogin", "width=520,height=720,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes");
    if (!popup) {
      notify({ tone: "error", title: "Ventana bloqueada", message: "Permite ventanas emergentes para completar Google OAuth." });
      return;
    }
    popup.document.write("<p style=\"font-family:sans-serif;padding:20px\">Abriendo Google Drive...</p>");
    const response = await fetch("/api/google-drive/connect");
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      popup.close();
      notify({ tone: "error", title: "Google Drive no configurado", message: data.error || "Faltan credenciales OAuth." });
      return;
    }
    setDrivePopupOpen(true);
    popup.location.href = data.authUrl;
    const timer = window.setInterval(() => {
      if (!popup.closed) return;
      window.clearInterval(timer);
      setDrivePopupOpen(false);
      setDriveModalOpen(false);
      if (projectId) loadProject(projectId);
    }, 800);
  };

  const exportWordPress = async (status) => {
    if (!activeBlog) return;
    const confirmPublish = status !== "publish" || window.confirm("Publicar directamente en WordPress?");
    if (!confirmPublish) return;
    await postExport(`/api/projects/${projectId}/blogs/${activeBlog.id}/export/wordpress`, {
      status,
      confirmPublish: status === "publish",
    });
  };

  const postExport = async (url, body = {}) => {
    setBusy(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo exportar");
      if (data.blog) setBlogs((current) => current.map((blog) => (blog.id === data.blog.id ? data.blog : blog)));
      notify({ tone: "success", title: "Exportacion lista" });
    } catch (err) {
      notify({ tone: "error", title: "No se pudo exportar", message: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head>
        <title>Blogs | SEO Crawler</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Notifications items={notifications} onDismiss={dismiss} />
      <AppShell
        activeKey="blogs"
        user={sessionUser}
        kicker="Contenido SEO"
        title="Blogs"
        description="Genera borradores desde keywords, edita contenido y exporta a WordPress, DOCX o Google Drive."
        aside={
          <div className="aside-stats">
            <StatCard label="Blogs" value={blogs.length} hint={project?.name || "Proyecto"} tone="primary" icon={<Icon name="tasks" size={14} />} />
            <StatCard label="Límite" value={`${limits.blogsUsed}/${limits.maxBlogs}`} hint="Plan activo" tone="secondary" icon={<Icon name="plan" size={14} />} />
          </div>
        }
      >
        <div className="blogs-page">
          <Card>
            <div className="toolbar top-toolbar">
              <select className="ui-input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                {projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <span className="limit-pill">Blogs: {limits.blogsUsed}/{limits.maxBlogs}</span>
              <Button type="button" onClick={loadRecommendations} loading={busy} iconLeft={<Icon name="run" size={15} />}>
                Generar recomendaciones IA
              </Button>
              <Button type="button" variant="outline" tone="secondary" onClick={() => openBlogConfig(null)} loading={busy} disabled={limits.blogsRemaining <= 0} iconLeft={<Icon name="plus" size={15} />}>
                Crear blog
              </Button>
            </div>
          </Card>

          <Card>
            <div className="integrations-row">
              <div className="integration-block">
                <div>
                  <h2>WordPress</h2>
                  <p className="muted">{connection ? `Conectado: ${connection.siteUrl}` : "Conecta WordPress para enviar drafts o publicar."}</p>
                </div>
                <Button type="button" onClick={() => setWpModalOpen(true)} loading={busy}>
                  {connection ? "Editar WP" : "Conectar WP"}
                </Button>
              </div>
              <div className="integration-block compact">
                <div>
                  <h2>Google Drive</h2>
                  <p className="muted">{drive ? `Conectado: ${drive.email || "Google Drive"}` : "Conecta Drive para exportar DOCX."}</p>
                </div>
                <Button type="button" onClick={() => setDriveModalOpen(true)} variant="outline" tone="secondary" loading={drivePopupOpen}>
                  {drive ? "Reconectar Drive" : "Conectar Drive"}
                </Button>
              </div>
            </div>
          </Card>

          <div className="workspace-grid">
            <div className="left-rail">
              <Card>
                <h2>Recomendaciones</h2>
                <div className="list">
                  {recommendations.map((item) => (
                    <button key={item.id || item.pageUrl} className="rec" onClick={() => openBlogConfig(item)} type="button" disabled={limits.blogsRemaining <= 0}>
                      <strong>{item.primaryKeyword}</strong>
                      <span>{item.suggestedTitle}</span>
                    </button>
                  ))}
                  {!recommendations.length ? <p className="muted">Genera recomendaciones desde el ultimo crawl.</p> : null}
                </div>
              </Card>
              <Card>
                <h2>Borradores</h2>
                <div className="list">
                  {blogs.map((blog) => (
                    <button key={blog.id} className={`rec${activeBlogId === blog.id ? " on" : ""}`} onClick={() => setActiveBlogId(blog.id)} type="button">
                      <strong>{blog.title}</strong>
                      <span>{blog.status}</span>
                    </button>
                  ))}
                  {!blogs.length ? <p className="muted">Aun no hay blogs.</p> : null}
                </div>
              </Card>
            </div>
            <Card>
              <div className="editor-head">
                <h2>Editor</h2>
                <div className="actions">
                  <Button type="button" onClick={saveBlog} loading={busy} disabled={!activeBlog}>Guardar</Button>
                  {activeBlog ? <Button href={`/api/projects/${projectId}/blogs/${activeBlog.id}/export/docx`} variant="outline" tone="secondary">DOCX</Button> : null}
                  <Button type="button" variant="outline" tone="secondary" onClick={() => activeBlog && postExport(`/api/projects/${projectId}/blogs/${activeBlog.id}/export/google-drive`)} disabled={!activeBlog || !drive}>Drive</Button>
                  <Button type="button" variant="outline" tone="secondary" onClick={() => exportWordPress("draft")} disabled={!activeBlog || !connection}>WP draft</Button>
                  <Button type="button" variant="solid" tone="primary" onClick={() => exportWordPress("publish")} disabled={!activeBlog || !connection}>WP publish</Button>
                </div>
              </div>
              <div className="form-grid">
                <input className="ui-input" placeholder="Titulo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <input className="ui-input" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                <input className="ui-input" placeholder="Keywords separadas por coma" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
                <textarea className="ui-input" placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
                <textarea className="ui-input content" placeholder="Contenido Markdown" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
            </Card>
          </div>
        </div>
        <style jsx>{`
          .blogs-page, .list, .form-grid { display: grid; gap: 12px; }
          .toolbar, .editor-head, .actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
          .toolbar .ui-input { max-width: 320px; }
          .top-toolbar { justify-content: flex-start; }
          .limit-pill { border: 1px solid var(--border); border-radius: 999px; padding: 7px 10px; color: var(--text2); font-size: 13px; }
          .integrations-row { display: grid; grid-template-columns: 1.8fr 1fr; gap: 14px; align-items: start; }
          .integration-block { display: grid; gap: 10px; }
          .integration-block.compact { align-content: start; }
          .inline-fields { display: grid; grid-template-columns: minmax(150px, 1fr) minmax(120px, 0.7fr) minmax(150px, 0.8fr) auto; gap: 8px; align-items: center; }
          .workspace-grid { display: grid; grid-template-columns: minmax(260px, 0.42fr) minmax(0, 1fr); gap: 14px; align-items: start; }
          .left-rail { display: grid; gap: 14px; }
          h2 { margin: 0 0 10px; font-size: 16px; }
          .rec { text-align: left; border: 1px solid var(--border); background: var(--bg2); color: var(--text); border-radius: 8px; padding: 10px; cursor: pointer; display: grid; gap: 4px; }
          .rec.on, .rec:hover { border-color: var(--accent); }
          .rec:disabled { cursor: not-allowed; opacity: 0.55; }
          .rec span, .muted { color: var(--text2); font-size: 13px; }
          .content { min-height: 360px; font-family: Consolas, monospace; }
          @media (max-width: 1000px) {
            .integrations-row, .workspace-grid, .inline-fields { grid-template-columns: 1fr; }
          }
        `}</style>
      </AppShell>
      {blogConfigOpen ? (
        <Modal
          title="Configurar blog"
          maxWidth={760}
          onClose={() => setBlogConfigOpen(false)}
          actions={
            <>
              <Button type="button" variant="outline" tone="secondary" onClick={() => setBlogConfigOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" variant="outline" tone="secondary" onClick={() => submitBlog(false)} loading={busy}>
                Crear borrador vacio
              </Button>
              <Button type="button" onClick={() => submitBlog(true)} loading={busy}>
                Generar con IA
              </Button>
            </>
          }
        >
          <div className="blog-config">
            <div className="token-note">
              No se gastan tokens hasta presionar Generar con IA. Estimado: {tokenEstimate.totalTokens.toLocaleString()} tokens.
            </div>
            {selectedRecommendation ? (
              <div className="selected-source">
                <strong>Desde recomendacion:</strong>
                <span>{selectedRecommendation.primaryKeyword}</span>
              </div>
            ) : (
              <div className="selected-source">
                <strong>Desde keywords propios</strong>
                <span>Define el brief antes de crear el borrador.</span>
              </div>
            )}
            <div className="config-grid">
              <label>
                Keywords principales
                <input className="ui-input" value={blogBrief.primaryKeywords} onChange={(e) => setBlogBrief({ ...blogBrief, primaryKeywords: e.target.value })} placeholder="keyword principal, segunda keyword" />
              </label>
              <label>
                Keywords secundarias
                <input className="ui-input" value={blogBrief.secondaryKeywords} onChange={(e) => setBlogBrief({ ...blogBrief, secondaryKeywords: e.target.value })} placeholder="keyword secundaria, variacion long-tail" />
              </label>
              <label>
                Titulo provisional
                <input className="ui-input" value={blogBrief.title} onChange={(e) => setBlogBrief({ ...blogBrief, title: e.target.value })} placeholder="Titulo del blog" />
              </label>
              <label>
                Slug
                <input className="ui-input" value={blogBrief.slug} onChange={(e) => setBlogBrief({ ...blogBrief, slug: e.target.value })} placeholder="slug-opcional" />
              </label>
              <label>
                Idioma
                <select className="ui-input" value={blogBrief.language} onChange={(e) => setBlogBrief({ ...blogBrief, language: e.target.value })}>
                  {SELECT_OPTIONS.language.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                Tono
                <select className="ui-input" value={blogBrief.tone} onChange={(e) => setBlogBrief({ ...blogBrief, tone: e.target.value })}>
                  {SELECT_OPTIONS.tone.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                Tipo de escritura
                <select className="ui-input" value={blogBrief.writingStyle} onChange={(e) => setBlogBrief({ ...blogBrief, writingStyle: e.target.value })}>
                  {SELECT_OPTIONS.writingStyle.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                Intencion SEO
                <select className="ui-input" value={blogBrief.intent} onChange={(e) => setBlogBrief({ ...blogBrief, intent: e.target.value })}>
                  {SELECT_OPTIONS.intent.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                Longitud
                <select className="ui-input" value={blogBrief.length} onChange={(e) => setBlogBrief({ ...blogBrief, length: e.target.value })}>
                  {SELECT_OPTIONS.length.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                Audiencia
                <input className="ui-input" value={blogBrief.audience} onChange={(e) => setBlogBrief({ ...blogBrief, audience: e.target.value })} placeholder="clientes potenciales" />
              </label>
              <label className="wide">
                CTA final
                <input className="ui-input" value={blogBrief.cta} onChange={(e) => setBlogBrief({ ...blogBrief, cta: e.target.value })} placeholder="Agenda una auditoria, contactanos, descarga..." />
              </label>
              <label className="wide">
                Outline H2/H3
                <textarea className="ui-input outline-box" value={blogBrief.outline} onChange={(e) => setBlogBrief({ ...blogBrief, outline: e.target.value })} placeholder={"Un heading por linea\nQue es...\nBeneficios...\nPreguntas frecuentes"} />
              </label>
            </div>
            <div className="toggles-row">
              <label><input type="checkbox" checked={blogBrief.includeFaq} onChange={(e) => setBlogBrief({ ...blogBrief, includeFaq: e.target.checked })} /> Incluir FAQ</label>
              <label><input type="checkbox" checked={blogBrief.useCrawlContext} onChange={(e) => setBlogBrief({ ...blogBrief, useCrawlContext: e.target.checked })} /> Usar contexto del crawl</label>
              <label><input type="checkbox" checked={blogBrief.useRecommendation} disabled={!selectedRecommendation} onChange={(e) => setBlogBrief({ ...blogBrief, useRecommendation: e.target.checked })} /> Usar recomendacion seleccionada</label>
            </div>
          </div>
          <style jsx>{`
            .blog-config { display: grid; gap: 14px; }
            .token-note {
              border: 1px solid var(--border);
              background: var(--bg3);
              color: var(--text2);
              border-radius: 8px;
              padding: 10px 12px;
              font-size: 13px;
            }
            .selected-source { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; color: var(--text2); font-size: 13px; }
            .selected-source strong { color: var(--text); }
            .config-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
            .config-grid label { display: grid; gap: 6px; color: var(--text2); font-size: 12px; }
            .config-grid .wide { grid-column: 1 / -1; }
            .outline-box { min-height: 120px; }
            .toggles-row { display: flex; flex-wrap: wrap; gap: 12px; color: var(--text2); font-size: 13px; }
            .toggles-row label { display: inline-flex; gap: 7px; align-items: center; }
            @media (max-width: 760px) {
              .config-grid { grid-template-columns: 1fr; }
            }
          `}</style>
        </Modal>
      ) : null}
      {wpModalOpen ? (
        <Modal
          title="Conectar WordPress"
          onClose={() => setWpModalOpen(false)}
          actions={
            <>
              <Button type="button" variant="outline" tone="secondary" onClick={() => setWpModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={saveWordPress} loading={busy}>
                Guardar
              </Button>
            </>
          }
        >
          <div className="wp-modal-form">
            <input className="ui-input" placeholder="https://tusitio.com" value={wpForm.siteUrl} onChange={(e) => setWpForm({ ...wpForm, siteUrl: e.target.value })} />
            <input className="ui-input" placeholder="Usuario" value={wpForm.username} onChange={(e) => setWpForm({ ...wpForm, username: e.target.value })} />
            <input className="ui-input" placeholder="Application Password" type="password" value={wpForm.appPassword} onChange={(e) => setWpForm({ ...wpForm, appPassword: e.target.value })} />
          </div>
          <style jsx>{`
            .wp-modal-form {
              display: grid;
              gap: 10px;
            }
          `}</style>
        </Modal>
      ) : null}
      {driveModalOpen ? (
        <Modal
          title="Conectar Google Drive"
          onClose={() => setDriveModalOpen(false)}
          actions={
            <>
              <Button type="button" variant="outline" tone="secondary" onClick={() => setDriveModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={connectDrive} loading={drivePopupOpen}>
                Continuar con Google
              </Button>
            </>
          }
        >
          <div className="drive-modal-body">
            <p className="muted">
              {drive ? `Cuenta conectada: ${drive.email || "Google Drive"}` : "Conecta tu cuenta para guardar DOCX directamente en Drive."}
            </p>
            <p className="muted">
              Google puede abrir una ventana de autorización externa; al terminar volverás aquí.
            </p>
          </div>
          <style jsx>{`
            .drive-modal-body {
              display: grid;
              gap: 10px;
            }
            .muted {
              margin: 0;
              color: var(--text2);
              font-size: 13px;
            }
          `}</style>
        </Modal>
      ) : null}
    </>
  );
}
