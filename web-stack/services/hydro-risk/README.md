# hydro-risk

**English** | [中文](README_CN.md)

3-phase ETL pipeline that converts GeoJSON hydrological data into structured Excel risk assessment workbooks.

[![Python 3.9+](https://img.shields.io/badge/Python-3.9+-yellow?style=for-the-badge)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

![hydro-risk demo](docs/screenshots/demo.png)

---

## What can hydro-risk do?

| Feature | Description |
|---------|-------------|
| **Phase 1 — Database build** | Extract GeoJSON features into normalized base tables |
| **Phase 2 — Forecasting** | Apply hydraulic models to generate forecast data |
| **Phase 3 — Risk analysis** | Compute risk scores and produce 18+ sheet workbooks |
| **14 processing scripts** | Modular pipeline, each step independently runnable |
| **Auto code generation** | Generates lookup codes and normalizes spatial data |

## Install

```bash
git clone https://github.com/zengtianli/hydro-risk.git
cd hydro-risk
pip install -r requirements.txt
```

## Quick Start

```bash
streamlit run app.py
```

## Requirements

- Python 3.9+
- Streamlit 1.36+

## License

MIT
