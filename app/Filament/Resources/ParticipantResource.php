<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ParticipantResource\Pages;
use App\Models\Participant;
use BackedEnum;
use Filament\Actions;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

class ParticipantResource extends Resource
{
    protected static ?string $model = Participant::class;

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-user-group';

    protected static ?string $navigationLabel = 'Participants';

    protected static ?string $modelLabel = 'Participant';

    protected static ?string $pluralModelLabel = 'Participants';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\TextInput::make('display_name')
                    ->required()
                    ->maxLength(255),
                Forms\Components\TextInput::make('gameName')
                    ->label('Game Name')
                    ->required()
                    ->maxLength(255),
                Forms\Components\TextInput::make('tagLine')
                    ->label('Tag Line')
                    ->required()
                    ->maxLength(255),
                Forms\Components\TextInput::make('puuid')
                    ->label('PUUID')
                    ->maxLength(255),
                Forms\Components\Toggle::make('hide_name')
                    ->label('Hide Name')
                    ->helperText('When enabled, the Riot ID will be hidden on the public dashboard'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('display_name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('gameName')
                    ->label('Game Name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('tagLine')
                    ->label('Tag Line')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('puuid')
                    ->label('PUUID')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->copyable(),
                Tables\Columns\IconColumn::make('hide_name')
                    ->label('Hidden')
                    ->boolean(),
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
                //
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
            'index' => Pages\ListParticipants::route('/'),
            'create' => Pages\CreateParticipant::route('/create'),
            'edit' => Pages\EditParticipant::route('/{record}/edit'),
        ];
    }
}
