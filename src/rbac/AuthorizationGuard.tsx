import type { ReactNode } from "react";
import { useAuth } from "../contexts/useAuth";
import { checkAccess } from "./authorization";
import type { AccessRequirement } from "./types";

interface AuthorizationGuardProps {
  children: ReactNode;
  requirement?: AccessRequirement;
  fallback?: ReactNode;
}

export default function AuthorizationGuard({
  children,
  requirement,
  fallback = null,
}: AuthorizationGuardProps) {
  const { authorization } = useAuth();

  if (!checkAccess(authorization, requirement)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
