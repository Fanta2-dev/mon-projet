<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\AbsenceRecord; // ✅ IMPORT CORRIGÉ

class AbsenceNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $absent;
    public $seance;

    public function __construct($absent, $seance)
    {
        $this->absent = $absent;
        $this->seance = $seance;
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $enseignantName = $this->seance->enseignant->name ?? 'Enseignant non spécifié';

        \Log::info('📧 CONSTRUCTION EMAIL AbsenceNotification', [
            'destinataire' => $notifiable->email,
            'seance' => $this->seance->nom
        ]);

        return (new MailMessage)
            ->subject('🚨 Notification d\'Absence - ' . $this->seance->nom)
            ->greeting('Bonjour ' . $this->absent['nom'] . ',')
            ->line('Votre absence a été signalée pour la séance suivante :')
            ->line('**Séance :** ' . $this->seance->nom)
            ->line('**UEA :** ' . $this->seance->uea_nom)
            ->line('**Date :** ' . \Carbon\Carbon::parse($this->seance->date)->format('d/m/Y'))
            ->line('**Heure :** ' . $this->seance->heure_debut . ' - ' . $this->seance->heure_fin)
            ->line('**Enseignant :** ' . $enseignantName)
            ->action('📋 Déposer un justificatif', url('/apprenant/absences'))
            ->line('Vous pouvez déposer un justificatif dans votre dashboard.')
            ->salutation('Cordialement,<br>Département EIT');
    }

    // ✅ CORRIGÉ : Utilise AbsenceRecord au lieu de l'ancien modèle
    public function toDatabase(object $notifiable): array
    {
        // Créer un enregistrement d'absence
        $absenceRecord = AbsenceRecord::create([
            'apprenant_id' => $this->absent['apprenant_id'],
            'seance_id' => $this->seance->id,
            'statut' => 'en_attente',
            'notified_at' => now(),
        ]);

        return [
            'absence_id' => $absenceRecord->id,
            'seance_nom' => $this->seance->nom,
            'seance_date' => $this->seance->date,
            'uea_nom' => $this->seance->uea_nom,
            'enseignant' => $this->seance->enseignant->name ?? 'Non spécifié',
            'message' => 'Absence signalée pour ' . $this->seance->nom,
            'action_url' => '/apprenant/absences',
            'action_text' => 'Déposer justificatif',
        ];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'seance_id' => $this->seance->id,
            'seance_nom' => $this->seance->nom,
            'apprenant_nom' => $this->absent['nom'],
        ];
    }
}
