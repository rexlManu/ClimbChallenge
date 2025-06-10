# ClimbChallenge Features

## Name Hiding for Participants

The ClimbChallenge application includes a name hiding feature that allows administrators to hide specific participants' names and Riot IDs from the public dashboard while maintaining their statistics.

### How it works

When a participant's name is hidden:

- Their display name becomes "Hidden Player"
- Their Riot ID becomes "Hidden#0000"
- All their statistics, ranks, and match data remain visible
- The feature applies to:
    - Main leaderboard
    - Champion statistics
    - Rank progression charts
    - Recent matches list
    - All other places where names are displayed

### Managing Name Visibility

Use the `climb:toggle-name-visibility` artisan command to manage participant name visibility:

#### List all participants and their visibility status

```bash
php artisan climb:toggle-name-visibility list
```

#### Hide a participant's name

```bash
php artisan climb:toggle-name-visibility hide "Player Name"
# or by ID
php artisan climb:toggle-name-visibility hide 1
```

#### Show a participant's name

```bash
php artisan climb:toggle-name-visibility show "Player Name"
# or by ID
php artisan climb:toggle-name-visibility show 1
```

### Database Changes

The feature adds a `hide_name` boolean column to the `participants` table:

- Default value: `false` (names are visible by default)
- When `true`: participant appears as "Hidden Player"
- When `false`: participant appears with their actual name

### Implementation Details

- The hiding logic is implemented at the model level using accessor methods
- All controller methods have been updated to use displayed names
- Frontend interfaces include the `hide_name` field for future extensions
- The feature maintains data integrity while providing privacy options
