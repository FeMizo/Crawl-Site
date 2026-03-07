import { ReactNode } from "react";

type CardProps = {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  padding?: "sm" | "md";
  children?: ReactNode;
};

export default function Card(props: CardProps): JSX.Element;
