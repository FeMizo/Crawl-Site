"use client";

import { FormEvent, useEffect, useState } from "react";
import Button from "../ui/Button";
import Icon from "../ui/Icon";

type AddTaskFormProps = {
  phaseId: string;
  canEdit: boolean;
  onSubmit: (phaseId: string, title: string) => Promise<void>;
};

export default function AddTaskForm({ phaseId, canEdit, onSubmit }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isVertical, setIsVertical] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 560px)");
    const sync = () => setIsVertical(media.matches);
    sync();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }

    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit || submitting) return;

    const normalized = title.trim();
    if (!normalized) return;

    setSubmitting(true);
    setError("");

    try {
      await onSubmit(phaseId, normalized);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la tarea");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="add-task-form" onSubmit={handleSubmit}>
      <input
        className="ui-input add-task-input"
        type="text"
        placeholder={canEdit ? "Nueva tarea..." : "Solo lectura"}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={!canEdit || submitting}
      />
      <Button
        type="submit"
        variant="solid"
        tone="primary"
        size={isVertical ? "sm" : "md"}
        loading={submitting}
        disabled={!canEdit}
        iconLeft={<Icon name="plus" size={14} />}
      >
        Agregar
      </Button>
      {error ? <p className="add-task-error">{error}</p> : null}

      <style jsx>{`
        .add-task-form {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
          align-items: start;
          min-width: 0;
        }
        .add-task-input {
          min-height: 40px;
        }
        .add-task-form :global(.ui-btn[type="submit"]) {
          margin-top: 0;
          align-self: start;
        }
        .add-task-error {
          grid-column: 1 / -1;
          margin: 0;
          font-size: 12px;
          color: var(--error);
        }
        @media (max-width: 560px) {
          .add-task-form {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </form>
  );
}
