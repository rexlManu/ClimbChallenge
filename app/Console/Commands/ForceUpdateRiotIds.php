<?php

namespace App\Console\Commands;

use App\Models\Participant;
use App\Services\RiotService;
use Illuminate\Console\Command;

class ForceUpdateRiotIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'climb:force-update-riot-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Force update gameNames and taglines for all participants using account information from Riot API';

    public function __construct(private RiotService $riotService)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $participants = Participant::whereNotNull('puuid')->get();

        if ($participants->isEmpty()) {
            $this->info('No participants with PUUID found.');
            return;
        }

        $this->info("Found {$participants->count()} participants to update.");

        $updated = 0;
        $unchanged = 0;
        $errors = 0;

        foreach ($participants as $participant) {
            try {
                $accountDto = $this->riotService->getAccountByPuuid($participant->puuid);

                if ($accountDto === null) {
                    $this->error("Account not found for participant: {$participant->display_name} (PUUID: {$participant->puuid})");
                    $errors++;
                    continue;
                }

                $needsUpdate = false;
                $updates = [];
                $changes = [];

                // Check if gameName has changed
                if ($accountDto->gameName && $participant->gameName !== $accountDto->gameName) {
                    $updates['gameName'] = $accountDto->gameName;
                    $changes[] = "gameName: {$participant->gameName} -> {$accountDto->gameName}";
                    $needsUpdate = true;
                }

                // Check if tagLine has changed
                if ($accountDto->tagLine && $participant->tagLine !== $accountDto->tagLine) {
                    $updates['tagLine'] = $accountDto->tagLine;
                    $changes[] = "tagLine: {$participant->tagLine} -> {$accountDto->tagLine}";
                    $needsUpdate = true;
                }

                if ($needsUpdate) {
                    $participant->update($updates);
                    $this->info("Updated {$participant->display_name}: " . implode(', ', $changes));
                    $updated++;
                } else {
                    $this->comment("No changes needed for {$participant->display_name}");
                    $unchanged++;
                }
            } catch (\Exception $e) {
                $this->error("Error processing participant {$participant->display_name}: " . $e->getMessage());
                $errors++;
            }
        }

        $this->newLine();
        $this->info("Update completed:");
        $this->info("- Updated: {$updated}");
        $this->info("- Unchanged: {$unchanged}");
        $this->info("- Errors: {$errors}");
    }
} 