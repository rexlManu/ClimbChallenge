<?php

namespace App\Filament\Resources\LeagueMatchResource\Pages;

use App\Filament\Resources\LeagueMatchResource;
use Filament\Infolists;
use Filament\Resources\Pages\ViewRecord;
use Filament\Schemas\Schema;

class ViewLeagueMatch extends ViewRecord
{
    protected static string $resource = LeagueMatchResource::class;

    public function infolist(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Infolists\Components\Section::make('Match Info')
                    ->schema([
                        Infolists\Components\TextEntry::make('match_id'),
                        Infolists\Components\TextEntry::make('game_started_at')
                            ->dateTime(),
                        Infolists\Components\TextEntry::make('game_ended_at')
                            ->dateTime(),
                        Infolists\Components\TextEntry::make('game_duration_in_minutes')
                            ->label('Duration')
                            ->suffix(' minutes'),
                        Infolists\Components\TextEntry::make('queue_id')
                            ->label('Queue ID'),
                    ])
                    ->columns(3),
                Infolists\Components\Section::make('Match Data (JSON)')
                    ->schema([
                        Infolists\Components\TextEntry::make('match_data')
                            ->label('')
                            ->formatStateUsing(fn ($state) => is_array($state) ? json_encode($state, JSON_PRETTY_PRINT) : (string) $state)
                            ->columnSpanFull()
                            ->extraAttributes(['class' => 'font-mono text-xs']),
                    ])
                    ->collapsed(),
                Infolists\Components\Section::make('Timeline Data (JSON)')
                    ->schema([
                        Infolists\Components\TextEntry::make('timeline_data')
                            ->label('')
                            ->formatStateUsing(fn ($state) => is_array($state) ? json_encode($state, JSON_PRETTY_PRINT) : (string) $state)
                            ->columnSpanFull()
                            ->extraAttributes(['class' => 'font-mono text-xs']),
                    ])
                    ->collapsed(),
            ]);
    }
}
