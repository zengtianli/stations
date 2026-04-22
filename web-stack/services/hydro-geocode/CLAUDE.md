# hydro-geocode — 高德 API 驱动的批量地理编码工具

## Quick Reference

| 项目 | 路径/值 |
|------|---------|
| 入口 | `api.py` (FastAPI，`tlz-api@hydro-geocode.service` 拉起) |
| 启动脚本 | `run.py` |
| 线上地址 | https://hydro-geocode.tianlizeng.cloud |
| 数据目录 | `data/input/` → `data/output/` |
| 凭证 | `~/.personal_env` → `AMAP_API_KEY` |

## 常用命令

```bash
cd ~/Dev/stations/web-stack/services/hydro-geocode

# 本地运行
uv run uvicorn api:app --host 127.0.0.1 --port 8617 --reload

# 或用封装脚本
python3 run.py

# 批量公司地址搜索（CLI 模式）
python3 batch_company_geocode.py
```

## 项目结构

| 路径 | 说明 |
|------|------|
| `api.py` | FastAPI 入口（/api/health, /api/meta, /api/compute） |
| `src/geocode_by_address.py` | 正向地理编码（地址 → 坐标） |
| `src/reverse_geocode.py` | 逆地理编码（坐标 → 地址） |
| `src/search_by_company.py` | POI 企业名称搜索 |
| `src/compare_results.py` | 结果对比工具 |
| `batch_company_geocode.py` | 批量公司搜索（独立脚本） |
| `data/sample/` | 示例 Excel/CSV 文件 |

## 功能说明

- **正向地理编码**：地址文本 → WGS-84 / GCJ-02 坐标
- **逆地理编码**：坐标 → 格式化地址
- **POI 企业搜索**：按公司名 + 城市查找位置
- **坐标系转换**：WGS-84 ↔ GCJ-02 ↔ BD-09
- **批量处理**：上传 Excel/CSV，下载带结果的表格

## 凭证

高德 API Key 存放在 `~/.personal_env`，变量名 `AMAP_API_KEY`，代码通过 `os.environ` 读取，无需手动传入。
