# hydro-geocode

**English** | [中文](README_CN.md)

Batch geocoding tool powered by Amap API — forward/reverse geocoding and POI company search.

[![Live Demo](https://img.shields.io/badge/Live_Demo-hydro--geocode.tianlizeng.cloud-blue?style=for-the-badge)](https://hydro-geocode.tianlizeng.cloud)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9+-yellow?style=for-the-badge)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

### Try it now — no install needed

**https://hydro-geocode.tianlizeng.cloud**

---

![hydro-geocode demo](docs/screenshots/demo.png)

---

## What can hydro-geocode do?

| Feature | Description |
|---------|-------------|
| **Forward geocoding** | Address text → WGS-84 / GCJ-02 coordinates |
| **Reverse geocoding** | Coordinates → formatted address |
| **POI search** | Find company locations by name and city |
| **Coordinate conversion** | WGS-84 ↔ GCJ-02 ↔ BD-09 system conversion |
| **Batch via Excel/CSV** | Upload spreadsheet, download enriched results |

## Install

```bash
git clone https://github.com/zengtianli/hydro-geocode.git
cd hydro-geocode
pip install -r requirements.txt
```

## Quick Start

```bash
streamlit run app.py
```

## Self-host

```bash
git clone https://github.com/zengtianli/hydro-geocode.git
cd hydro-geocode
pip install -r requirements.txt
streamlit run app.py
```

Or use the hosted version: **https://hydro-geocode.tianlizeng.cloud**

## Requirements

- Python 3.9+
- Streamlit 1.36+

## License

MIT
