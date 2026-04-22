# 🚀 现代化 Neovim 配置

> 一个高度优化、模块化、功能完整的 Neovim 配置，提供现代 IDE 级开发体验

[![Neovim](https://img.shields.io/badge/Neovim-0.11+-green.svg)](https://neovim.io/)
[![Lua](https://img.shields.io/badge/Lua-5.1+-blue.svg)](https://www.lua.org/)
[![Lazy.nvim](https://img.shields.io/badge/Plugin%20Manager-Lazy.nvim-orange.svg)](https://github.com/folke/lazy.nvim)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ 特性亮点

- 🎯 **统一化架构**: 模块化设计，75% 文件减少，零功能损失
- 🔌 **精选插件**: 45 个精选插件，现代化替代，性能优化
- 🛠️ **完整 LSP**: 支持 10+ 种语言，智能补全，实时诊断
- 🧭 **智能导航**: Telescope 搜索，文件管理，符号跳转
- 🩺 **健康监控**: 完善的故障诊断和自动修复机制
- ⚡ **高性能**: 延迟加载，快速启动，资源优化
- 🎨 **现代 UI**: 精美主题，状态栏，通知系统

## 🏗️ 架构概览

```
nvim/
├── init.lua                    # 主入口文件
├── lua/config/                 # 核心配置模块
│   ├── core/options.lua       # 核心选项（含健康检查修复）
│   ├── plugins.lua            # 插件管理（45个精选插件）
│   ├── lsp.lua                # LSP 配置（10+ 语言支持）
│   ├── autocomplete.lua       # 自动补全系统
│   ├── telescope.lua          # 搜索和导航
│   ├── keymaps.lua           # 键位映射
│   └── ...                   # 其他工具模块
└── lua/plugin/               # 自定义插件
    ├── compile_run.lua       # 代码编译运行
    ├── swap_ternary.lua      # 三元运算符交换
    └── ...                   # 其他自定义功能
```

## 🚀 快速开始

### 系统要求

- **Neovim** >= 0.11.0
- **Git** >= 2.19.0
- **Node.js** >= 16.0 (可选，用于部分 LSP)
- **Python 3** (推荐，用于插件支持)

### 安装

```bash
# 备份现有配置
mv ~/.config/nvim ~/.config/nvim.backup

# 克隆配置
git clone https://github.com/zengtianli/nvim.git ~/.config/nvim

# 启动 Neovim（首次启动会自动安装插件）
nvim
```

### 首次使用

1. **插件安装**: 首次启动时会自动安装所有插件
2. **LSP 服务器**: 运行 `:Mason` 安装语言服务器
3. **健康检查**: 运行 `:checkhealth` 验证配置状态
4. **快捷键**: 按 `<Space>` 查看可用命令

## ⌨️ 核心快捷键

> **Leader 键**: `<Space>` (空格键)

### 基础操作

| 快捷键 | 功能 | 描述 |
|--------|------|------|
| `<Space>` | Leader 键 | 主要前缀键 |
| `S` | 保存文件 | 快速保存 |
| `Q` | 退出 | 快速退出 |
| `;` | 命令模式 | 替代 `:` |

### 导航搜索

| 快捷键 | 功能 | 描述 |
|--------|------|------|
| `<C-p>` | 文件搜索 | Telescope 文件查找 |
| `<C-f>` | 文本搜索 | 当前缓冲区搜索 |
| `<C-w>` | 缓冲区切换 | 打开的缓冲区 |
| `<C-h>` | 最近文件 | 历史文件 |
| `<C-q>` | 命令面板 | Commander |
| `R` | 文件管理器 | Yazi 文件管理 |

### LSP 功能

| 快捷键 | 功能 | 描述 |
|--------|------|------|
| `gd` | 跳转定义 | 当前窗口 |
| `gD` | 跳转定义 | 新标签页 |
| `gr` | 查找引用 | 所有引用 |
| `<leader>rn` | 重命名 | LSP 重命名 |
| `<leader>h` | 悬停文档 | 显示文档 |

### Git 集成

| 快捷键 | 功能 | 描述 |
|--------|------|------|
| `<C-g>` | LazyGit | Git 界面 |
| `<leader>gb` | Git Blame | 显示 blame |
| `<leader>gr` | 重置变更 | 重置 hunk |
| `<leader>gi` | Git 状态 | Git status |

## 🔌 插件生态

### 插件分类 (45 个精选插件)

#### 🎨 UI 界面 (9个)
- **nvim-deus**: 现代主题系统
- **lualine.nvim**: 状态栏
- **bufferline.nvim**: 标签栏
- **nvim-notify**: 通知系统
- **nvim-scrollbar**: 智能滚动条
- **hlchunk.nvim**: 代码块高亮
- **nvim-hlslens**: 搜索结果增强
- **vim-illuminate**: 符号高亮
- **nvim-treesitter-context**: 上下文显示

#### ✏️ 编辑增强 (8个)
- **Comment.nvim**: 智能注释 (替代 tcomment_vim)
- **nvim-surround**: 环绕操作
- **vim-visual-multi**: 多光标编辑
- **nvim-autopairs**: 自动配对
- **move.nvim**: 代码块移动
- **substitute.nvim**: 智能替换
- **nvim-code-action-menu**: 代码动作菜单
- **trouble.nvim**: 诊断面板

#### 🛠️ 开发工具 (10个)
- **nvim-lspconfig + mason.nvim**: LSP 管理
- **nvim-treesitter**: 语法高亮
- **gitsigns.nvim**: Git 集成
- **copilot.vim**: AI 代码助手
- **lsp-zero.nvim**: LSP 零配置
- **lsp_signature.nvim**: 函数签名
- **neodev.nvim**: Neovim 开发增强
- **fidget.nvim**: LSP 进度显示

## 🛠️ 语言支持

### LSP 服务器支持

| 语言 | LSP 服务器 | 功能 |
|------|------------|------|
| **Lua** | lua_ls | 补全、诊断、格式化 |
| **JavaScript/TypeScript** | ts_ls | 全功能支持 |
| **Python** | pyright | 类型检查、补全 |
| **C/C++** | clangd | 编译、调试、重构 |
| **Go** | gopls | 全功能支持 |
| **Rust** | rust_analyzer | 全功能支持 |
| **HTML/CSS** | html, cssls | Web 开发 |
| **JSON** | jsonls | 配置文件支持 |

### 代码运行器

支持多语言一键编译运行：
- **脚本语言**: Python, JavaScript, Lua
- **编译语言**: C++, Java, Rust, C
- **文档**: LaTeX (pdflatex), Markdown
- **Web**: HTML, CSS

快捷键: `r` (编译运行), `<leader>ra` (直接运行)

## 🩺 健康检查

### 内置故障诊断

运行健康检查：
```bash
# 全面检查
:checkhealth

# 特定组件
:checkhealth vim.lsp
:checkhealth mason
:checkhealth telescope
```

### 已修复的问题

- ✅ **Python Provider**: 自动配置正确的 Python 路径
- ✅ **init.vim 缺失**: 创建兼容性文件
- ✅ **Mason 构建错误**: 修复构建命令
- ✅ **插件冲突**: 自动清理 Git 冲突
- ✅ **依赖简化**: 移除不必要的插件依赖

## 📊 性能指标

### 重构效果

- **文件减少**: 80+ → 21 (75% 减少)
- **插件优化**: 72+ → 45 (精选优化)
- **启动时间**: < 100ms (优化后)
- **内存使用**: 显著减少
- **功能完整性**: 100% 保持

### 性能优化

- **延迟加载**: 所有插件智能延迟加载
- **按需加载**: 基于文件类型和事件加载
- **缓存优化**: 减少重复计算
- **资源管理**: 智能内存管理

## 🤝 贡献指南

### 报告问题

1. 运行 `:checkhealth` 检查配置状态
2. 提供详细的错误信息和环境信息
3. 在 [Issues](https://github.com/zengtianli/nvim/issues) 中创建报告

### 贡献代码

1. Fork 本仓库
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢所有插件作者和 Neovim 社区的贡献者们，让这个现代化的编辑器配置成为可能。

---

**⭐ 如果这个配置对你有帮助，请给个 Star！**

**🚀 让我们一起打造更好的 Neovim 开发体验！**
