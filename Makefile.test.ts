declare const __dirname: string;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execFileSync } = require('node:child_process') as {
  execFileSync: (
    file: string,
    args: readonly string[],
    options: { cwd: string; encoding: 'utf8' },
  ) => string;
};

function dryRun(target: 'clean' | 'reset'): string {
  return execFileSync('make', ['--no-print-directory', '--dry-run', target], {
    cwd: __dirname,
    encoding: 'utf8',
  });
}

describe.each(['clean', 'reset'] as const)('make %s', (target) => {
  it('bypasses the application entrypoint for filesystem cleanup', () => {
    const [cleanupCommand] = dryRun(target).trim().split('\n');

    expect(cleanupCommand).toMatch(
      /^docker(?: compose|-compose) run --rm --entrypoint sh app -c 'rm -rf \/workspace\//,
    );
  });
});
