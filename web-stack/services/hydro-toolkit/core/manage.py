"""插件管理页面 — 安装、更新、卸载插件"""
import streamlit as st
from core.plugin_manager import install_plugin, uninstall_plugin, update_plugin
from core.plugin_loader import discover_plugins

st.title("⚙️ 插件管理")

# --- 安装 ---
st.subheader("添加插件")
st.caption("粘贴 GitHub 仓库 URL，点击安装即可。插件仓库必须包含 `plugin.yaml`。")
url = st.text_input("GitHub 仓库 URL", placeholder="https://github.com/zengtianli/hydro-xxx")
if st.button("安装插件", type="primary", disabled=not url):
    with st.spinner("正在克隆仓库并安装依赖..."):
        ok, msg = install_plugin(url)
    if ok:
        st.success(msg)
        st.rerun()
    else:
        st.error(msg)

st.markdown("---")

# --- 已安装 ---
st.subheader("已安装插件")
plugins = discover_plugins()

if not plugins:
    st.info("暂无已安装的插件")
else:
    for p in plugins:
        with st.container(border=True):
            col1, col2, col3 = st.columns([5, 1, 1])
            with col1:
                st.markdown(f"**{p.icon} {p.title}**  `v{p.version}`")
                st.caption(p.description)
            with col2:
                if st.button("🔄 更新", key=f"update_{p.name}"):
                    with st.spinner("更新中..."):
                        ok, msg = update_plugin(p.dir_name)
                    st.toast(msg)
                    if ok:
                        st.rerun()
            with col3:
                if st.button("🗑️ 卸载", key=f"remove_{p.name}"):
                    ok, msg = uninstall_plugin(p.dir_name)
                    st.toast(msg)
                    if ok:
                        st.rerun()
