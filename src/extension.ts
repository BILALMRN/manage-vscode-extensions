import * as vscode from "vscode";
import {
  disableExtension,
  enableExtension,
  listExtensions,
} from "./helper/manageExtension";

let panel: vscode.WebviewPanel | undefined;
export function activate(context: vscode.ExtensionContext) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.text = "☱ Manage Extensions";
  statusBarItem.tooltip = "Manage Extensions";
  statusBarItem.command = "manage-extensions.showWebView";
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);

  const webview = vscode.commands.registerCommand(
    "manage-extensions.showWebView",
    async () => {
      if (panel) {
        // If the panel already exists, bring it to the front
        panel.reveal(vscode.ViewColumn.One);
        return;
      }
      panel = vscode.window.createWebviewPanel(
        "manage-extensions",
        "Manage Extensions",
        {
          viewColumn: vscode.ViewColumn.One,
          preserveFocus: true,
        },
        {
          enableScripts: true,
          // localResourceRoots: [vscode.Uri.file(join(context.extensionPath, 'media'))]
        }
      );
      panel.onDidDispose(() => {
        panel = undefined;
      });
      const stylePath = vscode.Uri.joinPath(
        context.extensionUri,
        "media",
        "style.css"
      );
      const styleVScodePath = vscode.Uri.joinPath(
        context.extensionUri,
        "media",
        "vscode.css"
      );
      const scriptPath = vscode.Uri.joinPath(
        context.extensionUri,
        "media",
        "index.js"
      );

      // And get the special URI to use with the webview
      const styleUri = panel.webview.asWebviewUri(stylePath);
      const styleVScodeUri = panel.webview.asWebviewUri(styleVScodePath);
      const scriptUri = panel.webview.asWebviewUri(scriptPath);

      panel.webview.html = await getWebviewContent(
        panel.webview.cspSource,
        styleVScodeUri,
        styleUri,
        scriptUri
      );

      panel.webview.onDidReceiveMessage(
        (message) => {
          let data;

          switch (message.command) {
            case command.enableExtensions:
              data = message.data as string[];
              data.forEach((extensionId) => enableExtension(extensionId));
              break;
            case command.disableExtensions:
              data = message.data as string[];
              data.forEach((extensionId) => disableExtension(extensionId));
              break;
            case command.successMessage:
              data = message.data as string;
              vscode.window.showInformationMessage(data);
              break;
            case command.alertMessage:
              data = message.data as string;
              vscode.window.showErrorMessage(data);
              break;
            case command.connectionStatus:
              data = message.data as string;
              vscode.window.showErrorMessage(data);
              break;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  context.subscriptions.push(webview);
}

async function getWebviewContent(
  _cspSource: string,
  styleVScodeUri: vscode.Uri,
  styleUri: vscode.Uri,
  scriptUri: vscode.Uri
) {
  let extensions;
  const extensionsId: string[] = await listExtensions();
  if (extensionsId.length > 0) {
    extensions = extensionsId.map(
      (extensionId) =>
        vscode.extensions.getExtension(extensionId) || { id: extensionId }
    );
  } else {
    //vscode.extensions.all not include the extensions are disable
    // extensions = vscode.extensions.all;
    extensions = vscode.extensions.all.filter((extension) => {
      return extension.packageJSON && !extension.packageJSON.isBuiltin;
    }); // Exclude built-in extensions
  }

  // const nonce = getNonce()
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy">

        <link href="${styleVScodeUri}" rel="stylesheet">
        <link href="${styleUri}" rel="stylesheet">
        <title>Manage Extensions</title>
    </head>
    <body>
    <h1>Manage Extensions</h1>
    <vscode-panel>
      <div class="container">
        <div style="padding-top: 15px">
          <input
            type="text"
            id="groupName"
            placeholder="Group Name"
            onkeydown="keydown(event)"
          />
          <button id="createGroupButton" onclick="createGroup()">
            Create Group
          </button>

          <div
            id="extensionList"
            class="groupsContainer"
            ondragover="allowDrop(event)"
            ondrop="dropRemove(event)"
            style="
              border: 1px solid cadetblue;
              overflow-y: scroll;
              height: 80vh;
            "
          >
          ${extensions
            .map(
              (ext: any) => `
            
            <div class="draggable" id="${
              ext?.id
            }" ondragstart="drag(event)" draggable="true">${
                ext?.packageJSON?.displayName || ext?.id
              }</div>
            `
            )
            .join("")}
          </div>
        </div>
        <div id="groupsContainer" class="groupsContainer"></div>
      </div>
    </vscode-panel>
    <script src="${scriptUri}"></script>
    </body>
    </html>`;
}

enum command {
  enableExtensions = "enableExtensions",
  disableExtensions = "disableExtensions",
  successMessage = "successMessage",
  alertMessage = "alertMessage",
  connectionStatus = "connectionStatus",
}

// This method is called when your extension is deactivated
export function deactivate() {}
