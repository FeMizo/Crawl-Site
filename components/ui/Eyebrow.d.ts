import type { ReactNode } from "react";

type EyebrowProps = {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

declare function Eyebrow(props: EyebrowProps): JSX.Element;

export default Eyebrow;
