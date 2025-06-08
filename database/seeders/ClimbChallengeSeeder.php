<?php

namespace Database\Seeders;

use App\Models\LeagueMatch;
use App\Models\LeagueMatchSummoner;
use App\Models\Participant;
use App\Models\Summoner;
use App\Models\SummonerTrack;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class ClimbChallengeSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        // Create participants
        $participants = [
            [
                'display_name' => 'Alex Thunder',
                'gameName' => 'AlexThunder',
                'tagLine' => 'EUW1',
                'puuid' => $faker->uuid(),
            ],
            [
                'display_name' => 'Sarah Storm',
                'gameName' => 'SarahStorm',
                'tagLine' => 'EUW2',
                'puuid' => $faker->uuid(),
            ],
            [
                'display_name' => 'Mike Flash',
                'gameName' => 'MikeFlash',
                'tagLine' => 'EUW3',
                'puuid' => $faker->uuid(),
            ],
            [
                'display_name' => 'Emma Frost',
                'gameName' => 'EmmaFrost',
                'tagLine' => 'EUW4',
                'puuid' => $faker->uuid(),
            ],
            [
                'display_name' => 'John Doe',
                'gameName' => 'JohnDoe',
                'tagLine' => 'EUW5',
                'puuid' => $faker->uuid(),
            ],
            [
                'display_name' => 'Emma Frost2',
                'gameName' => 'EmmaFrost2',
                'tagLine' => 'EUW6',
                'puuid' => $faker->uuid(),
            ],
        ];

        $createdParticipants = [];
        foreach ($participants as $participantData) {
            $createdParticipants[] = Participant::create($participantData);
        }

        // Create summoners for participants
        $tiers = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND'];
        $ranks = ['IV', 'III', 'II', 'I'];
        $champions = ['Ahri', 'Yasuo', 'Jinx', 'Lee Sin', 'Lux', 'Zed', 'Caitlyn', 'Thresh', 'Ezreal', 'Kai\'Sa'];

        $createdSummoners = [];
        foreach ($createdParticipants as $index => $participant) {
            $tier = $tiers[array_rand($tiers)];
            $rank = $ranks[array_rand($ranks)];
            $wins = $faker->numberBetween(20, 80);
            $losses = $faker->numberBetween(15, 60);

            $summoner = Summoner::create([
                'participant_id' => $participant->id,
                'account_id' => $faker->uuid(),
                'level' => $faker->numberBetween(30, 200),
                'profile_icon_id' => $faker->numberBetween(1, 50),
                'current_tier' => $tier,
                'current_rank' => $rank,
                'current_league_points' => $faker->numberBetween(0, 100),
                'current_wins' => $wins,
                'current_losses' => $losses,
                'peak_tier' => $faker->randomElement([$tier, $tiers[min(count($tiers) - 1, array_search($tier, $tiers) + $faker->numberBetween(0, 2))]]),
                'peak_rank' => $faker->randomElement($ranks),
                'peak_league_points' => $faker->numberBetween(50, 100),
                'peak_achieved_at' => $faker->dateTimeBetween('-30 days', 'now'),
            ]);

            $createdSummoners[] = $summoner;

            // Create progression tracks (simulate rank changes over time)
            $startDate = now()->subDays(30);
            $trackCount = $faker->numberBetween(5, 15);

            for ($i = 0; $i < $trackCount; $i++) {
                $trackTier = $tiers[max(0, array_search($tier, $tiers) - $faker->numberBetween(0, 2))];
                $trackRank = $ranks[array_rand($ranks)];
                $trackWins = $faker->numberBetween(10, $wins);
                $trackLosses = $faker->numberBetween(5, $losses);

                SummonerTrack::create([
                    'summoner_id' => $summoner->id,
                    'tier' => $trackTier,
                    'rank' => $trackRank,
                    'league_points' => $faker->numberBetween(0, 100),
                    'wins' => $trackWins,
                    'losses' => $trackLosses,
                    'created_at' => $startDate->copy()->addDays($i * 2),
                    'updated_at' => $startDate->copy()->addDays($i * 2),
                ]);
            }
        }

        // Create matches and match summoners
        $matchCount = 50;
        for ($i = 0; $i < $matchCount; $i++) {
            $match = LeagueMatch::create([
                'match_id' => 'EUW1_' . $faker->numberBetween(1000000000, 9999999999),
                'match_data' => json_encode(['gameMode' => 'CLASSIC', 'gameType' => 'MATCHED_GAME']),
                'timeline_data' => json_encode(['frames' => []]),
                'created_at' => $faker->dateTimeBetween('-30 days', 'now'),
            ]);

            // Create match summoner data for 2-4 participants per match
            $participantsInMatch = $faker->randomElements($createdSummoners, $faker->numberBetween(2, 4));

            foreach ($participantsInMatch as $summoner) {
                // Get a random track for this summoner
                $tracks = SummonerTrack::where('summoner_id', $summoner->id)->get();
                if ($tracks->isNotEmpty()) {
                    $track = $tracks->random();

                    $kills = $faker->numberBetween(0, 20);
                    $deaths = $faker->numberBetween(0, 15);
                    $assists = $faker->numberBetween(0, 25);
                    $result = $faker->randomElement(['WIN', 'LOSS', 'DRAW']);
                    $champion = $champions[array_rand($champions)];

                    LeagueMatchSummoner::create([
                        'league_match_id' => $match->id,
                        'summoner_track_id' => $track->id,
                        'kills' => $kills,
                        'deaths' => $deaths,
                        'assists' => $assists,
                        'champion' => $champion,
                        'result' => $result,
                    ]);
                }
            }
        }
    }
}
