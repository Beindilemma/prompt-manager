/**
 * promptTreeProvider.ts
 * 职责：Sidebar TreeView 的数据提供者
 * 将 PromptStore 中的 prompts 展示为 TreeItem 列表，支持排序
 */

import * as vscode from 'vscode';
import { Prompt, PromptStoreManager } from '../store/promptStore';

/**
 * TreeView 中每个 Prompt 对应的节点
 */
export class PromptTreeItem extends vscode.TreeItem {
  /** 节点对应的 Prompt 原始数据 */
  public readonly prompt: Prompt;

  /**
   * @param prompt - Prompt 数据
   * @param collectionName - 所属集合名称（可选，暂未使用）
   */
  constructor(prompt: Prompt, collectionName?: string) {
    super(prompt.title, vscode.TreeItemCollapsibleState.None);

    this.prompt = prompt;
    this.description = prompt.tags.join(' ');
    this.tooltip = prompt.body.length > 100
      ? prompt.body.slice(0, 100) + '...'
      : prompt.body;
    this.iconPath = new vscode.ThemeIcon('symbol-snippet');
    this.contextValue = 'promptItem';
  }
}

/**
 * Prompt TreeView 数据提供者
 * 实现 vscode.TreeDataProvider<PromptTreeItem>，从 PromptStoreManager 读取数据
 */
export class PromptTreeProvider implements vscode.TreeDataProvider<PromptTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    PromptTreeItem | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private store: PromptStoreManager;

  /**
   * @param store - PromptStoreManager 实例
   */
  constructor(store: PromptStoreManager) {
    this.store = store;
  }

  /**
   * 刷新 TreeView，触发 onDidChangeTreeData 事件
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * 返回 TreeItem
   */
  getTreeItem(element: PromptTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * 获取所有子节点，按 store.settings.sortBy 排序
   */
  getChildren(): vscode.ProviderResult<PromptTreeItem[]> {
    const settings = this.store.getSettings();
    const prompts = [...this.store.getAll()];

    switch (settings.sortBy) {
      case 'recent':
        prompts.sort((a, b) => {
          const aTime = a.lastUsedAt ?? 0;
          const bTime = b.lastUsedAt ?? 0;
          return bTime - aTime;
        });
        break;
      case 'usage':
        prompts.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'alpha':
        prompts.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return prompts.map((p) => new PromptTreeItem(p));
  }
}