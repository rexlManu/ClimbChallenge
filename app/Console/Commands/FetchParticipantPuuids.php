<?php

namespace App\Console\Commands;

use App\Models\Participant;
use App\Services\RiotService;
use Illuminate\Console\Command;

class FetchParticipantPuuids extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'climb:fetch-participant-puuids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch participant puuids from the riot api';

    public function __construct(private RiotService $riotService)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $participants = Participant::whereNull('puuid')->get();

        foreach ($participants as $participant) {
            $account = $this->riotService->getAccount($participant->gameName, $participant->tagLine);

            if ($account === null) {
                $this->error('Account not found for ' . $participant->display_name);
                continue;
            }

            $participant->puuid = $account->puuid;
            $participant->save();

            $this->info('Fetched puuid for ' . $participant->display_name);
        }
    }
}
