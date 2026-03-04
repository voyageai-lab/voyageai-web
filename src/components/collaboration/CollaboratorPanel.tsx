import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import type { Collaborator } from '@/types';
import { InviteDialog } from './InviteDialog';

interface CollaboratorPanelProps {
  projectId: string;
  onClose: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  EDITOR: 'bg-blue-100 text-blue-700',
  VIEWER: 'bg-gray-100 text-gray-600',
};

/**
 * Slide-out panel showing the collaborator list with role badges.
 * Owners can invite new collaborators and remove existing ones.
 */
export function CollaboratorPanel({ projectId, onClose }: CollaboratorPanelProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    apiClient
      .get<Collaborator[]>(`/projects/${projectId}/collaborators`)
      .then(setCollaborators)
      .catch(() => {})
      .finally(() => setLoading(false));

    apiClient
      .get<{ role: string }>(`/projects/${projectId}/role`)
      .then((data) => setIsOwner(data.role === 'OWNER'))
      .catch(() => {});
  }, [projectId]);

  const handleRemove = async (userId: number) => {
    if (!confirm('Remove this collaborator?')) return;
    try {
      await apiClient.delete(`/projects/${projectId}/collaborators/${userId}`);
      setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
    } catch {
      // ignore
    }
  };

  const handleInvited = (collab: Collaborator) => {
    setCollaborators((prev) => [...prev, collab]);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">Collaborators</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Invite button */}
        {isOwner && (
          <div className="p-4 border-b">
            <button
              onClick={() => setShowInvite(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Invite
            </button>
          </div>
        )}

        {/* Collaborator list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-sm text-gray-400 animate-pulse">Loading...</div>
          ) : collaborators.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-8">
              No collaborators yet
            </div>
          ) : (
            collaborators.map((collab) => (
              <div
                key={collab.userId}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
              >
                {collab.avatarUrl ? (
                  <img
                    src={collab.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-medium">
                    {collab.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {collab.displayName || collab.email}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        ROLE_COLORS[collab.role] || ROLE_COLORS.VIEWER
                      }`}
                    >
                      {collab.role}
                    </span>
                    {collab.acceptedAt && (
                      <span className="text-xs text-green-600">Active</span>
                    )}
                  </div>
                </div>
                {isOwner && collab.role !== 'OWNER' && (
                  <button
                    onClick={() => handleRemove(collab.userId)}
                    className="p-1 text-gray-300 hover:text-red-500 transition"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showInvite && (
        <InviteDialog
          projectId={projectId}
          onInvited={handleInvited}
          onClose={() => setShowInvite(false)}
        />
      )}
    </>
  );
}
