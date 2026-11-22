<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuditService;
use App\Services\MaintenanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/** Super Dashboard Admin — utilisateurs, audit, maintenance, profil (base auth). */
class AdminController extends Controller
{
    private const USER_COLUMNS = ['id', 'nom', 'email', 'telephone', 'role', 'statut',
        'plan_abonnement', 'abonnement_actif_jusqu_au', 'verifie', 'created_at'];

    public function __construct(
        private readonly AuditService $audit,
        private readonly MaintenanceService $maintenance,
    ) {}

    /** Liste paginée des utilisateurs (règle 14 + 20 : select explicite). */
    public function users(Request $request): JsonResponse
    {
        $q = User::query()->select(self::USER_COLUMNS);
        if ($v = $request->string('q')->toString()) {
            $q->where(fn ($x) => $x->where('nom', 'ilike', "%$v%")->orWhere('email', 'ilike', "%$v%"));
        }
        if ($v = $request->string('role')->toString()) $q->where('role', $v);
        if ($v = $request->string('statut')->toString()) $q->where('statut', $v);
        $page = $q->latest()->paginate(20);

        return response()->json(['data' => $page->items(), 'meta' => [
            'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total(),
        ]]);
    }

    public function showUser(string $id): JsonResponse
    {
        $user = User::select(self::USER_COLUMNS)->findOrFail($id);
        return response()->json(['data' => $user]);
    }

    public function storeUser(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'in:particulier,vendeur_pro,admin'],
            'password' => ['required', 'string', 'min:8'],
        ]);
        $user = User::create($data + ['statut' => 'actif', 'verifie' => true]);
        $this->audit->record('admin.user_created', $this->adminId($request), $request, ['user_id' => $user->id]);
        return response()->json(['data' => $user], 201);
    }

    public function updateUser(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $data = $request->validate([
            'nom' => ['sometimes', 'string', 'max:150'],
            'telephone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'role' => ['sometimes', 'in:particulier,vendeur_pro,admin'],
            'statut' => ['sometimes', 'in:actif,suspendu'],
        ]);
        $user->update($data);
        $this->audit->record('admin.user_updated', $this->adminId($request), $request, ['user_id' => $id, 'changes' => array_keys($data)]);
        return response()->json(['data' => $user->select(self::USER_COLUMNS)->find($id)]);
    }

    /** Suppression sécurisée : impossible de supprimer un admin. */
    public function destroyUser(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        abort_if($user->role === 'admin', 422, 'Un compte administrateur ne peut pas être supprimé.');
        $user->tokens()->delete();
        $user->delete();
        $this->audit->record('admin.user_deleted', $this->adminId($request), $request, ['user_id' => $id]);
        return response()->json(['deleted' => true]);
    }

    /** Réinitialisation d'urgence : mot de passe temporaire bcrypt (règle : hachage fort). */
    public function resetPassword(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $temporary = Str::password(12);
        $user->update(['password' => Hash::make($temporary)]);
        $user->tokens()->delete();
        $this->audit->record('admin.password_reset', $this->adminId($request), $request, ['user_id' => $id]);
        return response()->json([
            'temporary_password' => $temporary,
            'message' => 'Mot de passe réinitialisé. Transmettez-le au utilisateur par canal sécurisé.',
        ]);
    }

    /** Profil de l'admin connecté. */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user() ?? User::where('email', 'admin@djassa.ci')->firstOrFail();
        return response()->json(['data' => $user->select(self::USER_COLUMNS)->find($user->id)]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user() ?? User::where('email', 'admin@djassa.ci')->firstOrFail();
        $data = $request->validate([
            'nom' => ['sometimes', 'string', 'max:150'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'telephone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'password' => ['sometimes', 'string', 'min:8'],
        ]);
        if (isset($data['password'])) $data['password'] = Hash::make($data['password']);
        $user->update($data);
        $this->audit->record('admin.profile_updated', $user->id, $request, ['changes' => array_keys($data)]);
        return response()->json(['data' => $user->select(self::USER_COLUMNS)->find($user->id)]);
    }

    /** Bascule Mode Maintenance (Redis) + audit. */
    public function maintenance(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'message' => ['required_if:enabled,true', 'nullable', 'string', 'max:500'],
        ]);
        $state = $data['enabled']
            ? $this->maintenance->enable((string) ($data['message'] ?? ''))
            : $this->maintenance->disable();
        $this->audit->record('admin.maintenance_toggle', $this->adminId($request), $request, ['enabled' => $data['enabled']]);
        return response()->json(['data' => $state, 'message' => 'Mode maintenance mis à jour.']);
    }

    public function maintenanceState(): JsonResponse
    {
        return response()->json(['data' => $this->maintenance->state()]);
    }

    /** Journal d'audit paginé. */
    public function audit(Request $request): JsonResponse
    {
        $q = AuditLog::query()->select(['id', 'user_id', 'action', 'ip', 'meta', 'created_at']);
        if ($v = $request->string('action')->toString()) $q->where('action', $v);
        if ($v = $request->string('user_id')->toString()) $q->where('user_id', $v);
        $page = $q->latest()->paginate(20);
        return response()->json(['data' => $page->items(), 'meta' => [
            'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total(),
        ]]);
    }

    private function adminId(Request $request): ?string
    {
        return (string) $request->header('X-User-Id', '') ?: (string) ($request->user()?->id ?? '');
    }
}
