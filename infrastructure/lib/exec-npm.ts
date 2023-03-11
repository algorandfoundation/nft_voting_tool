import { spawnSync } from 'child_process'

/**
 * Executes the given npm script command in the current working directory.
 *
 * Equivalent of:
 * ```
 * npm run {command}
 * ```
 *
 * @param command The npm script command to run
 */
export function execNpm(command: string) {
  console.log(`Executing: npm run ${command}`)

  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const buildProcess = spawnSync(npm, ['run', command])

  if (buildProcess.error) {
    throw buildProcess.error
  }

  if (buildProcess.status != 0) {
    if (buildProcess.stdout.length || buildProcess.stderr.length) {
      throw new Error(
        `${command} [Status ${buildProcess.status || ''}] stdout: ${buildProcess.stdout
          ?.toString()
          .trim()}\n\n\nstderr: ${buildProcess.stderr?.toString().trim()}`
      )
    }
    throw new Error(`${command} exited with status ${buildProcess.status || ''}`)
  }

  console.group(buildProcess.stdout.toString())
}

