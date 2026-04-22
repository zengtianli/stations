---
description: "QGIS空间数据处理工具完整指南，包含点提取、蒙版生成、地图出图等三个工具脚本的详细使用方法"
tags: [QGIS, 空间数据处理, 地理信息系统, Python脚本, 地图制作]
---

# QGIS 工具脚本 - 完整使用指南

> 📦 QGIS 空间数据处理工具集 - 点提取、蒙版生成、地图出图

---

## 目录

- [工具概述](#工具概述)
- [快速入门](#快速入门)
- [工具1: 点在面内提取](#工具1-点在面内提取)
- [工具2: 蒙版图层生成](#工具2-蒙版图层生成)
- [工具3: 地图出图](#工具3-地图出图)
- [典型工作流程](#典型工作流程)
- [常见问题](#常见问题)

---

## 工具概述

你现在有3个强大的QGIS工具脚本：

| 脚本 | 功能 | 使用场景 |
|------|------|----------|
| **11_extract_points_in_polygons.py** | 点在面内提取 | 筛选区域内的点数据 |
| **12_create_mask_layers.py** | 蒙版图层生成 | 突出显示特定区域 |
| **13_export_map_layout.py** | 地图出图 | 导出专业地图（含图例、比例尺、指北针） |

---

## 快速入门

### 典型工作流程：制作景宁县区域分析地图

#### 第1步：数据准备
```
在QGIS中加载：
• jingning（景宁县边界）
• RSAA（采样点数据）
• 底图（卫星影像或地形图）
```

#### 第2步：提取区域内的点
```python
# 运行脚本11：提取景宁县内的RSAA点
# 配置：POINT_LAYER = "RSAA", POLYGON_LAYER = "jingning"
exec(open('~/useful_scripts/projects/qgis/11_extract_points_in_polygons.py').read())

结果：得到 points_in_polygons 图层（景宁县内的点）
```

#### 第3步：创建蒙版突出显示
```python
# 运行脚本12：创建蒙版，突出显示景宁县
# 配置：INNER_LAYER = "jingning", OUTER_LAYER = "all"
exec(open('~/useful_scripts/projects/qgis/12_create_mask_layers.py').read())

结果：景宁县透明度50%（清晰），其他区域透明度10%（模糊）
```

#### 第4步：导出专业地图
```python
# 调整QGIS视图到合适位置
# 运行脚本13：导出地图
# 配置：MAP_TITLE = "景宁县RSAA采样点分布图"
exec(open('~/useful_scripts/projects/qgis/13_export_map_layout.py').read())

结果：桌面生成高质量地图（包含图例、比例尺、指北针）
```

---

## 工具1: 点在面内提取

### 📌 功能说明

提取点图层A中落在面图层B内部的所有点，生成新的点图层。

### 🚀 快速使用

#### 方法1：在QGIS Python控制台运行（推荐）

1. **打开QGIS，加载你的点图层和面图层**

2. **修改脚本配置**（重要！）

   打开 `11_extract_points_in_polygons.py`，修改这几行：

   ```python
   # 改成你在QGIS中的实际图层名称
   POINT_LAYER = "你的点图层名称"        # 例如: "monitoring_points"
   POLYGON_LAYER = "你的面图层名称"      # 例如: "study_area"
   OUTPUT_LAYER_NAME = "输出图层名称"    # 例如: "filtered_points"

   # 是否需要继承面图层的属性
   INHERIT_ATTRIBUTES = False           # True=继承, False=不继承
   ```

3. **在QGIS Python控制台运行**

   打开 QGIS → 插件 → Python控制台，粘贴以下代码：

   ```python
   exec(open('~/useful_scripts/projects/qgis/11_extract_points_in_polygons.py').read())
   ```

4. **查看结果**

   - 输出图层会自动出现在 **process** 组中
   - 输入图层会自动移到 **input** 组中

#### 方法2：从终端运行

```bash
cd ~/useful_scripts/projects/qgis
./run_11.sh
```

### ⚙️ 配置选项详解

#### 1. 基础配置

```python
POINT_LAYER = "points"          # 点图层名称（必须修改）
POLYGON_LAYER = "polygons"      # 面图层名称（必须修改）
OUTPUT_LAYER_NAME = "result"    # 输出图层名称
```

#### 2. 是否继承面图层属性

```python
INHERIT_ATTRIBUTES = False
```

- **False（默认）**：输出点只保留原点图层的属性
  - 速度快
  - 适合只需要筛选点的场景

- **True**：输出点会继承所在面的所有属性
  - 面图层的字段会添加 `poly_` 前缀
  - 例如：面图层有字段 `name`，输出点会有字段 `poly_name`
  - 适合需要知道点属于哪个面的场景

#### 3. 空间关系类型

```python
SPATIAL_PREDICATE = [0]  # 默认：相交(intersects)
```

可选值：
- `[0]` - **相交(intersects)**：点与面有任何重叠（推荐）
- `[6]` - **包含(within)**：点必须完全在面内部（更严格）
- `[0, 6]` - 同时满足多个条件

### 💡 实际应用场景

#### 场景1：提取研究区域内的采样点

```python
POINT_LAYER = "all_sampling_points"    # 所有采样点
POLYGON_LAYER = "study_area"           # 研究区域边界
OUTPUT_LAYER_NAME = "sampling_in_area"
INHERIT_ATTRIBUTES = False
```

**结果**：得到研究区域内的所有采样点

#### 场景2：统计每个县的POI数量（需要县名）

```python
POINT_LAYER = "city_poi"               # 全市POI
POLYGON_LAYER = "county_boundaries"    # 县界（包含县名字段）
OUTPUT_LAYER_NAME = "poi_with_county"
INHERIT_ATTRIBUTES = True              # 继承县名
```

**结果**：每个POI点会带上 `poly_县名` 字段，可以后续统计

#### 场景3：提取保护区内的监测点

```python
POINT_LAYER = "monitoring_stations"    # 监测站点
POLYGON_LAYER = "protected_zones"      # 保护区范围
OUTPUT_LAYER_NAME = "stations_in_zones"
INHERIT_ATTRIBUTES = True              # 继承保护区信息
```

**结果**：监测点带上保护区编号、等级等信息

---

## 工具2: 蒙版图层生成

### 📌 功能说明

创建差异化透明度的白色蒙版，实现区域内外不同的视觉效果。适合地图可视化中突出显示特定区域。

### 🎯 效果示例

**当 OUTER_LAYER = "all" 时（推荐）：**

```
┌────────────────────────────────────────────┐
│  整个地图范围 (白色10%透明 - 几乎不透明) │
│                                            │
│    ┌───────────────────────┐               │
│    │  Jingning             │               │
│    │  (白色50%透明)        │               │
│    │  ← 这里更透明         │               │
│    │     底图更清晰        │               │
│    └───────────────────────┘               │
│                                            │
│  ← 地图其他所有区域都被白色蒙版遮挡       │
│                                            │
└────────────────────────────────────────────┘
```

**视觉效果**：
- ✨ Jingning区域：透明度高，底图清晰可见（关注区域）
- 🔲 其他区域：透明度低，底图被遮挡（背景区域）
- 💡 使用 "all" 可以覆盖整个地图，不受图层范围限制

### 🚀 快速使用

#### 1. 在QGIS中加载图层

确保你已经加载了：
- `jingning` - 内部区域（景宁县）
- **可选**：`county` - 外部区域（如果想限制在特定范围）
- **推荐**：使用 `OUTER_LAYER = "all"` - 自动使用整个地图画布范围

#### 2. （可选）修改配置

打开 `12_create_mask_layers.py`，可以修改：

```python
# 图层名称
INNER_LAYER = "jingning"        # 内部区域（你的实际图层名）
OUTER_LAYER = "all"             # 外部区域设置：
                                # "all" = 整个地图画布范围（推荐！）
                                # 或指定具体图层名如 "county"

# 透明度设置 (0-100)
INNER_OPACITY = 50              # 内部区域透明度（默认50%）
OUTER_OPACITY = 10              # 外部区域透明度（默认10%）

# 蒙版颜色
MASK_COLOR = (255, 255, 255)    # 白色，也可以改为黑色 (0, 0, 0)
```

**💡 关于 OUTER_LAYER 的选择：**

- **`OUTER_LAYER = "all"`**（推荐）
  - ✅ 覆盖整个地图画布，不受任何图层范围限制
  - ✅ 效果最好，jingning 以外的所有区域都被蒙版覆盖
  - ✅ 不需要额外加载图层

- **`OUTER_LAYER = "county"`**（指定图层）
  - ⚠️  只覆盖 county 图层的范围
  - ⚠️  如果 county 范围较小，县外区域不会被蒙版
  - ✅ 适合需要精确控制蒙版范围的情况

#### 3. 运行脚本

**方法1：在QGIS Python控制台（推荐）**

```python
exec(open('~/useful_scripts/projects/qgis/12_create_mask_layers.py').read())
```

**方法2：从终端运行**

```bash
cd ~/useful_scripts/projects/qgis
./run_12.sh
```

#### 4. 查看结果

生成的图层会自动出现在 **mask_layers** 组中：
- `jingning_mask` - 透明度50%
- `county_excluding_jingning_mask` - 透明度10%

**重要**：确保你的底图（如卫星影像、地形图等）在蒙版图层**下方**，才能看到蒙版效果。

### ⚙️ 配置参数详解

#### 透明度设置

```python
INNER_OPACITY = 50   # 0-100，数值越大越不透明
OUTER_OPACITY = 10   # 0-100，数值越大越不透明
```

**常见配置**：

| 场景 | 内部透明度 | 外部透明度 | 效果 |
|------|-----------|-----------|------|
| **突出内部**（默认） | 50 | 10 | 内部清晰，外部模糊 |
| 强烈对比 | 70 | 5 | 内部非常清晰，外部几乎白色 |
| 温和对比 | 40 | 20 | 对比柔和 |
| 反向突出 | 10 | 50 | 外部清晰，内部模糊 |

#### 颜色设置

```python
MASK_COLOR = (255, 255, 255)  # RGB格式
```

**常用颜色**：
- 白色：`(255, 255, 255)` - 默认，适合深色底图
- 黑色：`(0, 0, 0)` - 适合浅色底图
- 灰色：`(128, 128, 128)` - 中性色调
- 蓝色：`(173, 216, 230)` - 淡蓝色蒙版

---

## 工具3: 地图出图

### 📌 功能说明

自动创建专业的地图布局，包含：
- ✅ 地图主体
- ✅ 图例（Legend）
- ✅ 比例尺（Scale Bar）
- ✅ 指北针（North Arrow）
- ✅ 标题
- ✅ 日期和制图信息

一键导出高质量地图（PNG/PDF/JPG）。

### 🚀 快速使用

#### 1. 在QGIS中准备地图

1. **调整地图视图**
   - 缩放、平移到你想要的区域
   - 打开/关闭需要显示的图层
   - 调整图层顺序和样式

2. **确认当前视图**
   - 脚本会使用当前QGIS画布的视图范围
   - 所有可见图层都会包含在输出中

#### 2. 修改配置（可选）

打开 `13_export_map_layout.py`，修改配置：

```python
# 地图标题
MAP_TITLE = "景宁县区域分析图"  # 改成你的标题

# 输出设置
OUTPUT_DIR = Path.home() / "Desktop"  # 保存位置（默认桌面）
OUTPUT_FILENAME = "map_export"        # 文件名
OUTPUT_FORMAT = "png"                 # 格式: png/pdf/jpg

# 页面设置
PAGE_SIZE = "A3"                      # A4/A3/A2/A1/A0
ORIENTATION = "landscape"             # landscape横向/portrait纵向
DPI = 300                             # 分辨率（打印用300）
```

#### 3. 运行脚本

**方法1：在QGIS Python控制台（推荐）**

```python
exec(open('~/useful_scripts/projects/qgis/13_export_map_layout.py').read())
```

**方法2：从终端运行**

```bash
cd ~/useful_scripts/projects/qgis
./run_13.sh
```

#### 4. 查看结果

- 文件自动保存到桌面（或指定路径）
- 文件名格式：`map_export_20251125_143052.png`（包含时间戳）
- 脚本执行完会弹窗显示文件路径，可直接打开

### ⚙️ 配置参数详解

#### 标题设置

```python
MAP_TITLE = "景宁县区域分析图"       # 主标题
MAP_SUBTITLE = "2024年数据分析"      # 副标题（可选）
```

#### 输出设置

```python
OUTPUT_DIR = Path.home() / "Desktop"           # 保存位置
OUTPUT_DIR = Path("/Users/tianli/Documents")   # 也可以指定绝对路径

OUTPUT_FILENAME = "jingning_map"               # 文件名（不含扩展名）
OUTPUT_FORMAT = "png"                          # 格式
```

**支持的格式**：
- `png` - PNG图片（推荐，支持透明背景）
- `pdf` - PDF文档（矢量图，可无损缩放）
- `jpg` - JPEG图片（文件小，但有损压缩）

#### 页面设置

```python
PAGE_SIZE = "A3"         # 页面大小
ORIENTATION = "landscape" # 页面方向
```

**标准页面尺寸**：

| 尺寸 | 横向 (mm) | 纵向 (mm) | 适用场景 |
|------|-----------|-----------|----------|
| A4 | 297×210 | 210×297 | 报告、论文 |
| A3 | 420×297 | 297×420 | 海报、展板 |
| A2 | 594×420 | 420×594 | 大型展板 |
| A1 | 841×594 | 594×841 | 工程图纸 |
| A0 | 1189×841 | 841×1189 | 特大海报 |

**方向选择**：
- `landscape` - 横向（宽>高，推荐）
- `portrait` - 纵向（高>宽）

#### 分辨率设置

```python
DPI = 300  # 每英寸点数
```

**DPI建议**：
- **72-96 DPI** - 屏幕显示、网页
- **150 DPI** - 快速预览、草稿
- **300 DPI** - 打印输出（推荐）
- **600 DPI** - 高质量打印、出版

#### 元素开关

```python
SHOW_LEGEND = True        # 显示图例
SHOW_SCALE_BAR = True     # 显示比例尺
SHOW_NORTH_ARROW = True   # 显示指北针
SHOW_DATE = True          # 显示日期
SHOW_CREDITS = True       # 显示制图信息
```

### 🎨 布局说明

脚本自动生成的布局结构：

```
┌────────────────────────────────────────────────┐
│                 [标题]                         │
├───────────────────────────────┬────────────────┤
│                               │                │
│                               │   [图例]       │
│         [地图主体]            │                │
│                               │                │
│                               │                │
│  [比例尺]          [指北针]   │                │
├───────────────────────────────┴────────────────┤
│ [日期]                         [制图信息]      │
└────────────────────────────────────────────────┘
```

---

## 典型工作流程

### 组合1：研究区域数据展示

```
步骤1：提取区域内的数据点 (脚本11)
步骤2：创建蒙版突出研究区 (脚本12)
步骤3：导出专业地图 (脚本13)
```

### 组合2：多区域对比

```
运行脚本11多次，提取不同区域的点
每个区域用不同颜色标注
运行脚本13导出对比图
```

### 组合3：快速出图（不需要点数据）

```
直接运行脚本13
无需脚本11和12
适合已有完整数据的情况
```

---

## 常见问题

### Q1: 找不到图层

```
✅ 确认QGIS中已加载该图层
✅ 检查图层名称拼写（大小写敏感）
✅ 运行配置检查工具查看可用图层
```

### Q2: 提取的点数为0

**可能原因**：
1. 点和面没有空间重叠
2. 坐标系不一致（脚本会自动重投影，但检查一下）
3. 使用了 `within` 而点在边界上

**解决**：
- 检查点和面是否真的有重叠（在QGIS中目视检查）
- 尝试改为 `SPATIAL_PREDICATE = [0]`（相交）

### Q3: 蒙版效果不明显

**解决**：调整透明度参数
```python
INNER_OPACITY = 70   # 增加内部透明度
OUTER_OPACITY = 5    # 降低外部透明度
```

### Q4: 地图范围不对

**原因**：脚本使用当前QGIS画布的视图范围

**解决**：运行脚本前，在QGIS中调整好地图视图

### Q5: 图例太长，遮挡地图

**原因**：图层太多或图层名称太长

**解决**：
1. 关闭不需要显示的图层
2. 重命名图层，使用简短名称
3. 改用更大的页面尺寸（如A3→A2）

---

## 文件结构

```
qgis/
├── 11_extract_points_in_polygons.py  # 点在面内提取
├── 11_check_config.py                # 配置检查
├── run_11.sh                         # 快速运行
│
├── 12_create_mask_layers.py          # 蒙版生成
├── 12_check_mask_config.py           # 配置检查
├── run_12.sh                         # 快速运行
│
├── 13_export_map_layout.py           # 地图出图
├── run_13.sh                         # 快速运行
│
├── qgis_util.py                      # 工具函数库
│
└── README.md                         # 本文件
```

---

## 使用技巧

### 1. 在QGIS Python控制台运行

```python
# 方法1：直接执行（推荐）
exec(open('~/useful_scripts/projects/qgis/13_export_map_layout.py').read())

# 方法2：使用Path（更安全）
from pathlib import Path
script = Path('~/useful_scripts/projects/qgis/13_export_map_layout.py')
exec(compile(script.read_text(), script.name, 'exec'))
```

### 2. 从终端运行

```bash
cd ~/useful_scripts/projects/qgis
./run_11.sh  # 运行脚本11
./run_12.sh  # 运行脚本12
./run_13.sh  # 运行脚本13
```

### 3. 快速修改配置

打开脚本，找到 `# ============ 配置参数 ============` 部分，修改参数后保存即可。

---

## 最佳实践

1. ✅ **运行前检查**：使用配置检查工具验证设置
2. ✅ **保存项目**：重要工作记得保存QGIS项目
3. ✅ **命名规范**：图层用英文命名，避免特殊字符
4. ✅ **视图调整**：脚本13运行前先调整好地图视图
5. ✅ **分步执行**：复杂任务分步骤进行，便于调试

---

**版本**: 1.0.0
**更新时间**: 2026-03-02
**维护者**: tianli
