<?php

namespace App\Http\Controllers;

use App\Services\RiotService;
use Illuminate\Http\Request;

class TestController extends Controller
{
    public function __construct(private RiotService $riotService) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $account = $this->riotService->getAccount('WeAreOutOfTime', 'moon');

        dd($account);
    }
}
