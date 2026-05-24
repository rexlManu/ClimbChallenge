<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SummonerTrackResource\Pages;
use App\Models\SummonerTrack;
use BackedEnum;
use Filament\Forms;
use Filament\Schemas\Schema;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class SummonerTrackResource extends Resource
{
    protected static ?string $model = SummonerTrack::class;

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-chart-bar';

    protected static ?string $navigationLabel = 'Track History';

    protected static ?string $modelLabel = 'Track Entry';

    protected static ?string $pluralModelLabel = 'Track History';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\Select::make('summoner_id')
                    ->relationship('summoner', 'id')
                    ->searchable()
                    ->preload()
                    ->required(),
                Forms\Components\Section::make('Rank Info')
                    ->schema([
                        Forms\Components\Select::make('tier')
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
                        Forms\Components\Select::make('rank')
                            ->options([
                                'IV' => 'IV',
                                'III' => 'III',
                                'II' => 'II',
                                'I' => 'I',
                            ])
                            ->default('IV'),
                        Forms\Components\TextInput::make('league_points')
                            ->label('League Points')
                            ->numeric()
                            ->default(0),
                        Forms\Components\TextInput::make('wins')
                            ->numeric()
                            ->default(0),
                        Forms\Components\TextInput::make('losses')
                            ->numeric()
                            ->default(0),
                    ])
                    ->columns(3),
                Forms\Components\Section::make('LP Change')
                    ->schema([
                        Forms\Components\TextInput::make('lp_change')
                            ->label('LP Change')
                            ->numeric()
                            ->default(0),
                        Forms\Components\Select::make('lp_change_type')
                            ->options([
                                'gain' => 'Gain',
                                'loss' => 'Loss',
                                'no_change' => 'No Change',
                            ]),
                        Forms\Components\Select::make('lp_change_reason')
                            ->options([
                                'match_win' => 'Match Win',
                                'match_loss' => 'Match Loss',
                                'dodge' => 'Dodge',
                                'decay' => 'Decay',
                                'unknown' => 'Unknown',
                            ]),
                        Forms\Components\Toggle::make('is_dodge')
                            ->label('Is Dodge'),
                    ])
                    ->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->sortable(),
                Tables\Columns\TextColumn::make('summoner.participant.display_name')
                    ->label('Participant')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('formatted_rank')
                    ->label('Rank')
                    ->sortable(['tier', 'rank', 'league_points']),
                Tables\Columns\TextColumn::make('league_points')
                    ->label('LP')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('lp_change')
                    ->label('LP Change')
                    ->numeric()
                    ->sortable()
                    ->color(fn ($record) => match (true) {
                        $record->lp_change > 0 => 'success',
                        $record->lp_change < 0 => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('lp_change_type')
                    ->label('Change Type')
                    ->badge()
                    ->sortable(),
                Tables\Columns\TextColumn::make('lp_change_reason')
                    ->label('Reason')
                    ->badge()
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_dodge')
                    ->label('Dodge')
                    ->boolean(),
                Tables\Columns\TextColumn::make('wins')
                    ->numeric()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('losses')
                    ->numeric()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('summoner_id')
                    ->relationship('summoner', 'id')
                    ->getOptionLabelFromRecordUsing(fn ($record) => $record->participant?->display_name ?? "Summoner #{$record->id}")
                    ->searchable()
                    ->preload()
                    ->label('Summoner'),
                Tables\Filters\SelectFilter::make('lp_change_type')
                    ->options([
                        'gain' => 'Gain',
                        'loss' => 'Loss',
                        'no_change' => 'No Change',
                    ]),
                Tables\Filters\SelectFilter::make('lp_change_reason')
                    ->options([
                        'match_win' => 'Match Win',
                        'match_loss' => 'Match Loss',
                        'dodge' => 'Dodge',
                        'decay' => 'Decay',
                        'unknown' => 'Unknown',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
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
            'index' => Pages\ListSummonerTracks::route('/'),
            'create' => Pages\CreateSummonerTrack::route('/create'),
            'edit' => Pages\EditSummonerTrack::route('/{record}/edit'),
        ];
    }
}
