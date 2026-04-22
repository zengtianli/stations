---
description: "VPS 代理完整指南：PureVoltage VPS + VLESS Reality + Marzban 面板 + Shadowrocket 客户端 + 网络优化"
tags: [VPS, VLESS, Reality, Marzban, Shadowrocket, 代理, 网络优化]
---

# VPS 代理完整指南

> 日期：2026-03-09 | 最后更新：2026-03-10

---

## 一、VPS 信息与架构

### 服务器信息

| 项目 | 值 |
|------|-----|
| 服务商 | PureVoltage |
| IP | 104.218.100.67 |
| 系统 | Ubuntu 22.04 LTS |
| CPU | AMD EPYC 7742, 4 核 |
| 内存 | 8GB |
| 硬盘 | 100GB |
| 流量 | 500G/月（普通线路） |
| 已安装 | Marzban（Docker）+ Xray 24.12.31 |
| 代理协议 | VLESS + Reality（443 端口）、Shadowsocks（1080 端口） |
| 面板端口 | 8000（仅 localhost） |
| 面板账号 | tianli / tl888888 |

### 整体架构

```
你的设备（Mac/iPhone）
    ↓ Shadowrocket 连接
VPS 服务器（美国 104.218.100.67:443）
    ↓ Xray 内核处理 VLESS Reality 协议
    ↓ 解密你的请求
目标网站（Google、YouTube 等）
```

**防火墙看到的**：你在访问 www.microsoft.com（Reality 伪装）
**实际上**：你的流量通过 VPS 转发到目标网站

---

## 二、搭建流程

### 技术选型

| 方案 | 需要域名 | 需要证书 | 伪装能力 | 性能 |
|------|---------|---------|---------|------|
| **VLESS + Reality** | ❌ | ❌ | 最强（伪装真实 TLS） | 最好 |
| VLESS + TLS + WS | ✅ | ✅ | 强 | 好 |
| Trojan | ✅ | ✅ | 强 | 好 |
| VMess + WS + TLS | ✅ | ✅ | 一般 | 一般 |

### 步骤 1：SSH 免密登录

```bash
ssh-keygen -t ed25519 -C "tianli" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
# 在服务器上添加公钥
mkdir -p ~/.ssh && echo "公钥内容" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys
```

### 步骤 2：安装 Docker + Marzban

```bash
# Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

# Marzban
sudo bash -c "$(curl -sL https://github.com/Gozargah/Marzban-scripts/raw/master/marzban.sh)" @ install
```

安装后目录结构：
```
/opt/marzban/
├── docker-compose.yml
└── .env                  ← SUDO_USERNAME/PASSWORD

/var/lib/marzban/
├── xray_config.json      ← Xray 代理配置
└── db.sqlite3            ← 用户数据库
```

### 步骤 3：配置 VLESS Reality

```bash
# 生成 Reality 密钥对
docker exec marzban-marzban-1 xray x25519
```

修改 `/var/lib/marzban/xray_config.json`，在 `inbounds` 中添加 VLESS Reality 配置（port 443，dest `www.microsoft.com:443`）。

```bash
cd /opt/marzban && docker compose restart
ss -tlnp | grep 443  # 验证
```

### 步骤 4：创建用户

```bash
# 获取 token
TOKEN=$(curl -s -X POST 'http://127.0.0.1:8000/api/admin/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=tianli&password=tl888888' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# 创建用户
curl -s -X POST 'http://127.0.0.1:8000/api/user' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"username":"用户名","proxies":{"vless":{"flow":"xtls-rprx-vision"}},"inbounds":{"vless":["VLESS Reality"]},"data_limit":0,"expire":0,"status":"active"}'
```

---

## 三、Shadowrocket 客户端

### 从 Clash 迁移

| 项目 | 值 |
|------|-----|
| 进程名 | MacPacketTunnel |
| HTTP 代理端口 | 7890（和 Clash 一致） |
| 监听地址 | 127.0.0.1:7890 + 172.21.15.58:7890 |
| 系统代理 | 未开启，终端靠环境变量走代理 |

### 核心概念

```
Shadowrocket
├── 订阅（提供节点）
│   ├── 闪电订阅 → 一堆节点
│   ├── 韩国 VMess → 韩国节点
│   └── VPS 自建 → 美国节点
└── 配置文件（提供规则）→ 对所有订阅统一生效
    └── default.conf → 规则列表
```

**配置文件和订阅是分开的**：规则全局生效，不管用哪个订阅。

### 规则类型

| 规则类型 | 含义 | 例子 |
|----------|------|------|
| `DOMAIN-SUFFIX` | 匹配域名后缀 | `DOMAIN-SUFFIX,mmkg.cloud,DIRECT` |
| `DOMAIN-KEYWORD` | 域名包含关键词 | `DOMAIN-KEYWORD,mmkg,DIRECT` |
| `GEOIP,CN` | 中国 IP 地址 | `GEOIP,CN,DIRECT` |
| `FINAL` | 兜底规则 | `FINAL,PROXY` |

### 终端代理配置

配置文件：`~/Documents/sync/shell/config/tools/proxy.zsh`

```bash
export http_proxy="http://127.0.0.1:7890"
export https_proxy="http://127.0.0.1:7890"
export all_proxy="socks5://127.0.0.1:7890"

proxy-on   # 开启代理
proxy-off  # 关闭代理
```

---

## 四、网络优化（2026-03-10 已执行）

### 优化项

| 参数 | 优化前 | 优化后 | 作用 |
|------|--------|--------|------|
| tcp_congestion_control | cubic | **bbr** | 拥塞控制算法 |
| default_qdisc | fq_codel | **fq** | 队列调度器（配合 BBR） |
| rmem_max / wmem_max | 208KB | **32MB** | 收发缓冲区上限 |
| tcp_fastopen | 1 | **3** | TCP 快速打开（客户端+服务端） |
| tcp_mtu_probing | 0 | **1** | MTU 自动探测 |

### 验证

```bash
sysctl net.ipv4.tcp_congestion_control    # 应显示 bbr
lsmod | grep bbr                          # 应显示 tcp_bbr
```

### 回滚

```bash
cp /etc/sysctl.conf.bak.20260310 /etc/sysctl.conf && sysctl -p
```

---

## 五、日常维护

### 访问管理面板

```bash
ssh -L 8000:localhost:8000 root@104.218.100.67
# 浏览器打开 http://127.0.0.1:8000/dashboard/
# 账号：tianli / tl888888
```

### 常用命令

```bash
cd /opt/marzban
docker compose ps          # 查看状态
docker compose logs -f --tail 50  # 查看日志
docker compose restart     # 重启
docker compose pull && docker compose up -d  # 更新
```

---

## 六、知识科普

### 线路类型

| 线路 | 特点 | 价格 |
|------|------|------|
| 普通线路 | 便宜，高峰期可能卡 | 低 |
| CN2 GT | 电信次优 | 中 |
| CN2 GIA | 三网最优，低延迟 | 高 |

### BBR vs Cubic

```
cubic：速度 → 丢包 → 砍半 → 慢慢恢复 → 丢包 → 砍半（锯齿形）
BBR：  速度 → 持续测量实际带宽 → 平稳运行（平滑曲线）
```

BBR 不看丢包，只看实际带宽和最低延迟，国际线路上效果显著。

---

## 七、待解决

- [ ] **修复 SSH 连接问题**：密钥交换阶段被服务器关闭，待排查 MaxStartups / fail2ban / 防火墙
- 临时方案：通过 VPS 面板 Console（VNC）登录操作
