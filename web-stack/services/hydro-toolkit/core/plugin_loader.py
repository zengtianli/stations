"""插件发现与加载"""
from pathlib import Path
from dataclasses import dataclass
import yaml

PLUGINS_DIR = Path(__file__).resolve().parent.parent / "plugins"

@dataclass
class PluginInfo:
    name: str
    title: str
    icon: str
    order: int
    description: str
    version: str
    dir_name: str
    path: Path

def discover_plugins() -> list:
    """扫描 plugins/ 目录，返回所有有效插件的信息列表。"""
    plugins = []
    if not PLUGINS_DIR.exists():
        return plugins
    for plugin_dir in sorted(PLUGINS_DIR.iterdir()):
        if not plugin_dir.is_dir():
            continue
        manifest = plugin_dir / "plugin.yaml"
        if not manifest.exists():
            continue
        with open(manifest, encoding="utf-8") as f:
            meta = yaml.safe_load(f)
        plugins.append(PluginInfo(
            name=meta["name"],
            title=meta["title"],
            icon=meta.get("icon", "🔧"),
            order=meta.get("order", 99),
            description=meta.get("description", ""),
            version=meta.get("version", "0.0.0"),
            dir_name=plugin_dir.name,
            path=plugin_dir,
        ))
    return sorted(plugins, key=lambda p: p.order)
