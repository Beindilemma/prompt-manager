import * as vscode from 'vscode';
import { PromptStoreManager } from './store/promptStore';
import { PromptTreeProvider } from './tree/promptTreeProvider';
import { registerAddPromptCommand } from './commands/addPrompt';
import { registerInsertPromptCommand } from './commands/insertPrompt';
import { registerDeletePromptCommand } from './commands/deletePrompt';
import { registerEditPromptCommand } from './commands/editPrompt';
import { registerExportCommand, registerImportCommand } from './commands/importExport';

export async function activate(context: vscode.ExtensionContext) {
  const store = new PromptStoreManager(context);
  await store.load();

  const treeProvider = new PromptTreeProvider(store);
  const treeView = vscode.window.createTreeView('promptManagerView', {
    treeDataProvider: treeProvider,
    showCollapseAll: false,
  });
  context.subscriptions.push(treeView);

  registerAddPromptCommand(context, store, treeProvider);
  registerInsertPromptCommand(context, store, treeProvider);
  registerDeletePromptCommand(context, store, treeProvider);
  registerEditPromptCommand(context, store, treeProvider);
  registerExportCommand(context, store);
  registerImportCommand(context, store, treeProvider);
}

export function deactivate() {}