<?php

namespace App\Filament\Resources\SummonerTrackResource\Pages;

use App\Filament\Resources\SummonerTrackResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListSummonerTracks extends ListRecords
{
    protected static string $resource = SummonerTrackResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
