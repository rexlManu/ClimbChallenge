<?php

use App\Http\Controllers\ClimbChallengeController;
use App\Http\Controllers\TestController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [ClimbChallengeController::class, 'index'])->name('climb-challenge.dashboard');
Route::get('/climb-challenge/rank-progression', [ClimbChallengeController::class, 'getRankProgressionData'])->name('climb-challenge.rank-progression');
Route::get('/climb-challenge/hourly-progression', [ClimbChallengeController::class, 'getHourlyProgression'])->name('climb-challenge.hourly-progression');
Route::get('/climb-challenge/recent-matches', [ClimbChallengeController::class, 'getRecentMatchesForSummoner'])->name('climb-challenge.recent-matches');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::get('test', TestController::class)->name('home');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
