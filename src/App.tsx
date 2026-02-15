import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { Navbar } from '@/components/layout/Navbar';
import { HomePage } from '@/pages/HomePage';
import { PlanningPage } from '@/pages/PlanningPage';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/planning" element={<PlanningPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </Provider>
  );
}
