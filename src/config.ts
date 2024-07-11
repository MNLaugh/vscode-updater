import { normalize } from "path";
/**
 * The function `checkConfig` checks if a file named "vscu.json" exists in the current directory and
 * returns a boolean indicating its presence.
 * It also validates the content of the configuration file.
 * @returns The `checkConfig` function returns a Promise that resolves to a boolean value. The boolean
 * value indicates whether a file named "vscu.json" is found and is valid.
 * @throws Will throw an error if the configuration file content is invalid.
 */
export async function checkConfig(): Promise<boolean> {
  const files = await Deno.readDir("./");
  let found = false;
  for await (const file of files) {
    if (file.isFile && file.name === "vscu.json") found = true;
  }
  if (!found) return false;
  const content = Deno.readTextFileSync("./vscu.json");
  try {
    const data = JSON.parse(content);
    if (!data.dir) throw new Error("Invalid configuration: 'dir' is missing.");
    if (typeof data.dir !== "string") {
      throw new Error("Invalid configuration: 'dir' must be a string.");
    }
    if (!data.interval || typeof data.interval !== "number") {
      throw new Error("Invalid configuration: 'interval' must be a number.");
    }
    return true;
  } catch (e) {
    console.error(`Error in configuration file: ${e.message}`);
    throw e;
  }
}

/* The `export interface ConfigData {` statement in the code is defining an interface named
`ConfigData`. An interface in TypeScript is a way to define the shape of an object. In this case,
the `ConfigData` interface specifies the structure of the configuration data that the application
expects. */
export interface ConfigData {
  dir: string;
  interval: number;
  token?: string;
}

/**
 * The function `readConfig` reads the contents of a file named "vscu.json" in the current directory
 * and returns the parsed JSON content.
 * @returns The `readConfig` function returns a Promise that resolves to a Config object. The Config
 * object is the parsed JSON content of the file named "vscu.json".
 */
let lastConfig: ConfigData | undefined;
let lastConfigTime = 0;
function readConfig(): ConfigData {
  try {
    if (lastConfig && Date.now() - lastConfigTime < 1000) return lastConfig;
    const content = Deno.readTextFileSync("./vscu.json");
    const data = JSON.parse(content);
    lastConfig = data;
    lastConfigTime = Date.now();
    return data;
  } catch (e) {
    throw e;
  }
}

/* The Config class retrieves and normalizes configuration data such as directory, interval, and token. */
export class Config implements ConfigData {
  get dir(): string {
    const { dir } = readConfig();
    return normalize(dir);
  }
  get interval(): number {
    const { interval } = readConfig();
    if (!interval) return 30 * 60 * 1000; // 30 minutes
    return interval;
  }
  get token(): string | undefined {
    const { token } = readConfig();
    return token;
  }
}

/* `const config = new Config();` is creating a new instance of the `Config` class and assigning it to
a constant variable named `config`. This instance of `Config` will provide access to the
configuration data such as directory, interval, and token through its properties (`dir`, `interval`,
`token`). The `Config` class retrieves and normalizes the configuration data from the "vscu.json"
file in the current directory, ensuring that the data is in the expected format and structure
defined by the `ConfigData` interface. This allows other parts of the application to easily access
and use the configuration settings by interacting with the `config` instance. */
export const config = new Config();
