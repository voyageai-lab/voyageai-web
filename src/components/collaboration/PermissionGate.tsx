import type { CollaboratorRole } from '@/types';

interface PermissionGateProps {
  /** The user's current role on this project. */
  role: CollaboratorRole | null;
  /** Minimum role required to render children. */
  minimumRole: CollaboratorRole;
  /** Content to render if the user has sufficient permissions. */
  children: React.ReactNode;
  /** Optional fallback content when permission is denied. */
  fallback?: React.ReactNode;
}

const ROLE_LEVELS: Record<CollaboratorRole, number> = {
  OWNER: 3,
  EDITOR: 2,
  VIEWER: 1,
};

/**
 * Wrapper component that conditionally renders children based on RBAC role.
 * Usage: <PermissionGate role={myRole} minimumRole="EDITOR">...</PermissionGate>
 */
export function PermissionGate({ role, minimumRole, children, fallback }: PermissionGateProps) {
  if (!role) return <>{fallback || null}</>;

  const userLevel = ROLE_LEVELS[role] ?? 0;
  const requiredLevel = ROLE_LEVELS[minimumRole] ?? 0;

  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }

  return <>{fallback || null}</>;
}
