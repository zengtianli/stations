# hydro-geocode

[English](README.md) | **中文**

基于高德地图 API 的批量地理编码工具——正/逆向解析与 POI 企业查询。

[![在线演示](https://img.shields.io/badge/在线演示-hydro--geocode.tianlizeng.cloud-blue?style=for-the-badge)](https://hydro-geocode.tianlizeng.cloud)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9+-yellow?style=for-the-badge)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

### 无需安装，立即体验

**https://hydro-geocode.tianlizeng.cloud**

---

![hydro-geocode demo](docs/screenshots/demo.png)

---

## 功能一览

| 功能 | 说明 |
|------|------|
| **正向地理编码** | 地址文本 → WGS-84 / GCJ-02 坐标 |
| **逆向地理编码** | 坐标 → 格式化地址 |
| **POI 企业查询** | 按名称和城市查找企业位置 |
| **坐标系转换** | WGS-84 ↔ GCJ-02 ↔ BD-09 互转 |
| **Excel/CSV 批量处理** | 上传表格，下载带坐标的结果 |

## 安装

```bash
git clone https://github.com/zengtianli/hydro-geocode.git
cd hydro-geocode
pip install -r requirements.txt
```

## 快速开始

```bash
streamlit run app.py
```

## 自托管

```bash
git clone https://github.com/zengtianli/hydro-geocode.git
cd hydro-geocode
pip install -r requirements.txt
streamlit run app.py
```

或直接使用托管版本：**https://hydro-geocode.tianlizeng.cloud**

## 环境要求

- Python 3.9+
- Streamlit 1.36+

## License

MIT
