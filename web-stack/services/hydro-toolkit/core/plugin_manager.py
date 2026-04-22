"""插件安装、卸载、更新"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

PLUGINS_DIR = Path(__file__).resolve().parent.parent / "plugins"
REGISTRY = Path(__file__).resolve().parent.parent / "plugins.json"

def install_plugin(url: str) -> tuple:
    """Clone 插件 repo 并安装依赖。"""
    PLUGINS_DIR.mkdir(exist_ok=True)
    repo_name = url.rstrip("/").split("/")[-1].replace(".git", "")
    target = PLUGINS_DIR / repo_name
    if target.exists():
        return False, f"插件目录 '{repo_name}' 已存在"
    result = subprocess.run(
        ["git", "clone", "--depth", "1", url, str(target)],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        return False, f"Git clone 失败: {result.stderr.strip()}"
    if not (target / "plugin.yaml").exists():
        shutil.rmtree(target)
        return False, "仓库中未找到 plugin.yaml"
    req_file = target / "requirements.txt"
    if req_file.exists():
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", str(req_file), "-q"],
            capture_output=True,
        )
    # Remove src/__init__.py to enable namespace package (avoid cross-plugin collision)
    init_file = target / "src" / "__init__.py"
    if init_file.exists():
        init_file.unlink()
    _update_registry(repo_name, url, "add")
    return True, f"插件 '{repo_name}' 安装成功"

def uninstall_plugin(dir_name: str) -> tuple:
    """删除插件目录。"""
    target = PLUGINS_DIR / dir_name
    if not target.exists():
        return False, f"插件 '{dir_name}' 不存在"
    shutil.rmtree(target)
    _update_registry(dir_name, "", "remove")
    return True, f"插件 '{dir_name}' 已卸载"

def update_plugin(dir_name: str) -> tuple:
    """git pull 更新插件。"""
    target = PLUGINS_DIR / dir_name
    if not target.exists():
        return False, f"插件 '{dir_name}' 不存在"
    result = subprocess.run(
        ["git", "-C", str(target), "pull", "--ff-only"],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        return False, f"更新失败: {result.stderr.strip()}"
    # Reinstall deps
    req_file = target / "requirements.txt"
    if req_file.exists():
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", str(req_file), "-q"],
            capture_output=True,
        )
    return True, f"已更新: {result.stdout.strip()}"

def _update_registry(dir_name: str, url: str, action: str):
    registry = _load_registry()
    if action == "add":
        registry[dir_name] = {"url": url}
    elif action == "remove":
        registry.pop(dir_name, None)
    with open(REGISTRY, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)

def _load_registry() -> dict:
    if REGISTRY.exists():
        with open(REGISTRY, encoding="utf-8") as f:
            return json.load(f)
    return {}
