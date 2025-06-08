<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('league_match_summoners', function (Blueprint $table) {
            $table->integer('kills');
            $table->integer('deaths');
            $table->integer('assists');
            $table->string('champion');
            $table->string('result');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('league_match_summoners', function (Blueprint $table) {
            $table->dropColumn('kills');
            $table->dropColumn('deaths');
            $table->dropColumn('assists');
            $table->dropColumn('champion');
            $table->dropColumn('result');
        });
    }
};
