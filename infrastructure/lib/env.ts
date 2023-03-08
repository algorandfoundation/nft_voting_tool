/**
 * Returns the given environment variable, but throws an exception if it wasn't defined
 * @param key The name of the environment variable to return
 * @returns The value of process.env[key]
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw `Required parameter ${key} not found in environment variables; aborting deployment`
  }
  return value
}

