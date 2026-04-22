# ZSH 配置

基于 Zim 框架的 ZSH 配置，集成现代命令行工具和 FZF 增强功能。

## 项目结构

```
zsh/
├── zshrc                    # 主配置文件
├── zimrc                    # Zim 框架配置
├── gitconfig                # Git 配置
├── config/                  # 配置目录
│   ├── conda.zsh           # Conda 管理
│   ├── fzf.zsh             # FZF 配置
│   ├── mappings.zsh        # 键盘映射
│   ├── modern-tools.zsh    # 现代工具别名
│   └── fzf/                # FZF 工具脚本
│       ├── brew-tools      # Homebrew 管理
│       ├── modern-git      # Git 工具
│       ├── process-tools   # 进程管理
│       └── util           # 工具总览
├── functions/               # 自定义函数
│   └── cd_git_root.zsh     # Git 根目录跳转
└── ssh/                    # SSH 配置
```

## 安装使用

1. 克隆到本地：
```bash
git clone https://github.com/zengtianli/zsh ~/.config/zsh
```

2. 链接配置文件：
```bash
ln -s ~/.config/zsh/zshrc ~/.zshrc
source ~/.zshrc
```

3. 查看可用功能：
```bash
util
```

## 核心功能

### 现代工具替代
- `ls` → `eza` (彩色文件列表)
- `cat` → `bat` (语法高亮)
- `find` → `fd` (更快搜索)
- `du` → `dust` (目录大小可视化)
- `top` → `btop` (系统监控)

### 快捷键
- `Ctrl+G` - LazyGit
- `Ctrl+P` - FZF 文件搜索
- `Ctrl+R` - FZF 历史搜索
- `Ctrl+T` - FZF 目录切换

### 管理工具
- `brew-tools` - Homebrew 包管理
- `process-tools` - 进程管理
- `conda_status` - Conda 状态
- `util` - 功能总览

## 配置选项

### 禁用现代工具
```bash
export ZSH_USE_MODERN_TOOLS="false"
```

### Conda 模式切换
```bash
export ZSH_CONDA_MODE="lazy"  # 延迟加载
export ZSH_CONDA_MODE="eager" # 立即加载
```

## 特性优势

- **现代化工具链**: 使用 `eza`、`bat`、`fd` 等现代命令行工具替代传统工具
- **FZF 深度集成**: 强大的模糊搜索功能，支持文件、历史记录、进程等搜索
- **智能别名系统**: 自动检测工具可用性，优雅降级到传统工具
- **模块化设计**: 配置按功能拆分，易于维护和自定义
- **环境适配**: 支持多种 Python 环境（Conda、pyenv 等）
- **Git 工具增强**: 集成 LazyGit 和自定义 Git 工具
- **性能优化**: 延迟加载机制，快速启动

## 安装依赖

### 基础工具
```bash
# 使用 Homebrew 安装现代工具
brew install eza bat fd dust btop fzf lazygit

# 或使用包管理器
# Ubuntu/Debian
sudo apt install exa bat fd-find dust btop fzf

# 安装 Zim 框架
curl -fsSL https://raw.githubusercontent.com/zimfw/install/master/install.zsh | zsh
```

### FZF 配置
```bash
# 自动设置 FZF 键绑定和补全
$(brew --prefix)/opt/fzf/install
```

## 自定义配置

### 修改工具别名
编辑 `config/modern-tools.zsh`:
```bash
# 自定义工具别名
alias ll='eza -la'
alias cat='bat --style=auto'
```

### 添加新的 FZF 工具
在 `config/fzf/` 目录下创建新脚本：
```bash
#!/usr/bin/env zsh
# 新的 FZF 功能
```

### 环境变量配置
```bash
# 在 .zshrc 中设置
export ZSH_CONDA_MODE="lazy"       # Conda 延迟加载
export ZSH_USE_MODERN_TOOLS="true" # 启用现代工具
```

## 故障排除

### 工具未找到
```bash
# 检查工具安装状态
which eza bat fd dust btop

# 安装缺失工具
brew install <missing-tool>
```

### FZF 快捷键不工作
```bash
# 重新安装 FZF 键绑定
$(brew --prefix)/opt/fzf/install

# 或手动加载
source ~/.fzf.zsh
```

### Conda 环境问题
```bash
# 检查 Conda 配置
conda_status

# 切换模式
export ZSH_CONDA_MODE="eager"
source ~/.zshrc
```

## 许可证

本项目采用 MIT 许可证。

---

**🚀 提升你的命令行体验！**

如果这个配置对你有帮助，请给个 ⭐️ 支持一下！
