<?php

namespace App\Filament\Resources\SummonerTrackResource\Pages;

use App\Filament\Resources\SummonerTrackResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditSummonerTrack extends EditRecord
{
    protected static string $resource = SummonerTrackResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
