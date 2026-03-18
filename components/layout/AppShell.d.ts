import { ReactNode } from "react";

type ShellUser = {
  email?: string | null;
  role?: string | null;
  roleLabel?: string | null;
  permissions?: {
    canManageUsers?: boolean;
    canEditContent?: boolean;
    assignableRoles?: string[];
  } | null;
};

type AppShellProps = {
  activeKey?: string;
  title?: string;
  kicker?: string;
  description?: string;
  user?: ShellUser | null;
  actions?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  contentClassName?: string;
};

export default function AppShell(props: AppShellProps): JSX.Element;
