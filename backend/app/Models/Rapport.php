<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rapport extends Model
{
    use HasFactory;

    protected $table = 'rapports';

    protected $fillable = [
        'user_id',
        'metier',
        'code_metier',
        'statistiques',
        'periode',
        'justificatifs_traites',
        'statut',
        'date_soumission',
        'date_validation',
        'date_rejet',
        'envoye_administration',
        'date_envoi_administration'
    ];

    protected $casts = [
        'statistiques' => 'array',
        'date_soumission' => 'datetime',
        'date_validation' => 'datetime',
        'date_rejet' => 'datetime',
        'date_envoi_administration' => 'datetime',
        'envoye_administration' => 'boolean',
        'justificatifs_traites' => 'integer'
    ];

    /**
     * Relation avec l'utilisateur qui a créé le rapport
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope pour les rapports en attente
     */
    public function scopeEnAttente($query)
    {
        return $query->where('statut', 'en_attente');
    }

    /**
     * Scope pour les rapports validés
     */
    public function scopeValides($query)
    {
        return $query->where('statut', 'valide');
    }

    /**
     * Scope pour les rapports non envoyés à l'administration
     */
    public function scopeNonEnvoyes($query)
    {
        return $query->where('envoye_administration', false);
    }

    /**
     * Vérifier si le rapport est validé
     */
    public function estValide()
    {
        return $this->statut === 'valide';
    }

    /**
     * Vérifier si le rapport est en attente
     */
    public function estEnAttente()
    {
        return $this->statut === 'en_attente';
    }
}
