import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { shareProject, revokeShare } from '@/store/projectsSlice';
import { useClipboard } from '@/hooks/useClipboard';
import type { Project } from '@/types';

interface ShareDialogProps {
  project: Project;
  onClose: () => void;
}

/**
 * Modal dialog for sharing a project via link.
 * Allows generating / revoking a share link and copying it.
 */
export function ShareDialog({ project, onClose }: ShareDialogProps) {
  const dispatch = useAppDispatch();
  const { copy, copied } = useClipboard();
  const [loading, setLoading] = useState(false);

  const isShared = project.visibility === 'LINK_SHARED' || project.visibility === 'PUBLIC';
  const shareUrl = project.shareToken
    ? `${window.location.origin}/shared/${project.shareToken}`
    : null;

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      await dispatch(shareProject(project.projectId)).unwrap();
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    try {
      await dispatch(revokeShare(project.projectId)).unwrap();
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      copy(shareUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Share Project</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Anyone with the link can view this trip plan (read-only).
        </p>

        {isShared && shareUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 text-sm bg-transparent outline-none text-gray-700 truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <button
              onClick={handleRevoke}
              disabled={loading}
              className="w-full px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
            >
              {loading ? 'Revoking...' : 'Revoke Link'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerateLink}
            disabled={loading}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Share Link'}
          </button>
        )}
      </div>
    </div>
  );
}
