<?php

namespace App\Filament\Resources;

use App\Models\User;
use App\Notifications\WelcomeEnseignant;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\Metier;

// ✅ Importation des Pages
use App\Filament\Resources\EnseignantResource\Pages;

class EnseignantResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-circle';
    protected static ?string $navigationGroup = 'Gestion des Utilisateurs';
    protected static ?int $navigationSort = 2;

    public static function getModelLabel(): string
    {
        return 'Enseignant';
    }

    public static function getPluralModelLabel(): string
    {
        return 'Enseignants';
    }

    public static function getSlug(): string
    {
        return 'enseignants';
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')
                ->label('Nom complet')
                ->required()
                ->maxLength(255),

            Forms\Components\TextInput::make('prenom')
                ->label('Prénom')
                ->required()
                ->maxLength(255),

            Forms\Components\TextInput::make('email')
                ->label('Email')
                ->email()
                ->required()
                ->unique('users', 'email', ignoreRecord: true),

            // ✅ Champ metier_id
            Forms\Components\Select::make('metier_id')
                ->label('Métier')
                ->relationship('metier', 'nom')
                ->searchable()
                ->required(),

            // ✅ Champ caché pour forcer le rôle
            Forms\Components\Hidden::make('role')
                ->default('enseignant'),

            // ✅ Gestion du mot de passe améliorée
            Forms\Components\Section::make('Sécurité')
                ->schema([
                    Forms\Components\TextInput::make('password')
                        ->label('Mot de passe')
                        ->password()
                        ->revealable()
                        ->dehydrated(fn ($state) => filled($state))
                        ->dehydrateStateUsing(fn ($state) => Hash::make($state))
                        ->required(fn (string $context) => $context === 'create')
                        ->minLength(8)
                        ->same('password_confirmation'),

                    Forms\Components\TextInput::make('password_confirmation')
                        ->label('Confirmation du mot de passe')
                        ->password()
                        ->revealable()
                        ->required(fn (string $context) => $context === 'create')
                        ->dehydrated(false),
                ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Nom')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\TextColumn::make('prenom')
                    ->label('Prénom')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\TextColumn::make('email')
                    ->label('Email')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\TextColumn::make('metier.nom')
                    ->label('Métier')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Créé le')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                // Filtre par métier
                Tables\Filters\SelectFilter::make('metier')
                    ->relationship('metier', 'nom')
                    ->label('Filtrer par métier'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),

                // ✅ ACTION CORRIGÉE : Envoyer les identifiants
                Tables\Actions\Action::make('sendCredentials')
                    ->label('Renvoyer identifiants')
                    ->action(function (User $record) {
                        static::envoyerIdentifiantsEnseignant($record);
                    })
                    ->color('warning')
                    ->requiresConfirmation()
                    ->modalHeading('Renvoyer les identifiants')
                    ->modalDescription('Un nouveau mot de passe temporaire sera généré et envoyé par email à l\'enseignant. L\'ancien mot de passe ne fonctionnera plus.')
                    ->modalSubmitActionLabel('Confirmer l\'envoi')
                    ->icon('heroicon-m-envelope'),
            ])
            ->bulkActions([
                // Pas de bulk actions pour éviter les suppressions massives
            ]);
    }

    // ✅ MÉTHODE DÉDIÉE POUR L'ENVOI D'IDENTIFIANTS
    protected static function envoyerIdentifiantsEnseignant(User $enseignant): void
    {
        try {
            // Générer un nouveau mot de passe temporaire
            $nouveauPassword = Str::random(10);

            // Mettre à jour le mot de passe dans la base
            $enseignant->update([
                'password' => Hash::make($nouveauPassword)
            ]);

            // ✅ ENVOYER EN FILE D'ATTENTE - PLUS DE TIMEOUT !
            dispatch(function () use ($enseignant, $nouveauPassword) {
                // Log pour le débogage
                \Illuminate\Support\Facades\Log::info("📧 Envoi identifiants enseignant en file d'attente", [
                    'enseignant_id' => $enseignant->id,
                    'email' => $enseignant->email
                ]);

                // Envoyer l'email avec le nouveau mot de passe
                $enseignant->notify(new WelcomeEnseignant($nouveauPassword));

                \Illuminate\Support\Facades\Log::info("✅ Email envoyé avec succès", [
                    'enseignant_id' => $enseignant->id
                ]);
            });

            // Message de succès immédiat pour l'utilisateur
            \Filament\Notifications\Notification::make()
                ->title('Envoi en cours')
                ->body('Les identifiants sont en cours d\'envoi par email.')
                ->success()
                ->send();

        } catch (\Exception $e) {
            // Log de l'erreur
            \Illuminate\Support\Facades\Log::error('❌ Erreur lors de l\'envoi des identifiants', [
                'enseignant_id' => $enseignant->id,
                'error' => $e->getMessage()
            ]);

            // Message d'erreur pour l'utilisateur
            \Filament\Notifications\Notification::make()
                ->title('Erreur')
                ->body('Une erreur est survenue lors de l\'envoi des identifiants: ' . $e->getMessage())
                ->danger()
                ->send();
        }
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListEnseignants::route('/'),
            'create' => Pages\CreateEnseignant::route('/create'),
            'edit' => Pages\EditEnseignant::route('/{record}/edit'),
        ];
    }

    // ✅ Query pour ne montrer que les enseignants
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->where('role', 'enseignant');
    }

    // ✅ Permissions
    public static function canCreate(): bool
    {
        $user = Auth::user();
        return $user && in_array($user->role, ['admin', 'chef_departement', 'coordinateur']);
    }

    public static function canEdit($record): bool
    {
        $user = Auth::user();
        return $user && in_array($user->role, ['admin', 'chef_departement', 'coordinateur']);
    }

    public static function canDelete($record): bool
    {
        return false; // Empêche la suppression pour tous
    }
}
