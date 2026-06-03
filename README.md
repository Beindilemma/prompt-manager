# Prompt Manager

一个 VS Code 扩展，用于保存、搜索和快速插入 AI Prompt，提升日常开发效率。

## 功能

- **保存 Prompt** — 支持为 Prompt 添加名称、标签和正文内容
- **变量占位符** — 使用 `{{变量名}}` 语法在 Prompt 正文中定义动态变量，插入时可交互式填充
- **快速搜索与插入** — 通过命令面板 (`Ctrl+Shift+P`) 搜索并插入已保存的 Prompt
- **侧边栏浏览** — 在活动栏中提供专用面板，可视化浏览所有 Prompt
- **导入 / 导出** — 支持将 Prompt 导出为 JSON 文件，或从 JSON 文件批量导入
- **编辑与删除** — 支持右键菜单内联编辑和删除 Prompt

## 安装

在 VS Code 扩展市场中搜索 **lazycode-prompt-manager** 并安装。

或从 [Releases](https://github.com/Beindilemma/prompt-manager/releases) 页面下载 `.vsix` 文件，通过以下命令安装：

```
code --install-extension lazycode-prompt-manager-0.0.1.vsix
```

## 使用方法

| 命令                          | 说明                      |
| ----------------------------- | ------------------------- |
| `Prompt Manager: 添加 Prompt` | 新增一条 Prompt           |
| `Prompt Manager: 插入 Prompt` | 搜索并选择要插入的 Prompt |
| `Prompt Manager: 编辑 Prompt` | 修改已有 Prompt           |
| `Prompt Manager: 删除 Prompt` | 删除 Prompt               |
| `Prompt Manager: Export`      | 将所有 Prompt 导出为 JSON |
| `Prompt Manager: Import`      | 从 JSON 文件导入 Prompt   |

### 变量占位符

在 Prompt 正文中使用 `{{变量名}}` 来定义变量。在插入 Prompt 时，扩展会依次提示你填写每个变量的值，替换后自动插入编辑器。

示例：

```
请帮我用 {{language}} 实现一个 {{algorithm}} 算法
```

## 开发

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听模式
npm run watch

# 运行测试
npm test

# Lint 检查
npm run lint
```

按 `F5` 启动扩展开发主机窗口进行调试。

## 技术栈

- TypeScript
- VS Code Extension API
- nanoid

## 许可

MIT

## 仓库

[https://github.com/Beindilemma/prompt-manager](https://github.com/Beindilemma/prompt-manager)
