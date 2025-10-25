<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

// ✅ Imports Filament
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;

// ✅ Imports nécessaires
use App\Models\Apprenant;
use App\Models\Metier;
use App\Models\ResponsableMetier;
use App\Notifications\WelcomeEnseignant;

class User extends Authenticatable implements FilamentUser
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'prenom',
        'email',
        'password',
        'role',
        'metier_id',
        'annee',
       'google_access_token',
    'google_refresh_token',
    'google_token_expires_at',
    'google_id',
    'google_name',
    'google_email',
    'google_avatar',            // ← AJOUT

    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            Log::info('🔧 Création utilisateur - AVANT sauvegarde', [
                'email' => $user->email,
                'role' => $user->role ?? 'non défini',
                'password_present' => !empty($user->password),
            ]);

            if (!$user->password) {
                $tempPassword = Str::random(8);
                $user->password = bcrypt($tempPassword);

                // Stocker le mot de passe temporaire pour l'envoyer plus tard
                $user->temp_password = $tempPassword;
            }
        });

        static::created(function ($user) {
            Log::info('✅ Utilisateur créé avec succès', [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
            ]);

            // ✅ Envoyer l'email APRÈS la création (et en file d'attente)
            if ($user->role === 'enseignant' && isset($user->temp_password)) {
                // ✅ Utiliser dispatch pour mettre en file d'attente
                dispatch(function () use ($user) {
                    $user->notify(new WelcomeEnseignant($user->temp_password));
                })->delay(now()->addSeconds(5)); // Petit délai pour être sûr
            }

            if ($user->role === 'apprenant') {
                Apprenant::create([
                    'user_id' => $user->id,
                    'prenom' => $user->prenom,
                    'nom' => $user->name,
                    'email' => $user->email,
                    'matricule' => self::generateMatricule(),
                    'metier_id' => $user->metier_id,
                    'annee' => $user->annee,
                ]);
            }
        });
    }

    private static function generateMatricule()
    {
        do {
            $matricule = 'APP-' . strtoupper(Str::random(6));
        } while (Apprenant::where('matricule', $matricule)->exists());

        return $matricule;
    }

    // 🔗 Relations
    public function apprenant()
    {
        return $this->hasOne(Apprenant::class);
    }

    public function responsableMetier()
    {
        return $this->hasOne(ResponsableMetier::class, 'user_id');
    }

    public function metier()
    {
        return $this->belongsTo(Metier::class);
    }

    // ✅ Filament access control - SPÉCIFIQUE AU PANEL "binta"
    public function canAccessPanel(Panel $panel): bool
    {
        \Log::info('=== 🧭 VÉRIFICATION ACCÈS PANEL ===');
        \Log::info('Panel ID:', ['id' => $panel->getId()]);
        \Log::info('Utilisateur:', [
            'id' => $this->id,
            'email' => $this->email,
            'role' => $this->role,
        ]);

        // SI C'EST LE PANEL "binta", appliquer nos règles
        if ($panel->getId() === 'binta') {
            $role = strtolower(trim($this->role ?? ''));
            $allowedRoles = ['admin', 'chef_departement'];

            $hasAccess = in_array($role, $allowedRoles);

            \Log::info('Résultat accès panel "binta":', [
                'role' => $role,
                'autorisé' => $hasAccess
            ]);

            return $hasAccess;
        }

        // Pour les autres panels, refuser par défaut
        \Log::info('❌ Panel non reconnu, accès refusé');
        return false;
    }
    public function rapports(): HasMany
    {
        return $this->hasMany(Rapport::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

     public function isEnseignant(): bool
    {
        return $this->role === 'enseignant';
    }

    public function isChefDepartement(): bool
    {
        return $this->role === 'chef_departement';
    }
    public function isResponsableMetier(): bool
    {
        return $this->role === 'responsable_metier' || str_contains($this->role ?? '', 'responsable_metier');
    }
    /**
 * Relation avec les rapports
 */

}
