/**
 * insertPrompt.ts
 * 职责：注册"快速搜索插入 Prompt"命令
 * 通过 QuickPick 搜索已保存的 Prompt，填写变量后插入到当前编辑器光标位置
 */

import * as vscode from 'vscode';
import { PromptStoreManager } from '../store/promptStore';
import { PromptTreeProvider } from '../tree/promptTreeProvider';

/**
 * 注册"快速搜索插入 Prompt"命令
 * 命令 ID: promptManager.insert
 * @param context - VSCode ExtensionContext
 * @param store - PromptStoreManager 实例
 * @param provider - PromptTreeProvider 实例，用于刷新 TreeView
 */
export function registerInsertPromptCommand(
  context: vscode.ExtensionContext,
  store: PromptStoreManager,
  provider: PromptTreeProvider,
): void {
  const disposable = vscode.commands.registerCommand(
    'promptManager.insert',
    async () => {
      try {
        // 第一步：取出所有 prompts
        const prompts = store.getAll();
        if (prompts.length === 0) {
          vscode.window.showInformationMessage(
            '还没有保存任何 Prompt，请先使用 Prompt Manager: Add 添加',
          );
          return;
        }

        // 第二步：构建 QuickPickItem 列表
        const items: vscode.QuickPickItem[] = prompts.map((prompt) => ({
          label: prompt.title,
          description: prompt.tags.join(' '),
          detail:
            prompt.body.length > 60
              ? prompt.body.slice(0, 60) + '...'
              : prompt.body,
        }));

        // 第三步：展示快速搜索列表
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: '搜索 Prompt...',
          matchOnDescription: true,
          matchOnDetail: true,
          ignoreFocusOut: true,
        });
        if (!selected) {
          return;
        }

        // 根据 label 找到对应的 prompt
        const matchedPrompt = prompts.find((p) => p.title === selected.label);
        if (!matchedPrompt) {
          return;
        }

        // === 变量占位符处理 ===
        // 用正则扫描 body 中的 {{变量名}}，提取并去重
        const variablePattern = /\{\{(\w+)\}\}/g;
        const variableNames = new Set<string>();
        let match: RegExpExecArray | null;
        while ((match = variablePattern.exec(matchedPrompt.body)) !== null) {
          variableNames.add(match[1]);
        }

        // 收集变量替换映射
        const replacementMap = new Map<string, string>();

        if (variableNames.size > 0) {
          for (const varName of variableNames) {
            // 从 prompt.variables 数组中匹配变量定义
            const variableDef = matchedPrompt.variables.find(
              (v) => v.name === varName,
            );

            const description = variableDef?.description;
            const defaultValue = variableDef?.defaultValue;

            const value = await vscode.window.showInputBox({
              title: '填写变量',
              prompt: description ?? varName,
              value: defaultValue ?? '',
              placeHolder: `输入 {{${varName}}} 的值`,
              ignoreFocusOut: true,
            });

            // 用户取消任意一个变量输入，终止整个流程
            if (value === undefined) {
              return;
            }

            replacementMap.set(varName, value);
          }
        }

        // 替换 body 中的 {{变量名}} 为实际值
        let finalBody = matchedPrompt.body;
        if (replacementMap.size > 0) {
          finalBody = finalBody.replace(
            /\{\{(\w+)\}\}/g,
            (_, varName: string) => {
              return replacementMap.get(varName) ?? `{{${varName}}}`;
            },
          );
        }

        // 第四步：获取当前活跃编辑器
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showErrorMessage('请先打开一个文件再插入 Prompt');
          return;
        }

        // 第五步：把替换后的 body 插入到光标位置
        await editor.edit((editBuilder) => {
          editBuilder.insert(editor.selection.active, finalBody);
        });

        // 第六步：更新使用计数并刷新 TreeView
        await store.update(matchedPrompt.id, {
          usageCount: matchedPrompt.usageCount + 1,
          lastUsedAt: Date.now(),
        });
        provider.refresh();
      } catch (err) {
        vscode.window.showErrorMessage(
          `插入 Prompt 失败: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );

  context.subscriptions.push(disposable);
}