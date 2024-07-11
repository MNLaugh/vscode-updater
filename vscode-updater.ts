import {
  exit,
  formatLog,
  formatMillisecondes,
  notify,
  runned,
  setRun,
  writeToLog,
} from "./src/utils.ts";
import { checkConfig, config } from "./src/config.ts";
import { updater } from "./src/updater.ts";

const debug = Deno.env.get("DEBUG");
if (debug) {
  console.log("Debug mode enabled");
  const encoder = new TextEncoder();
  console.log = (...args: string[]): void => {
    // console.log(formatLog("Info: " + args.join(" ") + "\n"));
    Deno.stdout.write(
      encoder.encode(formatLog("Info: " + args.join(" ") + "\n")),
    );
  };
  console.error = (...args: string[]): void => {
    Deno.stdout.write(
      encoder.encode(formatLog("Error: " + args.join(" ") + "\n")),
    );
  };
  console.debug = (...args: string[]): void => {
    Deno.stdout.write(
      encoder.encode(formatLog("Debug: " + args.join(" ") + "\n")),
    );
  };
} else {
  // deno-lint-ignore no-explicit-any
  console.log = (...args: any[]): Promise<void> =>
    writeToLog("Info: " + args.join(" ") + "\n");
  // deno-lint-ignore no-explicit-any
  console.error = (...args: any[]): Promise<void> =>
    writeToLog("Error: " + args.join(" ") + "\n");
  // deno-lint-ignore no-explicit-any
  console.debug = (..._args: any[]): void => void 0;
}

/**
 * The function `start` in TypeScript checks configuration, runs an updater, and sets up an interval
 * loop for checking updates.
 */
async function start(): Promise<void> {
  // Check if the updater is already running
  if (runned) {
    console.error("Already running");
    await notify("Vscode Updater", "Already running");
    await exit(); // Exit the process
  }

  setRun(true); // Set the run file to true

  try {
    console.log("Checking configuration file...");
    if (!await checkConfig()) await exit("Configuration file not found");
    console.log(
      "Configuration file found:\nInstall Dir:",
      config.dir,
      "\nTime interval in ms:",
      config.interval,
    );
    console.log("Checking for updates...");
    await updater.run();
  } catch (e) {
    console.error(e.message);
    await exit(
      "An error occurred, check the log file for more details in the output.log file.",
    );
  }

  /**
   * The `intervalLoop` function in TypeScript checks for updates at regular intervals, handles rate
   * limiting, and notifies the user accordingly.
   */
  async function intervalLoop(): Promise<void> {
    let interval = config.interval;
    if (updater.reset > 100) interval = updater.reset;
    if (interval < 100) interval = 100;
    if (interval !== config.interval) {
      console.log(
        "Interval changed to",
        interval,
        "ms from",
        config.interval,
        "ms, Probably due to rate limiting. Use github token to increase rate limit.",
      );
      await notify(
        "Vscode Updater",
        `Started with timeout of ${
          formatMillisecondes(interval)
        }.\nProbably due to rate limiting.\nUse github token to increase rate limit.`,
      );
    }
    while (true) {
      await new Promise((resolve): number =>
        setTimeout((): void => resolve(void 0), interval)
      );
      console.log("Checking for updates in the interval loop...");
      try {
        console.log("Checking configuration file...");
        if (!await checkConfig()) {
          await notify("Vscode Updater Error", "Configuration file not found");
        }
        console.log("Checking for updates...");
        await updater.run();
        await notify(
          "Vscode Updater",
          "Update completed successfully!",
        );
      } catch (e) {
        console.log(
          "An error occurred while checking for updates in the interval loop",
        );
        console.error(e.message);
        console.error(e.stack);
        await notify(
          "Vscode Updater Error",
          "An error occurred, check the log file for more details in the output.log file.",
        );
      }
    }
  }
  await intervalLoop();
}

start().catch((e): never => {
  throw e;
}).then((): void => {
  console.log("Finished running");
});
