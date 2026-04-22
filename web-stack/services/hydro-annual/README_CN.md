# hydro-annual

[English](README.md) | **中文**

浙江省水资源年报数据查询与导出工具，涵盖 2019—2024 年。

[![在线演示](https://img.shields.io/badge/在线演示-hydro--annual.tianlizeng.cloud-blue?style=for-the-badge)](https://hydro-annual.tianlizeng.cloud)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9+-yellow?style=for-the-badge)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

### 无需安装，立即体验

**https://hydro-annual.tianlizeng.cloud**

---

![hydro-annual demo](docs/screenshots/demo.png)

---

## 功能一览

| 功能 | 说明 |
|------|------|
| **多年数据** | 浏览 2019—2024 年水资源数据 |
| **地市筛选** | 按浙江各地级市过滤 |
| **报告类别** | 选择特定报告类别精准查询 |
| **导出 Excel / CSV** | 以您偏好的格式下载过滤结果 |
| **内置数据集** | 无需上传文件，数据已内嵌 |

## 安装

```bash
git clone https://github.com/zengtianli/hydro-annual.git
cd hydro-annual
pip install -r requirements.txt
```

## 快速开始

```bash
streamlit run app.py
```

## 自托管

```bash
git clone https://github.com/zengtianli/hydro-annual.git
cd hydro-annual
pip install -r requirements.txt
streamlit run app.py
```

或直接使用托管版本：**https://hydro-annual.tianlizeng.cloud**

## 环境要求

- Python 3.9+
- Streamlit 1.36+

## License

MIT
