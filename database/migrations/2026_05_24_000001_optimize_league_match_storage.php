<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('league_matches', function (Blueprint $table) {
            $table->timestamp('game_started_at')->nullable()->after('match_id');
            $table->timestamp('game_ended_at')->nullable()->after('game_started_at');
            $table->unsignedInteger('game_duration_seconds')->nullable()->after('game_ended_at');
            $table->unsignedSmallInteger('queue_id')->nullable()->after('game_duration_seconds');
            $table->index('game_started_at');
            $table->index('game_ended_at');
            $table->longText('match_data')->nullable()->change();
            $table->longText('timeline_data')->nullable()->change();
        });

        $driver = DB::connection()->getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement(<<<'SQL'
                UPDATE league_matches
                SET
                    game_started_at = COALESCE(
                        game_started_at,
                        FROM_UNIXTIME(CAST(JSON_UNQUOTE(JSON_EXTRACT(match_data, '$.info.gameStartTimestamp')) AS UNSIGNED) / 1000)
                    ),
                    game_ended_at = COALESCE(
                        game_ended_at,
                        FROM_UNIXTIME(CAST(JSON_UNQUOTE(JSON_EXTRACT(match_data, '$.info.gameEndTimestamp')) AS UNSIGNED) / 1000)
                    ),
                    game_duration_seconds = COALESCE(
                        game_duration_seconds,
                        CAST(JSON_UNQUOTE(JSON_EXTRACT(match_data, '$.info.gameDuration')) AS UNSIGNED)
                    ),
                    queue_id = COALESCE(
                        queue_id,
                        CAST(JSON_UNQUOTE(JSON_EXTRACT(match_data, '$.info.queueId')) AS UNSIGNED)
                    )
                WHERE match_data IS NOT NULL
                    AND JSON_VALID(match_data)
                    AND JSON_EXTRACT(match_data, '$.info') IS NOT NULL
            SQL);

            DB::table('league_matches')->update([
                'match_data' => null,
                'timeline_data' => null,
            ]);
        }

        Schema::table('league_match_summoners', function (Blueprint $table) {
            $table->unique(['league_match_id', 'summoner_track_id'], 'lms_match_track_unique');
            $table->index(['champion', 'result'], 'lms_champion_result_index');
        });

        Schema::table('summoner_tracks', function (Blueprint $table) {
            $table->index(['summoner_id', 'created_at'], 'summoner_tracks_summoner_created_index');
            $table->index(['summoner_id', 'lp_change_type'], 'summoner_tracks_summoner_lp_change_type_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('summoner_tracks', function (Blueprint $table) {
            $table->dropIndex('summoner_tracks_summoner_created_index');
            $table->dropIndex('summoner_tracks_summoner_lp_change_type_index');
        });

        Schema::table('league_match_summoners', function (Blueprint $table) {
            $table->dropUnique('lms_match_track_unique');
            $table->dropIndex('lms_champion_result_index');
        });

        Schema::table('league_matches', function (Blueprint $table) {
            $table->dropIndex(['game_started_at']);
            $table->dropIndex(['game_ended_at']);
            $table->dropColumn([
                'game_started_at',
                'game_ended_at',
                'game_duration_seconds',
                'queue_id',
            ]);
        });
    }
};
