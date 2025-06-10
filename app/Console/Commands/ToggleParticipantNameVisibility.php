<?php

namespace App\Console\Commands;

use App\Models\Participant;
use Illuminate\Console\Command;

class ToggleParticipantNameVisibility extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'climb:toggle-riot-id-visibility {action} {participant?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Toggle Riot ID visibility for participants. Actions: list, hide, show';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $action = $this->argument('action');
        $participantIdentifier = $this->argument('participant');

        switch ($action) {
            case 'list':
                $this->listParticipants();
                break;
            case 'hide':
                $this->toggleVisibility($participantIdentifier, true);
                break;
            case 'show':
                $this->toggleVisibility($participantIdentifier, false);
                break;
            default:
                $this->error('Invalid action. Use: list, hide, or show');
                $this->info('Examples:');
                $this->info('  php artisan climb:toggle-riot-id-visibility list');
                $this->info('  php artisan climb:toggle-riot-id-visibility hide "Player Name"');
                $this->info('  php artisan climb:toggle-riot-id-visibility show "Player Name"');
                return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    private function listParticipants()
    {
        $participants = Participant::all();

        if ($participants->isEmpty()) {
            $this->info('No participants found.');
            return;
        }

        $this->info('Participants and their Riot ID visibility status:');
        $this->newLine();

        $headers = ['ID', 'Display Name', 'Riot ID', 'Riot ID Hidden'];
        $rows = [];

        foreach ($participants as $participant) {
            $rows[] = [
                $participant->id,
                $participant->display_name,
                $participant->hide_name ? 'Hidden#0000' : $participant->riot_id,
                $participant->hide_name ? '✓' : '✗'
            ];
        }

        $this->table($headers, $rows);
    }

    private function toggleVisibility($identifier, $hideStatus)
    {
        if (!$identifier) {
            $this->error('Please provide a participant identifier (display name or ID).');
            return;
        }

        // Try to find by ID first, then by display name
        $participant = null;
        if (is_numeric($identifier)) {
            $participant = Participant::find($identifier);
        }

        if (!$participant) {
            $participant = Participant::where('display_name', $identifier)->first();
        }

        if (!$participant) {
            $this->error("Participant '{$identifier}' not found.");
            return;
        }

        $participant->hide_name = $hideStatus;
        $participant->save();

        $action = $hideStatus ? 'hidden' : 'visible';
        $this->info("Participant '{$participant->display_name}' Riot ID is now {$action}.");
        
        if ($hideStatus) {
            $this->comment("Their Riot ID will appear as 'Hidden#0000' in the dashboard while keeping their display name '{$participant->display_name}' visible.");
        } else {
            $this->comment("Their Riot ID will appear as '{$participant->riot_id}' in the dashboard.");
        }
    }
}
