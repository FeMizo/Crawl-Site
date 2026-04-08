"use client";

import Button from "../ui/Button";
import Card from "../ui/Card";
import Eyebrow from "../ui/Eyebrow";
import Icon from "../ui/Icon";
import type { RoadmapTaskStatus } from "../../types/roadmap";

export type TaskStatusFilter = RoadmapTaskStatus | "all";

const STATUS_FILTERS: Array<{ value: TaskStatusFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "done", label: "Done" },
  { value: "partial", label: "Partial" },
  { value: "pending", label: "Pending" },
];

type PhaseOption = { value: string; label: string };

type Props = {
  statusFilter: TaskStatusFilter;
  phaseFilter: string;
  queryInput: string;
  phaseOptions: PhaseOption[];
  hasActiveFilters: boolean;
  onStatusChange: (value: TaskStatusFilter) => void;
  onPhaseChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onClear: () => void;
};

export default function RoadmapFilters({
  statusFilter,
  phaseFilter,
  queryInput,
  phaseOptions,
  hasActiveFilters,
  onStatusChange,
  onPhaseChange,
  onQueryChange,
  onClear,
}: Props) {
  return (
    <Card className="filters-card" padding="sm">
      <div className="filters-head">
        <Eyebrow icon={<Icon name="filter" size={12} />}>Filtros</Eyebrow>
        {hasActiveFilters ? (
          <Button type="button" variant="outline" tone="secondary" size="sm" onClick={onClear}>
            Limpiar
          </Button>
        ) : null}
      </div>
      <div className="filters-grid">
        <label className="ui-field">
          <span className="ui-field-label">Busqueda</span>
          <input
            className="ui-input"
            type="search"
            value={queryInput}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar por tarea, nota o archivo..."
          />
        </label>
        <label className="ui-field">
          <span className="ui-field-label">Estado</span>
          <select
            className="ui-select"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as TaskStatusFilter)}
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="ui-field">
          <span className="ui-field-label">Fase</span>
          <select
            className="ui-select"
            value={phaseFilter}
            onChange={(e) => onPhaseChange(e.target.value)}
          >
            {phaseOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <style jsx>{`
        .filters-card {
          border-style: dashed;
        }
        .filters-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }
        .filters-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: minmax(0, 1fr) repeat(2, minmax(180px, 220px));
        }
        @media (max-width: 840px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Card>
  );
}
