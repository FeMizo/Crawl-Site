export interface RoadmapTaskDto {
  id: string;
  phaseId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapPhaseProgressDto {
  completed: number;
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
  total: number;
  percent: number;
}

export interface RoadmapDataDto {
  phases: RoadmapPhaseDto[];
  progress: RoadmapGlobalProgressDto;
}
