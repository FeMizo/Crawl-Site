import { ReactNode } from "react";

type ButtonProps = {
  href?: string | { pathname: string; query?: Record<string, string> };
  variant?: "outline" | "solid";
  tone?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
};

export default function Button(props: ButtonProps): JSX.Element;
