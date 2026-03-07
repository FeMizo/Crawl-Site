import { ReactNode } from "react";

type StatCardProps = {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "primary" | "secondary" | "danger";
  icon?: ReactNode;
  className?: string;
};

export default function StatCard(props: StatCardProps): JSX.Element;
