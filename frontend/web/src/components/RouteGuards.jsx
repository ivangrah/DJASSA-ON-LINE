import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui';

/** Chargeur plein écran pendant la resynchronisation du profil. */
function AuthGateLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-djassa-cloud">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={30} />
        <p className="font-spacegrotesk text-xs font-bold uppercase tracking-wider text-djassa-black/60">
          Ouverture de votre espace…
        </p>
      </div>
    </div>
  );
}

/** Authentification de base — jeton Sanctum requis. */
export function RequireAuth({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  if (!user) return <AuthGateLoader />;

  return children ?? <Outlet />;
}

/** Onboarding obligatoire : aucune offre choisie → /choisir-offre. */
export function OnboardingGuard({ children }) {
  const { user } = useAuth();

  if (user && user.plan_abonnement === null) {
    return <Navigate to="/choisir-offre" replace />;
  }

  return children ?? <Outlet />;
}

/**
 * Espace Particulier — hermétique.
 * Un vendeur Pro qui tente /dashboard est renvoyé vers /dashboard-pro.
 */
export function ParticulierRoute({ children }) {
  const { isAuthenticated, user, needsPlan } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  if (!user) return <AuthGateLoader />;
  if (needsPlan) return <Navigate to="/choisir-offre" replace />;
  if (user.role === 'vendeur_pro') return <Navigate to="/dashboard-pro" replace />;
  if (user.role === 'admin') return <Navigate to="/dashboard-pro" replace />;
  if (user.role !== 'particulier') return <Navigate to="/" replace />;

  return children ?? <Outlet />;
}

/**
 * Espace Vendeur Pro — hermétique.
 * Un particulier qui tente /dashboard-pro est renvoyé vers /dashboard.
 * L'administrateur conserve un accès de supervision.
 */
export function ProRoute({ children }) {
  const { isAuthenticated, user, needsPlan } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  if (!user) return <AuthGateLoader />;
  if (needsPlan) return <Navigate to="/choisir-offre" replace />;
  if (user.role === 'particulier') return <Navigate to="/dashboard" replace />;
  if (user.role !== 'vendeur_pro' && user.role !== 'admin') return <Navigate to="/" replace />;

  return children ?? <Outlet />;
}
