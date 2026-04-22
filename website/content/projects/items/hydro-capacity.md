---
title: "河流水库纳污能力计算器"
slug: "hydro-capacity"
role: "独立开发"
tags: ["纳污能力", "河道衰减公式", "Streamlit", "Tauri"]
period: "2024-2025"
category: "水环境管理"
highlight: true
featured: false
thumbnail: "/images/projects/water-capacity-cover.png"
brief: "基于河道衰减公式的纳污能力自动计算工具，支持多方案对比、支流分段与月度统计。"
tracks:
  hydro:
    highlight: true
    featured: false
  ai:
    brief: "河道衰减模型的数值计算 + AI 辅助开发实践，从公式到产品的工程化路径。"
    highlight: false
  devtools:
    brief: "Streamlit → Tauri 跨平台迁移实践，Python 计算引擎的桌面化封装。"
    highlight: false
  indie:
    brief: "独立开发的水利计算 SaaS 工具，从需求分析到交付的完整产品实践。"
    highlight: true
---

## 背景

水环境功能区纳污能力是水环境管理的核心指标。计算涉及多参数河道衰减公式，手工计算繁琐易错。本项目将标准公式封装为交互式工具，实现参数输入即出结果，大幅提升工作效率。

## 核心公式

纳污能力采用河道衰减模型：

**W = 31.536 × b × (Cs - C₀ × e^(-KL/u)) × Q₀**

其中 Cs 为水质标准浓度，C₀ 为上游来水浓度，K 为衰减系数，L 为河段长度，u 为流速，Q₀ 为设计流量。

## 核心功能

- **河道衰减公式自动计算**：输入参数即可得到纳污能力结果
- **多方案对比**：并排模拟多个污染排放场景
- **支流分段计算**：各支流段独立参数配置
- **月度统计**：按月流量数据处理季节性变化
- **Excel 导入导出**：上传参数表，下载计算结果

## 技术栈

- **Web 版**：Streamlit 快速搭建交互界面
- **桌面版**：Tauri 封装，支持离线使用
- **计算引擎**：Python（Pandas、NumPy）

## 在线体验

[hydro-capacity.tianlizeng.cloud](https://hydro-capacity.tianlizeng.cloud)

## 源代码

[GitHub](https://github.com/zengtianli/hydro-capacity)
