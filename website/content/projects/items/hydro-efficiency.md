---
title: "工业园区水效评估系统"
slug: "hydro-efficiency"
role: "独立开发"
tags: ["AHP-CRITIC组合赋权", "TOPSIS综合评价", "Streamlit", "Tauri"]
period: "2024-2025"
category: "节水评价"
highlight: true
featured: true
thumbnail: "/images/projects/water-consumption-cover.png"
brief: "基于 AHP+CRITIC 组合赋权与 TOPSIS 排名的工业集聚区水效评估工具，支持园区-管线-企业三级评估体系。"
tracks:
  hydro:
    highlight: true
    featured: true
  ai:
    brief: "AHP-CRITIC 组合赋权 + TOPSIS 多准则决策算法的工程化实现。"
    highlight: false
  indie:
    brief: "独立开发的节水评估 SaaS 产品，Web + 桌面双端交付。"
    highlight: true
---

## 背景

工业集聚区水效评估是节水型社会建设的重要环节。传统评估依赖人工打分，主观性强、可比性差。本项目构建了一套客观量化的评估方法，将 AHP 主观赋权与 CRITIC 客观赋权有机结合，通过 TOPSIS 模型输出综合排名，为园区节水管理提供数据支撑。

## 核心功能

- **三级评估体系**：园区整体 → 管线分区 → 企业逐户，层层穿透
- **AHP + CRITIC 组合赋权**：通过可调 α 参数灵活配置主客观权重比例
- **TOPSIS 综合排名**：企业综合得分与等级分类，结果清晰可比
- **自定义指标体系**：支持用户根据实际需求增减评估指标
- **数据可视化**：交互式图表直观呈现评估结果
- **Excel 模板导出**：下载空白模板，填入自有数据即可使用

## 技术栈

- **Web 版**：Streamlit 快速搭建交互界面
- **桌面版**：Tauri 封装，支持离线使用
- **计算引擎**：Python（Pandas、NumPy）

## 在线体验

[hydro-efficiency.tianlizeng.cloud](https://hydro-efficiency.tianlizeng.cloud)

## 源代码

[GitHub](https://github.com/zengtianli/hydro-efficiency)
