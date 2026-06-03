/**
 * editPrompt.ts
 * 职责：注册"编辑 Prompt"命令
 * 通过 TreeView 右键菜单触发，弹出输入框编辑 title、body、tags 后保存
 */

import * as vscode from 'vscode';
import { PromptStoreManager } from '../store/promptStore';
import { PromptTreeItem, PromptTreeProvider } from '../tree/promptTreeProvider';

/**
 * 注册"编辑 Prompt"命令
 * 命令 ID: promptManager.edit
 * @param context - VSCode ExtensionContext
 * @param store - PromptStoreManager 实例
 * @param provider - PromptTreeProvider 实例，用于刷新 TreeView
 */
export function registerEditPromptCommand(
  context: vscode.ExtensionContext,
  store: PromptStoreManager,
  provider: PromptTreeProvider,
): void {
  const disposable = vscode.commands.registerCommand(
    'promptManager.edit',
    async (item: PromptTreeItem) => {
      try {
        // 第一步：编辑 title
        const title = await vscode.window.showInputBox({
          value: item.prompt.title,
          prompt: '编辑标题',
          ignoreFocusOut: true,
        });
        if (!title) {
          return;
        }

        // 第二步：编辑 body
        const body = await vscode.window.showInputBox({
          value: item.prompt.body,
          prompt: '编辑内容',
          ignoreFocusOut: true,
        });
        if (!body) {
          return;
        }

        // 第三步：编辑 tags
        const tagsInput = await vscode.window.showInputBox({
          value: item.prompt.tags.join(','),
          prompt: '编辑标签，用逗号分隔',
          ignoreFocusOut: true,
        });
        const tags =
          tagsInput !== undefined
            ? tagsInput
                .split(',')
                .map((t) => t.trim())
                .filter((t) => t.length > 0)
            : item.prompt.tags;

        // 第四步：保存
        await store.update(item.prompt.id, { title, body, tags });

        // 第五步：刷新 TreeView
        provider.refresh();

        // 第六步：提示成功
        vscode.window.showInformationMessage('Prompt 已更新');
      } catch (err) {
        vscode.window.showErrorMessage(
          `编辑 Prompt 失败: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );

  context.subscriptions.push(disposable);
}