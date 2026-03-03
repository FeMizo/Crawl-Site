const { useEffect, useState } = React;

function ReactShell() {
  const [markup, setMarkup] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/legacy-markup.html", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar la interfaz");
        return r.text();
      })
      .then((html) => {
        if (!active) return;
        setMarkup(html);
      })
      .catch((e) => {
        if (!active) return;
        setLoadError(e.message || "Error cargando interfaz");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!markup || typeof window.initSeoCrawlerApp !== "function") return;
    window.initSeoCrawlerApp();
  }, [markup]);

  if (loadError) {
    return (
      <div style={{ padding: "24px", fontFamily: "Manrope, sans-serif", color: "#ff5252" }}>
        {loadError}
      </div>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: markup }} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<ReactShell />);
