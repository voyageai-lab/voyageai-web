import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProjects, deleteProject, setActiveProject } from '@/store/projectsSlice';
import { resetChat, clearChatForProject, loadConversationHistory, setCurrentProjectId } from '@/store/chatSlice';
import { logout } from '@/store/authSlice';

export function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { projects, activeProjectId, loading } = useAppSelector((s) => s.projects);
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleNewChat = () => {
    dispatch(setActiveProject(null));
    dispatch(resetChat());
  };

  const handleSelectProject = (projectId: string) => {
    if (projectId === activeProjectId) return; // Already selected
    // 1. Clear old chat state first
    dispatch(clearChatForProject());
    // 2. Set active project in both slices
    dispatch(setActiveProject(projectId));
    dispatch(setCurrentProjectId(projectId));
    // 3. Load conversation history for the selected project
    dispatch(loadConversationHistory(projectId));
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      dispatch(deleteProject(projectId));
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="w-72 bg-gray-900 text-gray-100 flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-600 hover:bg-gray-700 transition text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {loading && projects.length === 0 && (
          <div className="px-3 py-4 text-sm text-gray-400">Loading...</div>
        )}
        {projects.map((project) => (
          <button
            key={project.projectId}
            onClick={() => handleSelectProject(project.projectId)}
            className={`w-full group flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition ${
              activeProjectId === project.projectId
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="truncate flex-1">{project.title}</span>
            <button
              onClick={(e) => handleDeleteProject(e, project.projectId)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
              title="Delete"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </button>
        ))}
        {!loading && projects.length === 0 && (
          <div className="px-3 py-8 text-center">
            <p className="text-sm text-gray-400">No conversations yet</p>
            <p className="text-xs text-gray-500 mt-1">Start a new chat to plan your trip</p>
          </div>
        )}
      </div>

      {/* User Info + Logout */}
      <div className="border-t border-gray-700 p-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium shrink-0">
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.displayName || user?.email}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-white transition rounded"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
