/**
 * importExport.ts
 * 职责：注册"导入"和"导出"命令
 * 导出：将所有 prompts 序列化为 JSON 文件写入磁盘
 * 导入：从 JSON 文件读取 prompts 并批量添加到 store
 */

import * as vscode from 'vscode';
import { Prompt, PromptStoreManager } from '../store/promptStore';
import { PromptTreeProvider } from '../tree/promptTreeProvider';

// TextEncoder / TextDecoder 在 Node.js 18+ 全局可用，此处声明类型
declare class TextEncoder {
  encode(input?: string): Uint8Array;
}
declare class TextDecoder {
  constructor(encoding?: string);
  decode(input?: ArrayBufferView | ArrayBuffer): string;
}

/** 导出文件的顶层结构 */
interface ExportData {
  version: string;
  exportedAt: number;
  prompts: Prompt[];
}

/**
 * 注册"导出 Prompt"命令
 * 命令 ID: promptManager.export
 * @param context - VSCode ExtensionContext
 * @param store - PromptStoreManager 实例
 */
export function registerExportCommand(
  context: vscode.ExtensionContext,
  store: PromptStoreManager,
): void {
  const disposable = vscode.commands.registerCommand(
    'promptManager.export',
    async () => {
      try {
        const prompts = store.getAll();
        if (prompts.length === 0) {
          vscode.window.showInformationMessage('没有可导出的 Prompt');
          return;
        }

        const uri = await vscode.window.showSaveDialog({
          filters: { JSON: ['json'] },
          defaultUri: vscode.Uri.file('prompts.json'),
        });
        if (!uri) {
          return;
        }

        const exportData: ExportData = {
          version: '1.0.0',
          exportedAt: Date.now(),
          prompts,
        };

        const content = new TextEncoder().encode(
          JSON.stringify(exportData, null, 2),
        );
        await vscode.workspace.fs.writeFile(uri, content);

        vscode.window.showInformationMessage(
          `已导出 ${prompts.length} 条 Prompt`,
        );
      } catch (err) {
        vscode.window.showErrorMessage(
          `导出失败: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );

  context.subscriptions.push(disposable);
}

/**
 * 注册"导入 Prompt"命令
 * 命令 ID: promptManager.import
 * @param context - VSCode ExtensionContext
 * @param store - PromptStoreManager 实例
 * @param provider - PromptTreeProvider 实例，用于刷新 TreeView
 */
export function registerImportCommand(
  context: vscode.ExtensionContext,
  store: PromptStoreManager,
  provider: PromptTreeProvider,
): void {
  const disposable = vscode.commands.registerCommand(
    'promptManager.import',
    async () => {
      try {
        const uris = await vscode.window.showOpenDialog({
          filters: { JSON: ['json'] },
          canSelectMany: false,
        });
        if (!uris || uris.length === 0) {
          return;
        }

        const fileContent = await vscode.workspace.fs.readFile(uris[0]);
        const text = new TextDecoder('utf-8').decode(fileContent);

        let data: ExportData;
        try {
          data = JSON.parse(text) as ExportData;
        } catch {
          vscode.window.showErrorMessage('文件格式不正确');
          return;
        }

        if (!data.prompts || !Array.isArray(data.prompts)) {
          vscode.window.showErrorMessage('文件中没有找到 Prompt 数据');
          return;
        }

        let importedCount = 0;
        for (const prompt of data.prompts) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, createdAt, updatedAt, usageCount, lastUsedAt, ...rest } =
            prompt;
          await store.add({
            ...rest,
            variables: rest.variables ?? [],
            tags: rest.tags ?? [],
          } as Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>);
          importedCount++;
        }

        provider.refresh();
        vscode.window.showInformationMessage(
          `已导入 ${importedCount} 条 Prompt`,
        );
      } catch (err) {
        vscode.window.showErrorMessage(
          `导入失败: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );

  context.subscriptions.push(disposable);
}