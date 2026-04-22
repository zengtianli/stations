# hydro-capacity

**English** | [中文](README_CN.md)

Pollution receiving capacity calculator for rivers and reservoirs — multi-scenario, tributary segmentation.

[![Live Demo](https://img.shields.io/badge/Live_Demo-hydro--capacity.tianlizeng.cloud-blue?style=for-the-badge)](https://hydro-capacity.tianlizeng.cloud)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9+-yellow?style=for-the-badge)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

### Try it now — no install needed

**https://hydro-capacity.tianlizeng.cloud**

---

![hydro-capacity demo](docs/screenshots/demo.png)

---

## What can hydro-capacity do?

| Feature | Description |
|---------|-------------|
| **Multi-scheme scenarios** | Model multiple pollution scenarios side-by-side |
| **Tributary segmentation** | Independent parameters per tributary reach |
| **Monthly computation** | Incorporate monthly flow data for seasonal variation |
| **Excel I/O** | Upload parameters, download capacity results |
| **Pre-loaded samples** | Ready-to-run example datasets included |

## Install

```bash
git clone https://github.com/zengtianli/hydro-capacity.git
cd hydro-capacity
pip install -r requirements.txt
```

## Quick Start

```bash
streamlit run app.py
```

## Self-host

```bash
git clone https://github.com/zengtianli/hydro-capacity.git
cd hydro-capacity
pip install -r requirements.txt
streamlit run app.py
```

Or use the hosted version: **https://hydro-capacity.tianlizeng.cloud**

## Requirements

- Python 3.9+
- Streamlit 1.36+

## License

MIT
