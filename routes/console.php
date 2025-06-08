<?php

use App\Console\Commands\FetchParticipantPuuids;
use App\Console\Commands\UpdateSummoners;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Schedule::command(FetchParticipantPuuids::class)->everyMinute();
Schedule::command(UpdateSummoners::class)->everyMinute();
