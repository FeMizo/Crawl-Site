export type RoadmapTaskStatus = "done" | "partial" | "pending";
export type RoadmapTaskStatusSource = "auto" | "manual";

export interface RoadmapTaskEvidenceDto {
  file: string;
  note?: string;
}

export interface RoadmapTaskDto {
  id: string;
  phaseId: string;
  title: string;
  completed: boolean;
  status: RoadmapTaskStatus;
  statusSource: RoadmapTaskStatusSource;
  evidence: RoadmapTaskEvidenceDto[];
  note: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapPhaseProgressDto {
  completed: number;
  partial: number;
  pending: number;
  total: number;
  percent: number;
}

export interface RoadmapPhaseDto {
  id: string;
  title: string;
  description: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  progress: RoadmapPhaseProgressDto;
  tasks: RoadmapTaskDto[];
}

export interface RoadmapGlobalProgressDto {
  completed: number;
  partial: number;
  pending: number;
  total: number;
  percent: number;
}

export interface RoadmapSourceDto {
  type: "database" | "markdown" | "json" | "embedded" | "unknown";
  location: string;
}

export interface RoadmapDataDto {
  phases: RoadmapPhaseDto[];
  progress: RoadmapGlobalProgressDto;
  source: RoadmapSourceDto;
  evaluatedAt: string;
}
