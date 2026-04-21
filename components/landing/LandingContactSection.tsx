import { useState } from "react";
import Card from "../ui/Card";
import Eyebrow from "../ui/Eyebrow";
import Icon from "../ui/Icon";
import Button from "../ui/Button";
import Input from "../ui/Input";

type Field = { name: string; email: string; message: string };
type Status = "idle" | "sending" | "sent" | "error";

export default function LandingContactSection() {
  const [fields, setFields] = useState<Field>({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (key: keyof Field) => (e: { target: { value: string } }) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.name.trim() || !fields.email.trim() || !fields.message.trim()) {
      setErrorMsg("Todos los campos son requeridos.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar.");
      setStatus("sent");
      setFields({ name: "", email: "", message: "" });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error al enviar.");
      setStatus("error");
    }
  };

  return (
    <Card className="contact-card">
      <Eyebrow icon={<Icon name="user" size={12} />}>Contacto</Eyebrow>

      {status === "sent" ? (
        <div className="contact-success">
          <Icon name="check" size={18} />
          <span>Mensaje enviado. Te respondemos pronto.</span>
        </div>
      ) : (
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="contact-row">
            <Input
              label="Nombre"
              type="text"
              value={fields.name}
              onChange={set("name")}
              placeholder="Tu nombre"
            />
            <Input
              label="Correo electrónico"
              type="email"
              value={fields.email}
              onChange={set("email")}
              placeholder="tu@correo.com"
            />
          </div>
          <div className="ui-field">
            <label className="ui-field-label">Mensaje</label>
            <textarea
              className="ui-input ui-textarea"
              value={fields.message}
              onChange={set("message")}
              placeholder="¿En qué podemos ayudarte?"
              rows={4}
              maxLength={2000}
            />
          </div>
          {status === "error" && <p className="contact-error">{errorMsg}</p>}
          <div className="contact-actions">
            <Button
              type="submit"
              variant="solid"
              tone="primary"
              loading={status === "sending"}
              iconLeft={<Icon name="login" size={15} />}
            >
              Enviar mensaje
            </Button>
          </div>
        </form>
      )}

      <style jsx>{`
        .contact-card {
          display: grid;
          gap: 16px;
        }
        .contact-form {
          display: grid;
          gap: 14px;
        }
        .contact-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .ui-textarea {
          min-height: 100px;
          padding: 12px 16px;
          resize: vertical;
          font-family: "Manrope", sans-serif;
          font-size: 14px;
          line-height: 1.5;
        }
        .contact-error {
          margin: 0;
          font-size: 12px;
          color: var(--error);
        }
        .contact-actions {
          display: flex;
          justify-content: flex-end;
        }
        .contact-success {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--accent);
          font-size: 14px;
          font-weight: 600;
          padding: 8px 0;
        }
        @media (max-width: 560px) {
          .contact-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Card>
  );
}
