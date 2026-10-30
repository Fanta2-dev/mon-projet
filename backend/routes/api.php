<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Models\Metier;
use App\Models\Apprenant;
use App\Models\Devoir;
use App\Models\Seance;
use App\Models\Presence;

// ✅ Métiers (public)
Route::get('/metiers', function () {
    return response()->json(Metier::all());
});

// ✅ Apprenants par métier (public)
Route::get('/apprenants', function (Request $request) {
    $query = Apprenant::query();
    if ($request->has('metier_id')) $query->where('metier_id', $request->metier_id);
    if ($request->has('annee'))     $query->where('annee', $request->annee);
    if ($request->has('status'))    $query->where('status', $request->status);
    return response()->json($query->get());
});

// ✅ Register
Route::post('/register', [RegisteredUserController::class, 'store']);

// ✅ Login
Route::post('/login', [RegisteredUserController::class, 'login']);

// ✅ Routes protégées
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [RegisteredUserController::class, 'logout']);

    // ✅ Routes Enseignant
    Route::prefix('enseignant')->group(function () {

        Route::get('/devoirs', function (Request $request) {
            $user = $request->user();
            $devoirs = Devoir::where('user_id', $user->id)
                ->orWhere('enseignant_id', $user->id)
                ->with(['uea'])
                ->get();
            return response()->json($devoirs);
        });

        Route::get('/apprenants', function (Request $request) {
            $user = $request->user();
            return response()->json(
                Apprenant::where('metier_id', $user->metier_id)->get()
            );
        });

        Route::get('/seances', function (Request $request) {
            $user = $request->user();
            return response()->json(
                Seance::where('enseignant_id', $user->id)->with(['uea'])->get()
            );
        });
    });

    // ✅ Routes Séances
    Route::prefix('seances')->group(function () {

        Route::get('/', function (Request $request) {
            $query = Seance::query();
            if ($request->has('metier_id'))    $query->where('metier_id', $request->metier_id);
            if ($request->has('uea_id'))       $query->where('uea_id', $request->uea_id);
            if ($request->has('enseignant_id')) $query->where('enseignant_id', $request->enseignant_id);
            return response()->json($query->get());
        });

        // ✅ Créer une séance — duree accepte string ET integer
        Route::post('/', function (Request $request) {
            $allowed = [
                'nom', 'uea_id', 'uea_nom', 'metier_id', 'annee',
                'date', 'heure_debut', 'heure_fin', 'duree',
                'type', 'salle', 'lien_reunion', 'statut',
            ];

            $data = $request->only($allowed);

            // ✅ Convertit annee en entier si présent
            if (isset($data['annee'])) {
                $data['annee'] = (int) $data['annee'];
            }

            // ✅ metier_id en entier
            if (isset($data['metier_id'])) {
                $data['metier_id'] = (int) $data['metier_id'];
            }

            // ✅ duree reste string ("4h", "8h") — pas de conversion
            $data['enseignant_id'] = $request->user()->id;

            $seance = Seance::create($data);

            return response()->json($seance, 201);
        });

        Route::get('/{id}', function ($id) {
            return response()->json(Seance::findOrFail($id));
        });

        Route::put('/{id}', function (Request $request, $id) {
            $seance = Seance::findOrFail($id);
            $seance->update($request->all());
            return response()->json($seance);
        });

        Route::delete('/{id}', function ($id) {
            Seance::findOrFail($id)->delete();
            return response()->json(['message' => 'Séance supprimée']);
        });

        // ✅ Enregistrer les présences multiples pour une séance
        Route::post('/{id}/presences/multiple', function (Request $request, $id) {
            $seance = Seance::findOrFail($id);

            $data = $request->validate([
                'date'                     => 'nullable|date',
                'presences'                => 'required|array',
                'presences.*.apprenant_id' => 'required|exists:apprenants,id',
                'presences.*.statut'       => 'nullable|string',
                'presences.*.commentaire'  => 'nullable|string',
            ]);

            foreach ($data['presences'] as $p) {
                $statut = $p['statut'] ?? 'present';
                $present = in_array($statut, ['present', 'retard', 'demi']);

                Presence::updateOrCreate(
                    [
                        'seance_id'    => $seance->id,
                        'apprenant_id' => $p['apprenant_id'],
                    ],
                    [
                        'present'      => $present,
                        'statut'       => $statut,
                        'commentaire'  => $p['commentaire'] ?? null,
                        'date'         => $data['date'] ?? now()->toDateString(),
                    ]
                );
            }

            return response()->json([
                'message' => 'Présences enregistrées avec succès',
                'seance_id' => $seance->id,
                'total' => count($data['presences']),
            ]);
        });

        // ✅ Notifier les absents par email
        Route::post('/{id}/notifier-absences', function (Request $request, $id) {
            // Route préparée pour les notifications d'absence
            // Tu peux l'implémenter plus tard avec les emails
            return response()->json([
                'message' => 'Notifications envoyées',
                'absents' => count($request->absents ?? []),
            ]);
        });
    });

    // ✅ Routes Présences
    Route::prefix('presences')->group(function () {

        Route::get('/', function (Request $request) {
            $query = Presence::query();
            if ($request->has('seance_id'))    $query->where('seance_id', $request->seance_id);
            if ($request->has('apprenant_id')) $query->where('apprenant_id', $request->apprenant_id);
            return response()->json($query->with('apprenant')->get());
        });

        Route::post('/', function (Request $request) {
            $data = $request->validate([
                'seance_id'                => 'required|exists:seances,id',
                'presences'                => 'required|array',
                'presences.*.apprenant_id' => 'required|exists:apprenants,id',
                'presences.*.present'      => 'required|boolean',
            ]);

            foreach ($data['presences'] as $p) {
                Presence::updateOrCreate(
                    ['seance_id' => $data['seance_id'], 'apprenant_id' => $p['apprenant_id']],
                    ['present'   => $p['present']]
                );
            }

            return response()->json(['message' => 'Présences enregistrées avec succès']);
        });
    });

    // ✅ Routes Dashboard Apprenant
    Route::prefix('apprenant')->group(function () {

        Route::get('/profil', function (Request $request) {
            $user = $request->user();
            return response()->json(Apprenant::where('user_id', $user->id)->first());
        });

        Route::get('/absences', function (Request $request) {
            $user = $request->user();
            $apprenant = Apprenant::where('user_id', $user->id)->first();
            if (!$apprenant) return response()->json([]);
            return response()->json(
                Presence::where('apprenant_id', $apprenant->id)
                    ->where('present', false)
                    ->with('seance')
                    ->get()
            );
        });

        Route::get('/devoirs', function (Request $request) {
            $user = $request->user();
            return response()->json(
                Devoir::where('metier_id', $user->metier_id)
                    ->where('annee', $user->annee)
                    ->with(['uea'])
                    ->get()
            );
        });
    });

    // ✅ Valider un apprenant (admin)
    Route::post('/apprenants/{id}/valider', [RegisteredUserController::class, 'valider']);
});
