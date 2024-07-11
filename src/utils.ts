import { Notification } from "notify/mod.ts";
// Notify the user with a message
let lastMessage = "";
let lastTime = 0;
export async function notify(title: string, message: string): Promise<void> {
  const notif = new Notification(); // Create a new notification
  if (lastMessage === message) return; // If the message is the same as the last one, return
  notif.title(title); // Set the title of the notification
  notif.body(message); // Set the body of the notification
  lastMessage = message; // Set the last message to the current message

  // Wait for the last notification
  const ms = ((lastTime === 0) ? lastTime : 1000 - (Date.now() - lastTime)) +
    100; // Calculate the time to wait
  return await new Promise((resolve): number =>
    setTimeout((): void => {
      notif.show(); // Show the notification
      lastTime = Date.now(); // Set the last time to the current time
      resolve(void 0);
    }, ms) // Wait for the time
  );
}
// Get the user home path
export const userHomePath = Deno.env.get(
  Deno.build.os === "windows" ? "USERPROFILE" : "HOME",
);
if (userHomePath === undefined) {
  throw await notify(
    "Vscode Updater Error",
    "Unable to find the user home directory.",
  );
}

export function exists(filename: string): boolean {
  try {
    Deno.statSync(filename);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    } else {
      throw error;
    }
  }
}

export const tempDir = await Deno.makeTempDir();
export const tempFile = tempDir + "\\vscode.zip";
const runFile = tempDir + "\\run";

if (!exists(runFile)) Deno.createSync(runFile);
export const runned = Deno.readTextFileSync(runFile) === "true";
export function setRun(e: boolean): void {
  Deno.writeTextFileSync(runFile, e ? "true" : "false");
}

// Ouvrir un fichier pour stdout et stderr
export const outputFile = await Deno.open("./output.log", {
  write: true,
  create: true,
  append: true,
});

export function formatLog(data: string): string {
  return `[${new Date().toLocaleString()}] ${data}`;
}
// Fonction pour écrire dans le fichier
export async function writeToLog(data: string): Promise<void> {
  const encoder = new TextEncoder();
  await outputFile.write(encoder.encode(formatLog(data)));
}

export async function exit(message?: string): Promise<void> {
  if (message) await notify("Vscode Updater Error", message);
  setRun(false);
  await outputFile.close();
  Deno.exit();
}

export function formatMillisecondes(ms: number): string {
  const secondes = Math.floor(ms / 1000);
  const minutes = Math.floor(secondes / 60);
  const heures = Math.floor(minutes / 60);
  const days = Math.floor(heures / 24);
  const secondesRemaining = secondes % 60;
  const minutesRemaining = minutes % 60;
  const hoursRemaining = heures % 24;
  return `${(days > 0) ? `${days} days, ` : ""}${
    hoursRemaining ? `${hoursRemaining} heures, ` : ""
  }${
    minutesRemaining ? `${minutesRemaining} minutes et ` : ""
  }${secondesRemaining} secondes`;
}
