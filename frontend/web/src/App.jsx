import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppShell from './layout/AppShell';
import ParticulierLayout from './layout/ParticulierLayout';
import ProLayout from './layout/ProLayout';
import { RequireAuth, OnboardingGuard, ParticulierRoute, ProRoute } from './components/RouteGuards';
import Feed from './pages/Feed';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import BoutiquePage from './pages/BoutiquePage';
import Souhaits from './pages/Souhaits';
import Messages from './pages/Messages';
import Publish from './pages/Publish';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import ChoisirOffre from './pages/ChoisirOffre';
import DashboardParticulier from './pages/particulier/DashboardParticulier';
import DashboardPro from './pages/pro/DashboardPro';
import MaBoutique from './pages/pro/MaBoutique';
import TrocsPro from './pages/pro/TrocsPro';
import AchatsPro from './pages/pro/AchatsPro';
import FacturesPro from './pages/pro/FacturesPro';

/** Redirection de compatibilité pour les anciens liens /moi et /pro/dashboard. */
function DashboardRedirect() {
  const { user, needsPlan, isAdmin } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (needsPlan) return <Navigate to="/choisir-offre" replace />;
  if (isAdmin || user.role === 'vendeur_pro') return <Navigate to="/dashboard-pro" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Anciennes URLs — conservées pour ne pas casser les favoris */}
      <Route path="/pro/dashboard" element={<Navigate to="/dashboard-pro" replace />} />

      {/* --- Espace de séparation des offres (plein écran, hors shell) --- */}
      <Route
        path="/choisir-offre"
        element={<RequireAuth><ChoisirOffre /></RequireAuth>}
      />

      {/* --- Dashboards étanches, chacun avec son propre layout --- */}
      <Route
        path="/dashboard"
        element={<ParticulierRoute><ParticulierLayout /></ParticulierRoute>}
      >
        <Route index element={<DashboardParticulier />} />
      </Route>

      <Route
        path="/dashboard-pro"
        element={<ProRoute><ProLayout /></ProRoute>}
      >
        <Route index element={<DashboardPro />} />
        <Route path="ma-boutique" element={<MaBoutique />} />
        <Route path="ma-boutique/infos" element={<MaBoutique />} />
        <Route path="trocs" element={<TrocsPro />} />
        <Route path="achats" element={<AchatsPro />} />
        <Route path="factures" element={<FacturesPro />} />
      </Route>

      {/* --- Marketplace publique (AppShell) --- */}
      <Route element={<AppShell />}>
        <Route path="/" element={<Feed />} />
        <Route path="/article/:id" element={<ProductDetail />} />
        <Route path="/boutique/:slug" element={<BoutiquePage />} />
        <Route path="/souhaits" element={<Souhaits />} />
        {/* Panier consultable sans compte — la connexion est demandée au paiement */}
        <Route path="/panier" element={<Cart />} />
        <Route
          path="/messages"
          element={<RequireAuth><OnboardingGuard><Messages /></OnboardingGuard></RequireAuth>}
        />
        <Route
          path="/publier"
          element={<RequireAuth><OnboardingGuard><Publish /></OnboardingGuard></RequireAuth>}
        />
        <Route path="/moi" element={<RequireAuth><DashboardRedirect /></RequireAuth>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
