<?php

namespace App\Http\Controllers;

use App\Models\Rapport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RapportController extends Controller
{
    /**
     * 📤 Envoyer un rapport au Chef de Département
     */
    public function envoyerAuChefDepartement(Request $request)
    {
        try {
            Log::info('=== ENVOI RAPPORT AU CHEF DÉPARTEMENT ===');
            Log::info('User:', ['id' => Auth::id(), 'name' => Auth::user()->name ?? 'N/A']);
            Log::info('Données reçues:', $request->all());

            $validated = $request->validate([
                'metier' => 'required|string',
                'code_metier' => 'required|string',
                'coordinateur' => 'nullable|string',
                'date_soumission' => 'nullable|string',
                'periode' => 'required|string',
                'statistiques' => 'required|array',
                'justificatifs_traites' => 'required|integer',
                'filtres_appliques' => 'nullable|array'
            ]);

            // Créer le rapport avec votre structure de table
            $rapport = Rapport::create([
                'user_id' => Auth::id(),
                'metier' => $validated['metier'],
                'code_metier' => $validated['code_metier'],
                'periode' => $validated['periode'],
                'statistiques' => array_merge($validated['statistiques'], [
                    'coordinateur' => $validated['coordinateur'] ?? Auth::user()->name,
                    'filtres_appliques' => $validated['filtres_appliques'] ?? []
                ]),
                'justificatifs_traites' => $validated['justificatifs_traites'],
                'statut' => 'en_attente', // ✅ Correspond à votre enum
                'date_soumission' => now()
            ]);

            Log::info('✅ Rapport créé avec succès:', ['id' => $rapport->id]);

            return response()->json([
                'success' => true,
                'message' => 'Rapport envoyé avec succès au Chef de Département',
                'data' => [
                    'id' => $rapport->id,
                    'statut' => $rapport->statut
                ]
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('❌ Erreur validation:', $e->errors());
            return response()->json([
                'success' => false,
                'error' => 'Erreur de validation',
                'details' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('❌ Erreur envoi rapport:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'envoi du rapport',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 📥 Récupérer tous les rapports pour le Chef de Département
     */
    public function getRapportsPourChefDepartement(Request $request)
    {
        try {
            Log::info('=== RÉCUPÉRATION RAPPORTS CHEF DÉPARTEMENT ===');

            $rapports = Rapport::with('user:id,name,email')
                ->whereIn('statut', ['en_attente', 'valide', 'rejete']) // ✅ Tous les rapports soumis
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($rapport) {
                    $statistiques = $rapport->statistiques;

                    return [
                        'id' => $rapport->id,
                        'metier' => $rapport->metier,
                        'code_metier' => $rapport->code_metier,
                        'coordinateur' => $statistiques['coordinateur'] ?? $rapport->user->name ?? 'N/A',
                        'date_soumission' => $rapport->date_soumission ?
                            $rapport->date_soumission->format('d/m/Y') :
                            $rapport->created_at->format('d/m/Y'),
                        'periode' => $rapport->periode,
                        'statistiques' => $statistiques,
                        'justificatifs_traites' => $rapport->justificatifs_traites,
                        'statut' => $this->mapStatut($rapport->statut) // ✅ Conversion du statut
                    ];
                });

            Log::info('✅ Rapports récupérés:', ['count' => $rapports->count()]);

            return response()->json([
                'success' => true,
                'data' => $rapports
            ], 200);

        } catch (\Exception $e) {
            Log::error('❌ Erreur récupération rapports:', [
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la récupération des rapports',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Valider un rapport
     */
    public function validerRapport($id)
    {
        try {
            Log::info('=== VALIDATION RAPPORT ===', ['id' => $id]);

            $rapport = Rapport::findOrFail($id);
            $rapport->update([
                'statut' => 'valide',
                'date_validation' => now()
            ]);

            Log::info('✅ Rapport validé');

            return response()->json([
                'success' => true,
                'message' => 'Rapport validé avec succès'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Rapport introuvable'
            ], 404);

        } catch (\Exception $e) {
            Log::error('❌ Erreur validation rapport:', [
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la validation'
            ], 500);
        }
    }

    /**
     * ❌ Rejeter un rapport
     */
    public function rejeterRapport($id)
    {
        try {
            Log::info('=== REJET RAPPORT ===', ['id' => $id]);

            $rapport = Rapport::findOrFail($id);
            $rapport->update([
                'statut' => 'rejete',
                'date_rejet' => now()
            ]);

            Log::info('✅ Rapport rejeté');

            return response()->json([
                'success' => true,
                'message' => 'Rapport rejeté'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Rapport introuvable'
            ], 404);

        } catch (\Exception $e) {
            Log::error('❌ Erreur rejet rapport:', [
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erreur lors du rejet'
            ], 500);
        }
    }

    /**
     * ✅✅ Valider tous les rapports en attente
     */
    public function validerTousRapports()
    {
        try {
            Log::info('=== VALIDATION TOUS RAPPORTS ===');

            $updated = Rapport::where('statut', 'en_attente')
                ->update([
                    'statut' => 'valide',
                    'date_validation' => now()
                ]);

            Log::info('✅ Rapports validés:', ['count' => $updated]);

            return response()->json([
                'success' => true,
                'message' => "$updated rapport(s) validé(s) avec succès"
            ], 200);

        } catch (\Exception $e) {
            Log::error('❌ Erreur validation multiple:', [
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la validation multiple'
            ], 500);
        }
    }

    /**
     * 📨 Envoyer le rapport consolidé à l'administration
     */
    public function envoyerAAdministration(Request $request)
    {
        try {
            Log::info('=== ENVOI À L\'ADMINISTRATION ===');
            Log::info('Données:', $request->all());

            $validated = $request->validate([
                'date_envoi' => 'required|string',
                'rapports_inclus' => 'required|array',
                'statistiques_consolidees' => 'required|array'
            ]);

            // Marquer les rapports comme envoyés à l'administration
            $rapportIds = collect($validated['rapports_inclus'])->pluck('id')->filter();

            if ($rapportIds->isNotEmpty()) {
                Rapport::whereIn('id', $rapportIds)
                    ->where('statut', 'valide')
                    ->update([
                        'envoye_administration' => true,
                        'date_envoi_administration' => now()
                    ]);
            }

            Log::info('✅ Rapport consolidé envoyé à administration', [
                'nb_rapports' => count($validated['rapports_inclus'])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rapport consolidé envoyé à l\'administration avec succès',
                'data' => [
                    'nb_rapports_envoyes' => count($validated['rapports_inclus']),
                    'date_envoi' => now()->format('d/m/Y H:i')
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('❌ Erreur envoi administration:', [
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'envoi à l\'administration',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Convertir le statut de la BDD au format frontend
     */
    private function mapStatut($statut)
    {
        $mapping = [
            'brouillon' => 'Brouillon',
            'en_attente' => 'En attente de validation',
            'valide' => 'Validé',
            'rejete' => 'Rejeté'
        ];

        return $mapping[$statut] ?? $statut;
    }

    /**
     * Liste tous les rapports (pour apiResource)
     */
    public function index()
    {
        try {
            $rapports = Rapport::with('user')->orderBy('created_at', 'desc')->get();
            return response()->json(['success' => true, 'data' => $rapports], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Afficher un rapport spécifique
     */
    public function show($id)
    {
        try {
            $rapport = Rapport::with('user')->findOrFail($id);
            return response()->json(['success' => true, 'data' => $rapport], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Rapport introuvable'], 404);
        }
    }

    /**
     * Créer un rapport
     */
    public function store(Request $request)
    {
        return $this->envoyerAuChefDepartement($request);
    }

    /**
     * Mettre à jour un rapport
     */
    public function update(Request $request, $id)
    {
        try {
            $rapport = Rapport::findOrFail($id);
            $rapport->update($request->all());
            return response()->json(['success' => true, 'data' => $rapport], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Supprimer un rapport
     */
    public function destroy($id)
    {
        try {
            $rapport = Rapport::findOrFail($id);
            $rapport->delete();
            return response()->json(['success' => true, 'message' => 'Rapport supprimé'], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
