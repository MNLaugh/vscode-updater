import { exists, notify, tempDir } from "./utils.ts";
import { config } from "./config.ts";
import { normalize } from "path";
import { decompress } from "zip";

/**
 * The type `Version` represents an object with properties for version and zipurl.
 * @property {string} version - The `version` property in the `Version` type represents the version
 * number of a software or application.
 * @property {string} zipurl - The `zipurl` property typically represents a URL where a file can be
 * downloaded in ZIP format. It is commonly used to provide a direct link to download a specific
 * version of software or files.
 */
export type Version = {
  version: string;
  zipurl: string;
};

/* The `Updater` class in TypeScript handles checking for updates, downloading the latest version of
Visual Studio Code, and updating the application if necessary. */
class Updater {
  private static instance: Updater;
  public reset = 100;
  private constructor() {}
  public static getInstance(): Updater {
    if (!Updater.instance) {
      Updater.instance = new Updater();
    }
    return Updater.instance;
  }

  /**
   * The function `getLatestVersion` fetches the latest version information from the GitHub API for the
   * Microsoft VS Code repository, handling authorization, response validation, and error logging.
   * @returns The `getLatestVersion` function returns a Promise that resolves to either a `Version`
   * object or `null`. The `Version` object contains the `version` and `zipurl` properties extracted
   * from the response data obtained from the GitHub API. If there is an error during the process, an
   * exception will be thrown.
   */
  private async getLatestVersion(): Promise<Version | null> {
    if (this.reset > 100) return null;
    try {
      const ReqHeaders = new Headers();
      if (config.token) {
        console.debug(
          `Using token for authorization: ${
            config.token ? "****" : "No token"
          }`,
        );
        ReqHeaders.set("Authorization", `token ${config.token}`);
      }
      const uri =
        "https://api.github.com/repos/microsoft/vscode/releases/latest";
      const res = await fetch(uri);
      const data: Record<string, string> = await res.json();
      const validity = (Object.keys(data).includes("tag_name") &&
        Object.keys(data).includes("zipball_url")) ||
        Object.keys(data).includes("message");
      console.debug(
        "Latest version response data validity: ",
        validity ? "Valid" : "Invalid",
      );
      const headers = res.headers;
      const resetHeader = headers.get("x-ratelimit-reset");
      if (data.tag_name) {
        return {
          version: data.tag_name,
          zipurl: data.zipball_url,
        };
      } else {
        if (data.message) {
          console.error("Error on getting latest infos.\n", data.message);
        }
        this.reset = (Number(resetHeader) * 1000) - Date.now();
        return null;
      }
    } catch (e) {
      throw e;
    }
  }

  /**
   * The function `getLocalVersion` reads the local version from a specified path in a TypeScript
   * application.
   * @returns The `getLocalVersion` function returns a `Promise` that resolves to a `string`
   * representing the version number parsed from the `package.json` file located at the specified path.
   * If the file does not exist, an error message is displayed using the `notify` function. If an error
   * occurs during the process, it is thrown.
   */
  private async getLocalVersion(): Promise<string | undefined> {
    try {
      const path = normalize(config.dir + "\\resources\\app\\package.json");
      if (exists(path)) {
        const data = Deno.readTextFileSync(path);
        const json = JSON.parse(data);
        return json.version;
      } else {
        await notify(
          "Vscode Updater Error",
          "Unable to find the local version, please check the path in the configuration file.",
        );
      }
    } catch (e) {
      throw e;
    }
  }

  /**
   * The function `checkUpdate` asynchronously compares the local version with the latest version and
   * notifies if an update is available.
   * @returns The `checkUpdate` function returns a Promise that resolves to a boolean value indicating
   * whether an update is needed.
   */
  public async checkUpdate(): Promise<boolean> {
    try {
      const version = await this.getLocalVersion();
      if (version === undefined) return false;
      const needUpdate = await this.getLatestVersion().then(
        (latest): boolean => {
          if (latest === null || latest.version === undefined) return false;
          return latest.version !== version;
        },
      );
      if (needUpdate) await notify("Vscode Updater", "Update available!");
      return needUpdate;
    } catch (e) {
      throw e;
    }
  }

  /**
   * The function `downloadLatest` asynchronously downloads the latest version of Visual Studio Code
   * for Windows and saves it as a zip file.
   * @param {string} version - The `version` parameter in the `downloadLatest` function represents the
   * version number of the Visual Studio Code (VSCode) package that you want to download. It is used to
   * construct the download URL for the specific version of VSCode you are interested in.
   * @returns The function `downloadLatest` is returning a Promise that resolves to a string
   * representing the path to the downloaded archive file.
   */
  private async downloadLatest(version: string): Promise<string> {
    const url =
      `https://vscode.download.prss.microsoft.com/dbazure/download/stable/ea1445cc7016315d0f5728f8e8b12a45dc0a7286/VSCode-win32-x64-${version}.zip`;
    const archivePath = normalize(
      `${tempDir}\\VSCode-win32-x64-${version}.zip`,
    );

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(
          `Failed to fetch ${url} with status ${res.status}, ${res.statusText}`,
        );
      }
      const data = await res.arrayBuffer();
      Deno.writeFileSync(archivePath, new Uint8Array(data));
      return archivePath;
    } catch (e) {
      throw e;
    }
  }

  /**
   * The function `updateProcess` asynchronously updates a process by checking for updates, downloading
   * the latest version, decompressing it, and removing the downloaded archive.
   * @returns If the `checkUpdate` function returns false, the `updateProcess` function will return
   * early and not proceed with the update process. If the `getLatestVersion` function returns a `null`
   * value or if the `version` property of the latest version is `undefined`, the function will also
   * return without further processing. If any errors occur during the update process, an error will be
   * thrown.
   */
  public async updateProcess(): Promise<void> {
    try {
      if (!await this.checkUpdate()) return;
      const latest = await this.getLatestVersion();
      if (latest === null || latest.version === undefined) return;
      console.debug("Downloading latest version: ", latest.version);
      const archivePath = await this.downloadLatest(latest.version);
      await decompress(archivePath, config.dir);
      Deno.removeSync(archivePath);
    } catch (e) {
      throw e;
    }
  }

  /**
   * Checks if a specific process is running on the system.
   * @param processName - The name of the process to check.
   * @returns A boolean indicating whether the process is running.
   */
  private async isProcessRunning(processName: string): Promise<boolean> {
    try {
      const process = new Deno.Command("tasklist", {
        args: ["/FI", `IMAGENAME eq ${processName}`],
        stdout: "piped",
        stderr: "piped",
      });
      const output = await process.output();
      const outputStr = new TextDecoder().decode(output.stdout);
      return outputStr.includes(processName);
    } catch (e) {
      throw e;
    }
  }

  /**
   * The function asynchronously checks for updates, notifies the user about the latest version of
   * vscode, and updates vscode if it's not currently running.
   */
  public async run(): Promise<void> {
    try {
      if (await this.checkUpdate()) {
        if (!await this.isProcessRunning("Code.exe")) {
          const latest = await this.getLatestVersion();
          if (latest !== null) {
            await notify(
              "Vscode Updater",
              "Updating vscode to the latest version " + latest.version,
            );
          }
          await this.updateProcess();
        } else {
          await notify(
            "Vscode Updater",
            "Vscode is running, update skipped...\nPlease close vscode and run the updater again",
          );
        }
      }
    } catch (e) {
      throw e;
    }
  }
}

export const updater = Updater.getInstance();
