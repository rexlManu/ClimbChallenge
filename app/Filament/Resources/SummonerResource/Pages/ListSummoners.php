<?php

namespace App\Filament\Resources\SummonerResource\Pages;

use App\Filament\Resources\SummonerResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListSummoners extends ListRecords
{
    protected static string $resource = SummonerResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
