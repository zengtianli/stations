---
description: "Raycast 命令完整清单，包含56条命令分类统计和详细列表"
tags: [Raycast, 命令行, 工作流, 自动化, macOS]
---

# Raycast 命令完整清单
**生成时间**：2026-03-02（合并后）
**总命令数**：56

---

## 📊 统计概览
| PackageName | 命令数 |
|-------------|--------|
| Apps | 2 |
| Custom | 1 |
| DOCX | 2 |
| Display | 2 |
| Files | 3 |
| Folders | 3 |
| Hydraulic | 4 |
| Window Manager | 4 |
| Network | 6 |
| Scripts | 21 |
| System | 3 |
| TTS | 1 |
| 秘书系统 | 4 |

---

## 📋 命令详细列表

### Apps

| 文件名 | 标题 | 描述 | 图标 | 模式 |
|--------|------|------|------|------|
| `app_open.sh` | app-open | Open selected folder in specified app | 🚀 | silent |
| `dingtalk_gov.sh` | dingtalk_gov | 启动政务钉钉（DingTalkGov） | 💼 | silent |

### Custom

| 文件名 | 标题 | 描述 | 图标 | 模式 |
|--------|------|------|------|------|
| `folder_paste.sh` | folder_paste | 将剪贴板中的文件粘贴到 Finder 当前目录 | 📋 | fullOutput |

### DOCX

| 文件名 | 标题 | 描述 | 图标 | 模式 |
|--------|------|------|------|------|
| `docx_to_md.sh` | docx-to-md | DOCX转Markdown（使用markitdown）- 支持多选 | 📄 | fullOutput |
| `md_docx_template.sh` | md-to-docx-template | Convert Markdown to Word document with template | 📄 | fullOutput |

### Display

| 文件名 | 标题 | 描述 | 图标 | 模式 |
|--------|------|------|------|------|
| `display_1080.sh` | display_1080 | Set external displays to 1080p (1920x1080) for pre... | 📺 | fullOutput |
| `display_4k.sh` | display_4k | Set external displays to 4K (3840x2160) | 🖥️ | fullOutput |

### Files

| 文件名 | 标题 | 描述 | 图标 | 模式 |
|--------|------|------|------|------|
| `file_copy.sh` | file-copy | Copy selected file's filename (and optionally cont... | 📋 | fullOutput |
| `file_print.sh` | file-print | Print selected files from Finder using default pri... | 🖨️ | fullOutput |
| `file_run.sh` | file-run | Run selected shell or python scripts | 🚀 | fullOutput |

### Folders

| 文件名 | 标题 | 描述 | 图标 | 模式 |
|--------|------|------|------|------|
| `folder_add_prefix.sh` | folder-add-prefix |  | 📝 | fullOutput |
| `folder_create.sh` | folder-create |  | 📁 | fullOutput |
| `folder_move_up_remove.sh` | folder-move-up-remove |  | 🗂️ | fullOutput |

### Hydraulic

| 文件名 | 标题 | 描述 | 图标 | 模式 |
|--------|------|------|------|------|
| `hy_capacity.sh` | 纳污能力计算 | 启动纳污能力计算 Streamlit 应用 | 🌊 | silent |
| `hy_geocode.sh` | 地理编码工具 | 启动地理编码 Streamlit 应用 | 📍 | silent |
| `hy_reservoir.sh` | 水库发电调度 | 启动水库发电调度 Streamlit 应用 | 🏗️ | silent |
| `hy_water_efficiency.sh` | 水效评估分析系统 | 启动工业集聚区水效评估分析 Streamlit 应用 | 💧 | silent |

### Window Manager

| 文件名 | 标题 | 描述 | 图标 | 模式 |
|--------|------|------|------|------|
| `yb_float.sh` | yb-float | 切换当前窗口的浮动/平铺状态 | 🪟 | silent |
| `yb_mouse_follow.sh` | yb-mouse-follow | 切换鼠标是否随窗口焦点移动 | 🖱️ | silent |
| `yb_org.sh` | yb-org | 通过临时切换 bsp 模式自动整理当前桌面的窗口布局 | 🪟 | silent |
| `yb_toggle.sh` | yb-toggle | 启动或停止 Yabai 窗口管理服务 | 🪟 | fullOutput |

### Network

| 文件名 | 标题 | 描述 | 图标 | 模式 |
|--------|------|------|------|------|
| `clashx_enhanced.sh` | clashx_enhanced | Enhanced ClashX proxy management and configuration | ⚙️ | fullOutput |
| `clashx_mode_direct.sh` | clashx_mode_direct | Switch ClashX to direct connection mode | ⚡ | fullOutput |
| `clashx_mode_global.sh` | clashx_mode_global | Switch ClashX to global proxy mode | 🌍 | fullOutput |
| `clashx_mode_rule.sh` | clashx_mode_rule | Switch ClashX to rule-based proxy mode | 📋 | fullOutput |
| `clashx_proxy.sh` | clashx_proxy | Manage and switch ClashX proxy servers | 🔄 | fullOutput |
| `clashx_status.sh` | clashx_status | Display current ClashX proxy status and configurat... | 🌐 | fullOutput |

