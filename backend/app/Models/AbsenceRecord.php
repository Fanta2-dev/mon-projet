<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AbsenceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'apprenant_id',
        'seance_id',
        'statut',
        'justificatif_url',
        'motif_justificatif',
        'notified_at',
        'justified_at'
    ];

    protected $casts = [
        'notified_at' => 'datetime',
        'justified_at' => 'datetime',
    ];

    public function apprenant()
    {
        return $this->belongsTo(Apprenant::class);
    }

    public function seance()
    {
        return $this->belongsTo(Seance::class);
    }
}
