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
            $table->index(['game_ended_at', 'game_started_at', 'created_at'], 'league_matches_recent_index');
            $table->longText('match_data')->nullable()->change();
            $table->longText('timeline_data')->nullable()->change();
        });

        $driver = DB::connection()->getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement(<<<'SQL'
                UPDATE league_matches lm
                JOIN (
                    SELECT
                        id,
                        CASE
                            WHEN JSON_EXTRACT(match_data, '$.info') IS NOT NULL THEN match_data
                            WHEN JSON_VALID(JSON_UNQUOTE(match_data)) THEN JSON_UNQUOTE(match_data)
                            ELSE NULL
                        END AS payload
                    FROM league_matches
                    WHERE match_data IS NOT NULL
                        AND JSON_VALID(match_data)
                ) source ON source.id = lm.id
                SET
                    lm.game_started_at = COALESCE(
                        lm.game_started_at,
                        FROM_UNIXTIME(
                            COALESCE(
                                CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(source.payload, '$.info.gameStartTimestamp')), 'null') AS UNSIGNED),
                                CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(source.payload, '$.info.gameCreation')), 'null') AS UNSIGNED)
                            ) / 1000
                        )
                    ),
                    lm.game_ended_at = COALESCE(
                        lm.game_ended_at,
                        FROM_UNIXTIME(CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(source.payload, '$.info.gameEndTimestamp')), 'null') AS UNSIGNED) / 1000)
                    ),
                    lm.game_duration_seconds = COALESCE(
                        lm.game_duration_seconds,
                        CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(source.payload, '$.info.gameDuration')), 'null') AS UNSIGNED)
                    ),
                    lm.queue_id = COALESCE(
                        lm.queue_id,
                        CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(source.payload, '$.info.queueId')), 'null') AS UNSIGNED)
                    )
                WHERE source.payload IS NOT NULL
                    AND JSON_VALID(source.payload)
                    AND JSON_EXTRACT(source.payload, '$.info') IS NOT NULL
            SQL);
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
            $table->dropIndex('league_matches_recent_index');
            $table->dropColumn([
                'game_started_at',
                'game_ended_at',
                'game_duration_seconds',
                'queue_id',
            ]);
        });
    }
};
