<?php

use Illuminate\Filesystem\Filesystem;
use Symfony\Component\Process\Process;

beforeEach(function () {
    $this->directory = sys_get_temp_dir().'/climbchallenge-startup-'.bin2hex(random_bytes(8));
    mkdir($this->directory.'/bin', 0755, true);
    mkdir($this->directory.'/bootstrap/cache', 0755, true);
    file_put_contents($this->directory.'/bootstrap/cache/config.php', 'stale build configuration');
    file_put_contents($this->directory.'/supervisord.conf', 'test supervisor');

    $commands = [
        'php' => <<<'SH'
            #!/bin/sh
            printf '%s\n' "$*" >> "$STARTUP_TEST_LOG"
            if [ "$2" = "config:clear" ]; then
                if [ "${STARTUP_TEST_FAIL_CONFIG:-false}" = "true" ]; then exit 23; fi
                rm -f "$APP_BASE_PATH/bootstrap/cache/config.php"
            fi
            SH,
        'chown' => "#!/bin/sh\nexit 0\n",
        'supervisord' => <<<'SH'
            #!/bin/sh
            test ! -e "$APP_BASE_PATH/bootstrap/cache/config.php" || exit 41
            test -f "$2" || exit 42
            printf 'workers-started\n' >> "$STARTUP_TEST_LOG"
            SH,
    ];

    foreach ($commands as $name => $command) {
        file_put_contents($this->directory.'/bin/'.$name, $command."\n");
        chmod($this->directory.'/bin/'.$name, 0755);
    }

    $this->environment = [
        'APP_BASE_PATH' => $this->directory,
        'PATH' => $this->directory.'/bin:'.getenv('PATH'),
        'STARTUP_TEST_LOG' => $this->directory.'/startup.log',
    ];
});

afterEach(function () {
    (new Filesystem)->deleteDirectory($this->directory);
});

test('startup clears build configuration before starting processes and does not run migrations', function () {
    $process = new Process(['bash', dirname(__DIR__, 2).'/start-container.sh'], env: $this->environment);
    $process->mustRun();

    expect(file_get_contents($this->directory.'/startup.log'))->toBe(
        "artisan config:clear --no-interaction\nartisan storage:link --no-interaction\nworkers-started\n"
    )->and(is_dir($this->directory.'/storage/framework/caddy/config'))->toBeTrue();
});

test('startup stops before workers can use a configuration that could not be cleared', function () {
    $process = new Process(['bash', dirname(__DIR__, 2).'/start-container.sh'], env: [
        ...$this->environment,
        'STARTUP_TEST_FAIL_CONFIG' => 'true',
    ]);
    $process->run();

    expect($process->getExitCode())->toBe(23)
        ->and(file_get_contents($this->directory.'/startup.log'))
        ->not->toContain('workers-started');
});
