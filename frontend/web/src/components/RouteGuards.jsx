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
  const { isAuthenticated, user, authResolved } = useAuth();
  const location = useLocation();

  // Attendre la résolution avant toute décision (évite redirections et requêtes prématurées).
  if (!authResolved) return <AuthGateLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  if (!user) return <AuthGateLoader />;

  return children ?? <Outlet />;
}

/** Onboarding obligatoire : aucune offre choisie → /choisir-offre. */
export function OnboardingGuard({ children }) {
  const { user, needsPlan, isAdmin } = useAuth();

  // W1 : l'administrateur n'est jamais astreint au choix d'offre.
  if (user && !isAdmin && needsPlan) {
    return <Navigate to="/choisir-offre" replace />;
  }

  return children ?? <Outlet />;
}

/**
 * Espace Particulier — hermétique.
 * Un vendeur Pro qui tente /dashboard est renvoyé vers /dashboard-pro.
 */
export function ParticulierRoute({ children }) {
  const { isAuthenticated, user, needsPlan, isAdmin, authResolved } = useAuth();
  const location = useLocation();

  if (!authResolved) return <AuthGateLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  if (!user) return <AuthGateLoader />;
  if (needsPlan && !isAdmin) return <Navigate to="/choisir-offre" replace />;
  if (user.role === 'vendeur_pro') return <Navigate to="/dashboard-pro" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role !== 'particulier') return <Navigate to="/" replace />;

  return children ?? <Outlet />;
}

/**
 * Espace Vendeur Pro — hermétique.
 * Un particulier qui tente /dashboard-pro est renvoyé vers /dashboard.
 * L'administrateur conserve un accès de supervision.
 */
export function ProRoute({ children }) {
  const { isAuthenticated, user, needsPlan, isAdmin, hasActiveProPlan, authResolved } = useAuth();
  const location = useLocation();

  if (!authResolved) return <AuthGateLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  if (!user) return <AuthGateLoader />;
  if (needsPlan && !isAdmin) return <Navigate to="/choisir-offre" replace />;
  // W2 : un Pro expiré est renvoyé vers le renouvellement, pas vers le dashboard Pro.
  if (user.role === 'vendeur_pro' && !hasActiveProPlan) {
    return <Navigate to="/choisir-offre" state={{ renew: true }} replace />;
  }
  if (user.role === 'particulier') return <Navigate to="/dashboard" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role !== 'vendeur_pro') return <Navigate to="/" replace />;

  return children ?? <Outlet />;
}

/**
 * Espace Administration — hermétique, réservé au rôle admin.
 */
export function AdminRoute({ children }) {
  const { isAuthenticated, user, authResolved } = useAuth();
  const location = useLocation();

  if (!authResolved) return <AuthGateLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  if (!user) return <AuthGateLoader />;
  if (user.role !== 'admin') {
    if (user.role === 'vendeur_pro') return <Navigate to="/dashboard-pro" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children ?? <Outlet />;
}
