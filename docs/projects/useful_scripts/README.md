---
description: "水利领域专用工具集，包含纳污能力、水库调度、灌溉需水等多个模块"
tags: [水利工程, 工具集, 水资源管理, Streamlit, QGIS]
---

# 水利专用工具集

> 📦 水利领域专用工具统一入口 - 包含风险图处理、纳污能力计算、水库调度等

---

## 目录

- [工具概述](#工具概述)
- [快速启动](#快速启动)
- [目录结构](#目录结构)
- [工具详情](#工具详情)
- [公共库](#公共库)
- [配置说明](#配置说明)

---

## 工具概述

| 子目录 | 功能 | 状态 | 入口文件 |
|--------|------|------|----------|
| `capacity/` | 纳污能力计算 | ✅ 完成 | `app.py` |
| `geocode/` | 地理编码/逆编码 | ✅ 完成 | `app.py` |
| `reservoir_schedule/` | 水库发电调度 | ✅ 完成 | `app.py` |
| `irrigation/` | 灌溉需水计算 | 🔄 开发中 | `ngxs1/main.py` |
| `district_scheduler/` | 区域调度模型 | 🔄 开发中 | - |
| `qgis/` | QGIS 空间处理 | ✅ 完成 | `pipeline/` |
| `company_query/` | 企业信息查询 | ✅ 完成 | `src/` |
| `risk_data/` | 风险分析表填充 | ✅ 完成 | `*.py` |
| `water_efficiency/` | 用水效率 | ✅ 完成 | `app.py` |
| `cad/` | CAD 脚本 | ✅ 完成 | `*.lsp` |
| `rainfall/` | 降雨数据 | 📊 数据 | - |
| `water_annual/` | 年度水资源数据 | 📊 数据 | - |

---

## 快速启动

### GUI 工具（Streamlit）

```bash
# 纳污能力计算界面
cd capacity && streamlit run app.py

# 地理编码界面
cd geocode && streamlit run app.py

# 水库调度界面
cd reservoir_schedule && streamlit run app.py

# 用水效率界面
cd water_efficiency && streamlit run app.py
```

### CLI 工具

```bash
# 纳污能力计算
cd capacity
python run.py --input data/sample/输入.xlsx --output 计算结果.xlsx

# 水库调度
cd reservoir_schedule
python run.py --input data/sample/输入.xlsx --output 计算结果.xlsx
```

### 风险图处理

```bash
# QGIS 流水线
cd qgis/scripts
./run_pipeline.sh 1-5

# Excel 数据填充
cd risk_data
python 3.03_risk_protection_dike_relation.py
```

---

## 目录结构

```
projects/
├── capacity/                # ⭐ 纳污能力计算
│   ├── src/                 # 核心代码
│   ├── data/                # 数据目录
│   │   ├── input/           # 输入 CSV
│   │   ├── output/          # 输出 CSV
│   │   └── sample/          # 示例文件
│   ├── app.py               # Streamlit 界面
│   └── run.py               # CLI 入口
│
├── reservoir_schedule/      # ⭐ 水库调度
│   ├── src/                 # 核心代码
│   ├── data/                # 数据目录
│   ├── docs/                # 文档
│   ├── app.py               # Streamlit 界面
│   └── run.py               # CLI 入口
│
├── qgis/                    # QGIS 空间处理
│   ├── pipeline/            # 流水线脚本 (01-13)
│   ├── tools/               # 独立工具
│   ├── _util/               # 公共模块
│   └── scripts/             # Shell 脚本
│
├── risk_data/               # 风险图 Excel 填充
│   ├── 1.x_*.py             # 数据库脚本
│   ├── 2.x_*.py             # 预报脚本
│   ├── 3.x_*.py             # 风险分析脚本
│   ├── input/               # 输入数据
│   └── output/              # 输出数据
│
├── geocode/                 # 地理编码
│   ├── src/                 # 核心脚本
│   └── data/                # 数据目录
│
├── company_query/           # 企业查询
│   ├── src/                 # 核心脚本
│   └── data/                # 数据文件
│
├── water_efficiency/        # 用水效率
│   ├── src/                 # 核心脚本
│   └── app.py               # Streamlit 界面
│
├── cad/                     # CAD 脚本
│   └── *.lsp                # LISP 脚本
│
├── README.md                # 本文件
└── INDEX.md                 # （已合并到本文件）
```

---

## 工具详情

### risk_data 脚本列表

#### 1.x 系列 - 数据库

| 脚本 | 功能 |
|------|------|
| `1.1_database_protection_area.py` | 保护片信息 |
| `1.2_database_dike_section.py` | 堤段信息 |
| `1.3_database_dike.py` | 堤防信息 |
| `1.4_database_river_centerline.py` | 河流中心线 |

#### 2.x 系列 - 预报

| 脚本 | 功能 |
|------|------|
| `2.1_forecast_cross_section.py` | 断面信息 |

#### 3.x 系列 - 风险分析

| 脚本 | 功能 |
|------|------|
| `3.01_risk_protection_info.py` | 保护片信息 |
| `3.02_risk_protection_region.py` | 保护片行政区域 |
| `3.03_risk_protection_dike_relation.py` | 保护片堤段关系 |
| `3.04_risk_dike_section_info.py` | 堤段信息 |
| `3.05_risk_elevation_relation.py` | 高程关系 |
| `3.06_risk_section_mileage.py` | 断面里程 |
| `3.07_risk_dike_info.py` | 堤防信息 |
| `3.08_risk_dike_profile.py` | 堤防剖面 |
| `3.09_risk_facilities.py` | 风险体信息 |

### QGIS 脚本列表

| 步骤 | 脚本 | 功能 |
|------|------|------|
| 1 | `01_generate_river_points.py` | 生成河段中心点 |
| 2 | `01.5_assign_lc_to_cross_sections.py` | 断面LC赋值 |
| 3 | `02_cut_dike_sections.py` | 切割堤防 |
| 4 | `03_assign_elevation_to_dike.py` | 堤段赋值高程 |
| 5 | `04_align_dike_fields.py` | 对齐堤段字段 |
| ... | ... | ... |

---

## 公共库

所有项目使用 `~/useful_scripts/lib/` 下的公共模块：

```python
import sys
from pathlib import Path

# 添加公共库路径
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "lib"))

# 导入公共模块
from hydraulic import ...        # 水利领域模块
from excel_ops import ...        # Excel 操作
from core.docx_core import ...   # 文档处理
```

---

## 配置说明

### 环境变量

```bash
# Python 路径
export PYTHON_PATH="/Users/tianli/miniforge3/bin/python3"

# 项目根目录
export PROJECTS_ROOT="~/useful_scripts/projects"
```

### 数据目录规范

每个项目的数据目录结构：
```
data/
├── input/      # 输入数据
├── output/     # 输出结果
└── sample/     # 示例文件
```

---

## 项目元数据

每个项目需要有 `_project.yaml` 文件，包含：
- 项目名称
- 功能描述
- 入口文件
- 依赖项
- 维护者

---

**版本**: 2.0.0
**更新时间**: 2026-03-02
**维护者**: tianli
