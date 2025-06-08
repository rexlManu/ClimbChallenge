<?php

namespace App\Services;

use App\Services\Riot\AccountDto;
use App\Services\Riot\LeagueEntryDto;
use App\Services\Riot\Match\MatchDto;
use App\Services\Riot\SummonerDto;
use App\Services\Riot\Timeline\TimelineDto;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RiotService
{
    private function sendRequest(string $url, array $params = []): array|null
    {
        $endpointType = 'lol';
        $region = 'euw1';

        if (str_contains($url, 'account')) {
            $endpointType = 'riot';
            $region = 'europe';
        }

        if (str_contains($url, 'match')) {
            $region = 'europe';
        }

        $response = Http::baseUrl('https://' . $region . '.api.riotgames.com/' . $endpointType . '/')
            ->withHeaders([
                'X-Riot-Token' => config('riot.api_key'),
            ])
            ->get($url, $params);

        if ($response->status() === 404) {
            return null;
        }

        if ($response->status() !== 200) {
            Log::error('Riot API returned status ' . $response->status() . ' for ' . $url, [
                'url' => $url,
                'params' => $params,
                'response' => $response->body(),
            ]);

            return null;
        }

        return $response->json();
    }

    public function getAccount(string $gameName, string $tagLine): AccountDto|null
    {
        $account = $this->sendRequest('account/v1/accounts/by-riot-id/' . $gameName . '/' . $tagLine);

        if ($account === null) {
            return null;
        }

        return AccountDto::fromArray($account);
    }

    public function getSummoner(string $puuid): SummonerDto|null
    {
        $summoner = $this->sendRequest('summoner/v4/summoners/by-puuid/' . $puuid);

        if ($summoner === null) {
            return null;
        }

        return SummonerDto::fromArray($summoner);
    }

    /**
     * Get the league entries for a summoner
     *
     * @param string $puuid
     * @return array<LeagueEntryDto>|null
     */
    public function getLeagueEntries(string $puuid): array|null
    {
        $leagueEntries = $this->sendRequest('league/v4/entries/by-puuid/' . $puuid);

        if ($leagueEntries === null) {
            return null;
        }

        return array_map(fn(array $entry) => LeagueEntryDto::fromArray($entry), $leagueEntries);
    }

    public function getMatchIds(string $puuid, int $startTime = 0): array|null
    {
        $matchIds = $this->sendRequest('match/v5/matches/by-puuid/' . $puuid . '/ids', [
            'queue' => 420, // More Information here: https://static.developer.riotgames.com/docs/lol/queues.json
            // and here: https://developer.riotgames.com/docs/lol#working-with-lol-apis_game-constants
            'startTime' => $startTime,
        ]);

        if ($matchIds === null) {
            return null;
        }

        return $matchIds;
    }

    public function getMatch(string $matchId): MatchDto|null
    {
        $match = $this->sendRequest('match/v5/matches/' . $matchId);

        if ($match === null) {
            return null;
        }

        return MatchDto::fromArray($match);
    }

    public function getMatchTimeline(string $matchId): TimelineDto|null
    {
        $timeline = $this->sendRequest('match/v5/matches/' . $matchId . '/timeline');

        if ($timeline === null) {
            return null;
        }

        return TimelineDto::fromArray($timeline);
    }
}
