# hydro-reservoir

**English** | [中文](README_CN.md)

Cascade reservoir hydropower scheduling optimizer with interactive Plotly charts.

[![Live Demo](https://img.shields.io/badge/Live_Demo-hydro--reservoir.tianlizeng.cloud-blue?style=for-the-badge)](https://hydro-reservoir.tianlizeng.cloud)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9+-yellow?style=for-the-badge)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

### Try it now — no install needed

**https://hydro-reservoir.tianlizeng.cloud**

---

![hydro-reservoir demo](docs/screenshots/demo.png)

---

## What can hydro-reservoir do?

| Feature | Description |
|---------|-------------|
| **Cascade scheduling** | Joint optimization across multiple reservoirs in series |
| **Flexible time step** | Daily, 10-day, or monthly calculation intervals |
| **Interactive charts** | Plotly visualizations of water levels, flow, and power output |
| **Parameter preview** | Inspect reservoir parameters before running optimization |
| **Excel I/O** | Upload input workbooks and download scheduling results |

## Install

```bash
git clone https://github.com/zengtianli/hydro-reservoir.git
cd hydro-reservoir
pip install -r requirements.txt
```

## Quick Start

```bash
streamlit run app.py
```

## Self-host

```bash
git clone https://github.com/zengtianli/hydro-reservoir.git
cd hydro-reservoir
pip install -r requirements.txt
streamlit run app.py
```

Or use the hosted version: **https://hydro-reservoir.tianlizeng.cloud**

## Requirements

- Python 3.9+
- Streamlit 1.36+

## License

MIT
