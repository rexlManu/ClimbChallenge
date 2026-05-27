<?php

namespace App\Filament\Resources;

use App\Filament\Resources\LeagueMatchResource\Pages;
use App\Models\LeagueMatch;
use BackedEnum;
use Filament\Actions;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

class LeagueMatchResource extends Resource
{
    protected static ?string $model = LeagueMatch::class;

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-play';

    protected static ?string $navigationLabel = 'Matches';

    protected static ?string $modelLabel = 'Match';

    protected static ?string $pluralModelLabel = 'Matches';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\TextInput::make('match_id')
                    ->label('Match ID')
                    ->required()
                    ->maxLength(255),
                Forms\Components\DateTimePicker::make('game_started_at')
                    ->label('Game Started At'),
                Forms\Components\DateTimePicker::make('game_ended_at')
                    ->label('Game Ended At'),
                Forms\Components\TextInput::make('game_duration_seconds')
                    ->label('Game Duration (seconds)')
                    ->numeric(),
                Forms\Components\TextInput::make('queue_id')
                    ->label('Queue ID')
                    ->numeric(),
                Forms\Components\Textarea::make('match_data')
                    ->label('Match Data (JSON)')
                    ->columnSpanFull()
                    ->formatStateUsing(fn ($state) => is_array($state) ? json_encode($state, JSON_PRETTY_PRINT) : $state),
                Forms\Components\Textarea::make('timeline_data')
                    ->label('Timeline Data (JSON)')
                    ->columnSpanFull()
                    ->formatStateUsing(fn ($state) => is_array($state) ? json_encode($state, JSON_PRETTY_PRINT) : $state),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('match_id')
                    ->searchable()
                    ->copyable(),
                Tables\Columns\TextColumn::make('game_started_at')
                    ->dateTime()
                    ->sortable(),
                Tables\Columns\TextColumn::make('game_duration_in_minutes')
                    ->label('Duration')
                    ->suffix(' min')
                    ->sortable(['game_duration_seconds']),
                Tables\Columns\TextColumn::make('queue_id')
                    ->label('Queue')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('summoners_count')
                    ->label('Players')
                    ->counts('summoners'),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('game_started_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('queue_id')
                    ->label('Queue')
                    ->options([
                        420 => 'Ranked Solo',
                        440 => 'Ranked Flex',
                        450 => 'ARAM',
                    ]),
            ])
            ->actions([
                Actions\ViewAction::make(),
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
            'index' => Pages\ListLeagueMatches::route('/'),
            'view' => Pages\ViewLeagueMatch::route('/{record}'),
        ];
    }
}
