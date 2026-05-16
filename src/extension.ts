import * as vscode from 'vscode'
import { openPanel } from './panel'

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'lightVuerd.open',
    async (uri?: vscode.Uri) => {
      if (!uri) {
        vscode.window.showErrorMessage('Please right click a .vuerd.json file.')
        return
      }

      openPanel(uri)
    }
  )

  context.subscriptions.push(disposable)
}

export function deactivate() {}