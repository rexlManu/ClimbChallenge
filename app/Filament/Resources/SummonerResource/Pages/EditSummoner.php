<?php

namespace App\Filament\Resources\SummonerResource\Pages;

use App\Filament\Resources\SummonerResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditSummoner extends EditRecord
{
    protected static string $resource = SummonerResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
