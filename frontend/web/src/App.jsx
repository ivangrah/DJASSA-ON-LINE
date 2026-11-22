import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DjassaPageLoader from './components/DjassaPageLoader.jsx';
import { RouteError } from './components/ErrorPages.jsx';
import TopProgressBar from './components/TopProgressBar.jsx';
import { useAuth } from './context/AuthContext';
import AppShell from './layout/AppShell';
import ParticulierLayout from './layout/ParticulierLayout';
import ProLayout from './layout/ProLayout';
import { RequireAuth, OnboardingGuard, ParticulierRoute, ProRoute, AdminRoute } from './components/RouteGuards';

const Feed = lazy(() => import('./pages/Feed'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const BoutiquePage = lazy(() => import('./pages/BoutiquePage'));
const Souhaits = lazy(() => import('./pages/Souhaits'));
const Messages = lazy(() => import('./pages/Messages'));
const Publish = lazy(() => import('./pages/Publish'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ChoisirOffre = lazy(() => import('./pages/ChoisirOffre'));
const DashboardParticulier = lazy(() => import('./pages/particulier/DashboardParticulier'));
const DashboardPro = lazy(() => import('./pages/pro/DashboardPro'));
const MaBoutique = lazy(() => import('./pages/pro/MaBoutique'));
const TrocsPro = lazy(() => import('./pages/pro/TrocsPro'));
const AchatsPro = lazy(() => import('./pages/pro/AchatsPro'));
const FacturesPro = lazy(() => import('./pages/pro/FacturesPro'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminLitiges = lazy(() => import('./pages/admin/AdminLitiges'));
const AdminBoutiques = lazy(() => import('./pages/admin/AdminBoutiques'));
const AdminUtilisateurs = lazy(() => import('./pages/admin/AdminUtilisateurs'));
const AdminSecurite = lazy(() => import('./pages/admin/AdminSecurite'));
const Maintenance = lazy(() => import('./pages/Maintenance'));

/** Redirection de compatibilité pour les anciens liens /moi et /pro/dashboard. */
function PageTransition({ children }) {
  const { pathname } = useLocation();
  return <div key={pathname} className="route-enter">{children}</div>;
}

function DashboardRedirect() {
  const { user, needsPlan, isAdmin } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (needsPlan) return <Navigate to="/choisir-offre" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (user.role === 'vendeur_pro') return <Navigate to="/dashboard-pro" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <>
    <TopProgressBar />
    <Suspense fallback={<DjassaPageLoader />}>
    <Routes errorElement={<RouteError />}>
      {/* Anciennes URLs — conservées pour ne pas casser les favoris */}
      <Route path="/pro/dashboard" element={<Navigate to="/dashboard-pro" replace />} />

      {/* --- Espace de séparation des offres (plein écran, hors shell) --- */}
      <Route
        path="/choisir-offre"
        element={<RequireAuth><PageTransition><ChoisirOffre /></PageTransition></RequireAuth>}
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

      {/* --- Espace Administration (admin uniquement) --- */}
      <Route
        path="/admin"
        element={<AdminRoute><ProLayout /></AdminRoute>}
      >
        <Route index element={<AdminDashboard />} />
        <Route path="litiges" element={<AdminLitiges />} />
        <Route path="boutiques" element={<AdminBoutiques />} />
        <Route path="utilisateurs" element={<AdminUtilisateurs />} />
        <Route path="securite" element={<AdminSecurite />} />
      </Route>

      {/* --- Page Maintenance (hors shell) --- */}
      <Route path="/maintenance" element={<PageTransition><Maintenance /></PageTransition>} />

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
    </Suspense>
    </>
  );
}
