/**
 * promptStore.ts
 * 职责：Prompt Manager 的数据持久化层
 * 负责管理 Prompt、Collection、Settings 的增删改查，通过 VSCode globalState 持久化存储
 */

import * as vscode from 'vscode';
import { nanoid } from 'nanoid';

// ============ 数据结构定义 ============

/** Prompt 中的变量定义 */
export interface Variable {
  name: string;
  defaultValue?: string;
  description?: string;
  required: boolean;
}

/** 单个 Prompt 的数据结构 */
export interface Prompt {
  id: string;
  title: string;
  description?: string;
  body: string;
  variables: Variable[];
  language?: string;
  tags: string[];
  collectionId?: string;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  lastUsedAt?: number;
}

/** Prompt 分组（Collection） */
export interface Collection {
  id: string;
  name: string;
  icon?: string;
  sortOrder: number;
  isTeamShared: boolean;
}

/** 用户偏好设置 */
export interface StoreSettings {
  defaultLanguage?: string;
  sortBy: 'recent' | 'usage' | 'alpha';
  showUsageCount: boolean;
  syncMode: 'local' | 'git';
}

/** 数据仓库的顶层结构 */
export interface PromptStore {
  version: string;
  schemaVersion: number;
  prompts: Prompt[];
  collections: Collection[];
  settings: StoreSettings;
  updatedAt: number;
}

// ============ 状态管理 key ============

const STORE_KEY = 'promptManager.store';

// ============ 默认值 ============

const DEFAULT_SETTINGS: StoreSettings = {
  sortBy: 'recent',
  showUsageCount: true,
  syncMode: 'local',
};

/**
 * PromptStoreManager
 * 负责 Prompt 数据的增删改查，数据通过 VSCode globalState 持久化
 */
export class PromptStoreManager {
  private context: vscode.ExtensionContext;
  private store: PromptStore;

  /**
   * @param context - VSCode ExtensionContext，用于访问 globalState
   */
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.store = this.getDefaultStore();
  }

  /**
   * 返回一个空结构的默认 PromptStore 对象
   */
  getDefaultStore(): PromptStore {
    return {
      version: '1.0.0',
      schemaVersion: 1,
      prompts: [],
      collections: [],
      settings: { ...DEFAULT_SETTINGS },
      updatedAt: Date.now(),
    };
  }

  /**
   * 从 globalState 加载数据到内存
   */
  async load(): Promise<void> {
    try {
      const stored = this.context.globalState.get<PromptStore>(STORE_KEY);
      if (stored) {
        this.store = stored;
      } else {
        this.store = this.getDefaultStore();
      }
    } catch (err) {
      vscode.window.showErrorMessage(`加载 Prompt 数据失败: ${err instanceof Error ? err.message : String(err)}`);
      this.store = this.getDefaultStore();
    }
  }

  /**
   * 将内存中的数据持久化到 globalState
   */
  async save(): Promise<void> {
    try {
      this.store.updatedAt = Date.now();
      await this.context.globalState.update(STORE_KEY, this.store);
    } catch (err) {
      vscode.window.showErrorMessage(`保存 Prompt 数据失败: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  /**
   * 获取当前设置
   */
  getSettings(): StoreSettings {
    return this.store.settings;
  }

  /**
   * 获取所有 Prompt
   */
  getAll(): Prompt[] {
    return this.store.prompts;
  }

  /**
   * 新增一个 Prompt
   * @param data - 除自动生成字段外的 Prompt 数据
   * @returns 创建完成的 Prompt 对象
   */
  async add(data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<Prompt> {
    const now = Date.now();
    const prompt: Prompt = {
      ...data,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    };
    this.store.prompts.push(prompt);
    await this.save();
    return prompt;
  }

  /**
   * 更新指定 Prompt
   * @param id - 要更新的 Prompt ID
   * @param data - 需要更新的字段
   * @returns 更新后的 Prompt 对象
   * @throws 找不到对应 ID 的 Prompt 时抛出错误
   */
  async update(id: string, data: Partial<Prompt>): Promise<Prompt> {
    const index = this.store.prompts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`找不到 ID 为 "${id}" 的 Prompt`);
    }
    const updated: Prompt = {
      ...this.store.prompts[index],
      ...data,
      id: this.store.prompts[index].id, // 不允许修改 id
      updatedAt: Date.now(),
    };
    this.store.prompts[index] = updated;
    await this.save();
    return updated;
  }

  /**
   * 删除指定 Prompt
   * @param id - 要删除的 Prompt ID
   * @throws 找不到对应 ID 的 Prompt 时抛出错误
   */
  async delete(id: string): Promise<void> {
    const index = this.store.prompts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`找不到 ID 为 "${id}" 的 Prompt`);
    }
    this.store.prompts.splice(index, 1);
    await this.save();
  }
}