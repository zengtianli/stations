"""风险图脚本运行器 -- 通过 subprocess 安全调用各阶段脚本"""

import os
import subprocess
import sys
from pathlib import Path

REPO_DIR = Path(__file__).resolve().parent.parent.parent  # hydro-risk repo root

PHASE_1 = [
    ("1.1", "1.1_database_protection_area.py", "保护片数据"),
    ("1.2", "1.2_database_dike_section.py", "堤段数据"),
    ("1.3", "1.3_database_dike.py", "堤防数据"),
    ("1.4", "1.4_database_river_centerline.py", "河道中心线"),
]

PHASE_2 = [
    ("2.1", "2.1_forecast_cross_section.py", "预报断面"),
]

PHASE_3 = [
    ("3.01", "3.01_risk_protection_info.py", "保护片信息"),
    ("3.02", "3.02_risk_protection_region.py", "保护片行政区域"),
    ("3.03", "3.03_risk_protection_dike_relation.py", "保护片堤段关系"),
    ("3.04", "3.04_risk_dike_section_info.py", "堤段信息"),
    ("3.05", "3.05_risk_elevation_relation.py", "堤顶高程关系"),
    ("3.06", "3.06_risk_section_mileage.py", "断面里程关系"),
    ("3.07", "3.07_risk_dike_info.py", "堤防信息"),
    ("3.08", "3.08_risk_dike_profile.py", "堤防纵剖面"),
    ("3.09", "3.09_risk_facilities.py", "重要设施"),
]


def run_script(script_name: str, args: dict | None = None, work_dir: str | None = None):
    """Run a risk analysis script via subprocess.

    Args:
        script_name: Script filename (e.g. "3.01_risk_protection_info.py")
        args: Dict of CLI arguments {"-g": "/path/to/file.geojson", "-e": "/path/to/output.xlsx", ...}
        work_dir: Working directory (defaults to REPO_DIR)

    Returns:
        (success: bool, stdout: str, stderr: str)
    """
    script_path = REPO_DIR / script_name
    if not script_path.exists():
        return False, "", f"Script not found: {script_path}"

    cmd = [sys.executable, str(script_path)]
    if args:
        for flag, value in args.items():
            if value is not None:
                cmd.extend([flag, str(value)])

    env = os.environ.copy()
    # Ensure lib/ is on PYTHONPATH
    lib_path = str(REPO_DIR / "lib")
    env["PYTHONPATH"] = lib_path + os.pathsep + env.get("PYTHONPATH", "")

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=work_dir or str(REPO_DIR),
        env=env,
        timeout=300,
    )

    return result.returncode == 0, result.stdout, result.stderr
