import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppShell from './layout/AppShell';
import Feed from './pages/Feed';
import ProductDetail from './pages/ProductDetail';
import BoutiquePage from './pages/BoutiquePage';
import Souhaits from './pages/Souhaits';
import Messages from './pages/Messages';
import Publish from './pages/Publish';
import MonDjassa from './pages/MonDjassa';
import ProDashboard from './pages/ProDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Pages plein écran (auth) hors du shell ? Non — on garde le shell Djassa partout */}
      <Route element={<AppShell />}>
        <Route path="/" element={<Feed />} />
        <Route path="/article/:id" element={<ProductDetail />} />
        <Route path="/boutique/:slug" element={<BoutiquePage />} />
        <Route path="/souhaits" element={<Souhaits />} />
        <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
        <Route path="/publier" element={<Publish />} />
        <Route path="/moi" element={<RequireAuth><MonDjassa /></RequireAuth>} />
        <Route path="/pro/dashboard" element={<RequireAuth><ProDashboard /></RequireAuth>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