### Scripts

| 文件名 | 标题 | 描述 | 图标 | 模式 |
|--------|------|------|------|------|
| `csv_from_txt.sh` | csv-from-txt | Convert text file to CSV format | 📊 | fullOutput |
| `csv_merge_txt.sh` | csv-merge-txt | Merge multiple text files into a single CSV | 📊 | fullOutput |
| `csv_to_txt.sh` | csv-to-txt | Convert CSV file to text format | 📊 | fullOutput |
| `docx_apply_image_caption.sh` | docx-image-caption |  | 📄 | fullOutput |
| `docx_text_formatter.sh` | docx-text-format |  | 📄 | fullOutput |
| `docx_zdwp_all.sh` | docx-zdwp-all |  | ✨ | fullOutput |
| `md_formatter.sh` | md-format | Format and standardize Markdown files | 📝 | fullOutput |
| `md_merge.sh` | md-merge | Merge multiple Markdown files into one | 📝 | fullOutput |
| `md_split_by_heading.sh` | md-split | Split Markdown file by headings | ✂️ | fullOutput |
| `pptx_apply_all.sh` | pptx-all | Apply all formatting to PowerPoint presentation | 📽️ | fullOutput |
| `pptx_font_yahei.sh` | pptx-font | Change PowerPoint fonts to Microsoft YaHei | 📽️ | fullOutput |
| `pptx_table_style.sh` | pptx-table | Apply table styling to PowerPoint presentation | 📽️ | fullOutput |
| `pptx_text_formatter.sh` | pptx-text | Format text in PowerPoint presentation | 📽️ | fullOutput |
| `pptx_to_md.sh` | pptx-to-md | Convert PowerPoint presentation to Markdown | 📽️ | fullOutput |
| `xlsx_from_csv.sh` | xlsx-from-csv | Convert CSV file to Excel spreadsheet | 📊 | fullOutput |
| `xlsx_from_txt.sh` | xlsx-from-txt | Convert text file to Excel spreadsheet | 📊 | fullOutput |
| `xlsx_lowercase.sh` | xlsx-lowercase | Convert all text in Excel to lowercase | 📊 | fullOutput |
| `xlsx_merge_tables.sh` | xlsx-merge | Merge multiple Excel tables into one | 📊 | fullOutput |
| `xlsx_splitsheets.sh` | xlsx-split | Split Excel workbook into separate sheets | 📊 | fullOutput |
| `xlsx_to_csv.sh` | xlsx-to-csv | Convert Excel spreadsheet to CSV format | 📊 | fullOutput |
| `xlsx_to_txt.sh` | xlsx-to-txt | Convert Excel spreadsheet to text format | 📊 | fullOutput |

### System

| 文件名 | 标题 | 描述 | 图标 | 模式 |
|--------|------|------|------|------|
| `sys_app_launcher.sh` | sys-app-launcher |  | 🚀 | fullOutput |
| `sys_oa_dev.sh` | 开发部 OA | 启动开发部 OA 管理面板 | 🛠 | silent |
| `sys_oa_zdwp.sh` | 水利公司 OA | 启动水利公司 OA 管理面板 | 🌊 | silent |

### TTS

| 文件名 | 标题 | 描述 | 图标 | 模式 |
|--------|------|------|------|------|
| `tts_volcano.sh` | tts-volcano | 火山引擎语音合成（文本转语音） | 🔊 | fullOutput |

### YABAI

| 文件名 | 标题 | 描述 | 图标 | 模式 |
|--------|------|------|------|------|
| `yb_org.sh` | yb-org | 通过临时切换 bsp 模式自动整理当前桌面的窗口布局 | 🪟 | silent |

### 秘书系统

| 文件名 | 标题 | 描述 | 图标 | 模式 |
|--------|------|------|------|------|
| `sec_log.sh` | 记录日志 | 记录工作、个人、投资、学习、生活等各类日志 | 📝 | fullOutput |
| `sec_oa.sh` | 打开 OA | 启动并打开智能秘书 OA 系统 | 🏢 | silent |
| `sec_report.sh` | 查看报告 | 查看各类工作和生活报告，支持多种时间范围 | 📊 | fullOutput |
| `sec_review.sh` | 每日回顾 | 智能生成回顾选项，添加今日评估，制定明日计划 | 📝 | fullOutput |

---

## 📝 更新说明

**2026-03-02 秘书系统命令合并**：
- 将 17 个秘书系统命令合并为 4 个统一入口
- 减少命令数量 76%，提升用户体验
- 详见：[秘书系统合并报告](./secretary-system/SECRETARY_MERGE_REPORT.md)
