# ClimbChallenge Features

## Riot ID Hiding for Participants

The ClimbChallenge application includes a Riot ID hiding feature that allows administrators to hide specific participants' Riot IDs (gameName#tagLine) from the public dashboard while keeping their display names and statistics visible.

### How it works

When a participant's Riot ID is hidden:

- Their display name remains visible (e.g., "Player123")
- Their Riot ID becomes "Hidden#0000"
- All their statistics, ranks, and match data remain visible
- The feature applies to:
    - Main leaderboard
    - Champion statistics
    - Rank progression charts
    - Recent matches list
    - All other places where Riot IDs are displayed

### Managing Riot ID Visibility

Use the `climb:toggle-riot-id-visibility` artisan command to manage participant Riot ID visibility:

#### List all participants and their Riot ID visibility status

```bash
php artisan climb:toggle-riot-id-visibility list
```

#### Hide a participant's Riot ID

```bash
php artisan climb:toggle-riot-id-visibility hide "Player Name"
# or by ID
php artisan climb:toggle-riot-id-visibility hide 1
```

#### Show a participant's Riot ID

```bash
php artisan climb:toggle-riot-id-visibility show "Player Name"
# or by ID
php artisan climb:toggle-riot-id-visibility show 1
```

### Database Changes

The feature adds a `hide_name` boolean column to the `participants` table:

- Default value: `false` (Riot IDs are visible by default)
- When `true`: participant's Riot ID appears as "Hidden#0000"
- When `false`: participant's Riot ID appears as their actual "gameName#tagLine"

### Implementation Details

- The hiding logic is implemented at the model level using accessor methods
- Only the Riot ID is hidden; display names remain visible
- All controller methods use the displayed Riot ID accessor
- Frontend interfaces include the `hide_name` field for future extensions
- The feature maintains data integrity while providing privacy options for sensitive Riot accounts
