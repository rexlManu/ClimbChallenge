<?php

use App\Http\Controllers\ClimbChallengeController;
use App\Http\Controllers\TestController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [ClimbChallengeController::class, 'index'])->name('climb-challenge.dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::get('test', TestController::class);

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
