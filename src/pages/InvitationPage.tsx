import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';

/**
 * Page for accepting or declining collaboration invitations.
 */
export function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    apiClient
      .post<{ projectId: string }>(`/collaborations/invitations/${token}/accept`)
      .then((res) => {
        setStatus('success');
        setMessage('Invitation accepted! Redirecting...');
        setTimeout(() => navigate(`/chat/${res.projectId}`), 1500);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Failed to accept invitation');
      });
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-4">
        {status === 'loading' && (
          <div className="animate-pulse text-gray-400">Processing invitation...</div>
        )}
        {status === 'success' && (
          <div>
            <div className="text-4xl mb-3">✅</div>
            <p className="text-green-700 font-medium">{message}</p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <div className="text-4xl mb-3">❌</div>
            <p className="text-red-600">{message}</p>
            <button
              onClick={() => navigate('/chat')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Go to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
