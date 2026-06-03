/**
 * deletePrompt.ts
 * 职责：注册"删除 Prompt"命令
 * 通过 TreeView 右键菜单触发，弹出确认框后删除指定 Prompt
 */

import * as vscode from 'vscode';
import { PromptStoreManager } from '../store/promptStore';
import { PromptTreeItem, PromptTreeProvider } from '../tree/promptTreeProvider';

/**
 * 注册"删除 Prompt"命令
 * 命令 ID: promptManager.delete
 * @param context - VSCode ExtensionContext
 * @param store - PromptStoreManager 实例
 * @param provider - PromptTreeProvider 实例，用于刷新 TreeView
 */
export function registerDeletePromptCommand(
  context: vscode.ExtensionContext,
  store: PromptStoreManager,
  provider: PromptTreeProvider,
): void {
  const disposable = vscode.commands.registerCommand(
    'promptManager.delete',
    async (item: PromptTreeItem) => {
      try {
        const answer = await vscode.window.showWarningMessage(
          `确定删除 Prompt "${item.prompt.title}" 吗？`,
          { modal: false },
          '删除',
          '取消',
        );
        if (answer !== '删除') {
          return;
        }

        await store.delete(item.prompt.id);
        provider.refresh();
        vscode.window.showInformationMessage('Prompt 已删除');
      } catch (err) {
        vscode.window.showErrorMessage(
          `删除 Prompt 失败: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );

  context.subscriptions.push(disposable);
}