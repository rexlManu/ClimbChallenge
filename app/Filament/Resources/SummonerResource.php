<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SummonerResource\Pages;
use App\Models\Summoner;
use BackedEnum;
use Filament\Actions;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

class SummonerResource extends Resource
{
    protected static ?string $model = Summoner::class;

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-user';

    protected static ?string $navigationLabel = 'Summoners';

    protected static ?string $modelLabel = 'Summoner';

    protected static ?string $pluralModelLabel = 'Summoners';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\Select::make('participant_id')
                    ->relationship('participant', 'display_name')
                    ->searchable()
                    ->preload()
                    ->required(),
                Forms\Components\TextInput::make('account_id')
                    ->label('Account ID')
                    ->maxLength(255),
                Forms\Components\TextInput::make('level')
                    ->numeric()
                    ->default(0),
                Forms\Components\TextInput::make('profile_icon_id')
                    ->label('Profile Icon ID')
                    ->numeric(),
                Forms\Components\Toggle::make('exclude_from_dashboard')
                    ->label('Exclude from public dashboard')
                    ->helperText('Hide this account from the leaderboard, charts, and recent games on the public page.'),
                Section::make('Current Rank')
                    ->schema([
                        Forms\Components\Select::make('current_tier')
                            ->options([
                                'UNRANKED' => 'Unranked',
                                'IRON' => 'Iron',
                                'BRONZE' => 'Bronze',
                                'SILVER' => 'Silver',
                                'GOLD' => 'Gold',
                                'PLATINUM' => 'Platinum',
                                'EMERALD' => 'Emerald',
                                'DIAMOND' => 'Diamond',
                                'MASTER' => 'Master',
                                'GRANDMASTER' => 'Grandmaster',
                                'CHALLENGER' => 'Challenger',
                            ])
                            ->default('UNRANKED'),
                        Forms\Components\Select::make('current_rank')
                            ->options([
                                'IV' => 'IV',
                                'III' => 'III',
                                'II' => 'II',
                                'I' => 'I',
                            ])
                            ->default('IV'),
                        Forms\Components\TextInput::make('current_league_points')
                            ->label('League Points')
                            ->numeric()
                            ->default(0),
                        Forms\Components\TextInput::make('current_wins')
                            ->label('Wins')
                            ->numeric()
                            ->default(0),
                        Forms\Components\TextInput::make('current_losses')
                            ->label('Losses')
                            ->numeric()
                            ->default(0),
                    ])
                    ->columns(2),
                Section::make('Peak Rank')
                    ->schema([
                        Forms\Components\Select::make('peak_tier')
                            ->options([
                                'IRON' => 'Iron',
                                'BRONZE' => 'Bronze',
                                'SILVER' => 'Silver',
                                'GOLD' => 'Gold',
                                'PLATINUM' => 'Platinum',
                                'EMERALD' => 'Emerald',
                                'DIAMOND' => 'Diamond',
                                'MASTER' => 'Master',
                                'GRANDMASTER' => 'Grandmaster',
                                'CHALLENGER' => 'Challenger',
                            ]),
                        Forms\Components\Select::make('peak_rank')
                            ->options([
                                'IV' => 'IV',
                                'III' => 'III',
                                'II' => 'II',
                                'I' => 'I',
                            ]),
                        Forms\Components\TextInput::make('peak_league_points')
                            ->label('League Points')
                            ->numeric()
                            ->default(0),
                        Forms\Components\DateTimePicker::make('peak_achieved_at')
                            ->label('Peak Achieved At'),
                    ])
                    ->columns(2),
                Forms\Components\DateTimePicker::make('last_match_fetched_at')
                    ->label('Last Match Fetched At'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('participant.display_name')
                    ->label('Participant')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('current_formatted_rank')
                    ->label('Current Rank')
                    ->badge()
                    ->sortable(['current_tier', 'current_rank', 'current_league_points']),
                Tables\Columns\TextColumn::make('current_league_points')
                    ->label('LP')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('peak_formatted_rank')
                    ->label('Peak Rank')
                    ->badge()
                    ->sortable(['peak_tier', 'peak_rank', 'peak_league_points']),
                Tables\Columns\TextColumn::make('current_wins')
                    ->label('Wins')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('current_losses')
                    ->label('Losses')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('current_win_rate')
                    ->label('Win Rate')
                    ->suffix('%')
                    ->sortable(),
                Tables\Columns\IconColumn::make('exclude_from_dashboard')
                    ->label('Hidden')
                    ->boolean()
                    ->sortable(),
                Tables\Columns\TextColumn::make('level')
                    ->numeric()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('account_id')
                    ->label('Account ID')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->copyable(),
                Tables\Columns\TextColumn::make('last_match_fetched_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('current_tier')
                    ->options([
                        'UNRANKED' => 'Unranked',
                        'IRON' => 'Iron',
                        'BRONZE' => 'Bronze',
                        'SILVER' => 'Silver',
                        'GOLD' => 'Gold',
                        'PLATINUM' => 'Platinum',
                        'EMERALD' => 'Emerald',
                        'DIAMOND' => 'Diamond',
                        'MASTER' => 'Master',
                        'GRANDMASTER' => 'Grandmaster',
                        'CHALLENGER' => 'Challenger',
                    ]),
                Tables\Filters\SelectFilter::make('participant_id')
                    ->relationship('participant', 'display_name')
                    ->label('Participant'),
                Tables\Filters\TernaryFilter::make('exclude_from_dashboard')
                    ->label('Hidden from dashboard'),
            ])
            ->actions([
                Actions\EditAction::make(),
                Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Actions\BulkActionGroup::make([
                    Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSummoners::route('/'),
            'create' => Pages\CreateSummoner::route('/create'),
            'edit' => Pages\EditSummoner::route('/{record}/edit'),
        ];
    }
}
