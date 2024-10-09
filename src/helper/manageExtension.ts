import { exec } from "child_process";

function runCommand(command: string) {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Output: ${stdout}`);
  });
}

export function disableExtension(extensionId: string) {
  const command = `code --uninstall-extension ${extensionId}`;
  runCommand(command);
}

export function enableExtension(extensionId: string) {
  const command = `code --install-extension ${extensionId}`;
  runCommand(command);
}

export async function listExtensions() {
  return new Promise<string[]>((resolve, reject) => {
    exec("code --list-extensions", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return reject(new Error(stderr));
      }
      const extensionsIds = stdout.split("\n").filter((ext) => ext);
      resolve(extensionsIds); // Resolve the promise with the list of extension IDs
    });
  });
}
