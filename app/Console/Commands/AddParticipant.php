<?php

namespace App\Console\Commands;

use App\Models\Participant;
use Illuminate\Console\Command;

class AddParticipant extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'climb:add-participant';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Add a participant to the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $gameName = $this->ask('What is the game name?');
        $tagLine = $this->ask('What is the tag line?');
        $displayName = $this->ask('What is the display name?');

        $participant = Participant::create([
            'display_name' => $displayName,
            'gameName' => $gameName,
            'tagLine' => $tagLine,
        ]);

        $this->info('Participant added successfully');
    }
}
