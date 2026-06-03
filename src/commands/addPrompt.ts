/**
 * addPrompt.ts
 * 职责：注册"添加 Prompt"命令
 * 通过多步输入框引导用户输入 title、body、tags，然后调用 PromptStoreManager 保存
 */

import * as vscode from 'vscode';
import { PromptStoreManager } from '../store/promptStore';
import { PromptTreeProvider } from '../tree/promptTreeProvider';

/**
 * 注册"添加 Prompt"命令
 * 命令 ID: promptManager.add
 * @param context - VSCode ExtensionContext
 * @param store - PromptStoreManager 实例
 * @param provider - PromptTreeProvider 实例，用于刷新 TreeView
 */
export function registerAddPromptCommand(
  context: vscode.ExtensionContext,
  store: PromptStoreManager,
  provider: PromptTreeProvider,
): void {
  const disposable = vscode.commands.registerCommand(
    'promptManager.add',
    async () => {
      try {
        // 第一步：输入 title
        const title = await vscode.window.showInputBox({
          prompt: '请输入 Prompt 标题',
          placeHolder: '输入 Prompt 标题，例如：写单元测试',
          ignoreFocusOut: true,
        });
        if (!title) {
          return;
        }

        // 第二步：输入 body
        const body = await vscode.window.showInputBox({
          prompt: '请输入 Prompt 内容',
          placeHolder: '输入 Prompt 内容，用 {{变量名}} 表示变量',
          ignoreFocusOut: true,
        });
        if (!body) {
          return;
        }

        // 第三步：输入 tags（可选）
        const tagsInput = await vscode.window.showInputBox({
          prompt: '请输入标签（可选）',
          placeHolder: '输入标签，用逗号分隔，例如：java,测试',
          ignoreFocusOut: true,
        });
        // tagsInput 为 undefined 表示用户取消（按 Esc），此时也允许保存
        const tags =
          tagsInput !== undefined
            ? tagsInput
                .split(',')
                .map((t) => t.trim())
                .filter((t) => t.length > 0)
            : [];

        // 第四步：保存
        await store.add({
          title,
          body,
          tags,
          variables: [],
        });

        // 第五步：提示成功并刷新 TreeView
        provider.refresh();
        vscode.window.showInformationMessage(`Prompt 已保存：${title}`);
      } catch (err) {
        vscode.window.showErrorMessage(
          `添加 Prompt 失败: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );

  context.subscriptions.push(disposable);
}