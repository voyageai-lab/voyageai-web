import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import type { PresenceUser } from '@/types';

interface PresenceAvatarsProps {
  projectId: string;
  maxDisplay?: number;
}

/**
 * Row of circular user avatars showing who is currently online.
 * Sends heartbeats and fetches presence data automatically.
 */
export function PresenceAvatars({ projectId, maxDisplay = 5 }: PresenceAvatarsProps) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!projectId) return;

    const fetchAndHeartbeat = async () => {
      try {
        await apiClient.post(`/projects/${projectId}/presence`);
        const data = await apiClient.get<PresenceUser[]>(`/projects/${projectId}/presence`);
        setUsers(data);
      } catch {
        // Ignore errors (user may not have access yet)
      }
    };

    fetchAndHeartbeat();
    const interval = setInterval(fetchAndHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  if (users.length === 0) return null;

  const visible = users.slice(0, maxDisplay);
  const overflow = users.length - maxDisplay;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((user) => (
        <div
          key={user.userId}
          className="relative"
          title={user.displayName}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-7 h-7 rounded-full border-2 border-white"
            />
          ) : (
            <div className="w-7 h-7 rounded-full border-2 border-white bg-blue-600 text-white flex items-center justify-center text-xs font-medium">
              {user.displayName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
        </div>
      ))}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-medium">
          +{overflow}
        </div>
      )}
    </div>
  );
}
