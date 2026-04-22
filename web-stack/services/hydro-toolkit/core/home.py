"""Hydro Toolkit 首页 — 自动从已安装插件生成工具概览"""
import streamlit as st
from core.plugin_loader import discover_plugins

st.title("🌊 水利计算工具集 Hydro Toolkit")
st.caption("面向水利专业人员的在线计算平台")

st.markdown(
    '<div style="text-align:center;color:gray;font-size:13px;margin-bottom:1rem;">'
    '⭐ <a href="https://github.com/zengtianli/hydro-toolkit" target="_blank">Star on GitHub</a> · '
    '👤 <a href="https://github.com/zengtianli" target="_blank">Tianli Zeng</a> · '
    '📄 <a href="https://dockit.tianlizeng.cloud" target="_blank">DocKit — 文档工具箱</a>'
    '</div>',
    unsafe_allow_html=True,
)

st.markdown("---")

plugins = discover_plugins()

if plugins:
    st.markdown("### 工具总览\n\n从 **左侧导航栏** 选择工具开始使用。每个工具均内置示例数据，打开即可体验。")
    cols = st.columns(3)
    for i, p in enumerate(plugins):
        with cols[i % 3]:
            st.markdown(
                f'<div style="border:1px solid #e0e0e0;border-radius:10px;padding:16px;margin-bottom:12px;min-height:140px;">'
                f'<h3>{p.icon} {p.title}</h3>'
                f'<p>{p.description}</p>'
                f'<p style="font-size:12px;color:gray;">v{p.version}</p>'
                f'</div>',
                unsafe_allow_html=True,
            )
else:
    st.info("暂无已安装的插件。前往左侧 **插件管理** 页面添加。")

st.markdown("---")
st.markdown("""
### 快速开始

1. 从左侧导航栏 **选择工具**
2. **上传数据** 或使用内置示例数据
3. **运行计算** 并下载结果

所有工具均内置示例数据，**打开即用，零门槛体验**。
""")

st.markdown("---")
st.markdown(
    '<div style="text-align:center;color:gray;font-size:13px;">'
    'Open Source · '
    '⭐ <a href="https://github.com/zengtianli/hydro-toolkit" target="_blank">Star on GitHub</a> · '
    'Built by <a href="https://github.com/zengtianli" target="_blank">Tianli Zeng</a>'
    '</div>',
    unsafe_allow_html=True,
)
