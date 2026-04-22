#!/usr/bin/env python3
"""Browser-like post-deploy verification for a tlz web site.

Usage:
    python3 verify.py hydro-capacity
    python3 verify.py hydro-toolkit --domain hydro --api-path /api/plugins

Checks (all must pass):
  1. `/` responds 200 and HTML contains `_next/static` (confirms Next.js, not Streamlit)
  2. Production bundle (`app/page-*.js`) has NO `127.0.0.1:<port>` / `localhost:<port>`
     — catches dev `.env.local` getting baked into production build
  3. Real API endpoint returns 200 with Origin header + valid JSON (CORS works)

Exit 0 on pass; exit 1 on any failure.
"""
from __future__ import annotations

import argparse
import http.client
import json
import re
import ssl
import sys


def fetch(host: str, path: str, headers: dict | None = None) -> tuple[int, dict, bytes]:
    conn = http.client.HTTPSConnection(host, 443, timeout=15, context=ssl.create_default_context())
    h = {
        "Host": host,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
        "Accept": "*/*",
    }
    if headers:
        h.update(headers)
    conn.request("GET", path, headers=h)
    r = conn.getresponse()
    data = r.read()
    conn.close()
    return r.status, {k.lower(): v for k, v in r.getheaders()}, data


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("name", help="site name (e.g. hydro-capacity)")
    ap.add_argument("--domain", default=None, help="override subdomain (e.g. 'hydro' for hydro-toolkit)")
    ap.add_argument("--api-path", default="/api/meta", help="first-paint API path (default /api/meta)")
    ap.add_argument("--required-field", default="title", help="JSON field that must exist (default 'title')")
    args = ap.parse_args()

    domain = (args.domain or args.name) + ".tianlizeng.cloud"
    failures: list[str] = []

    # 1. Page is Next.js
    try:
        status, _, html = fetch(domain, "/")
        html_txt = html.decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  [1] FETCH /: {e}")
        return 1

    next_refs = html_txt.count("_next/static")
    if status != 200 or next_refs == 0:
        failures.append(f"[1] page not Next.js (status={status}, _next refs={next_refs})")
    else:
        print(f"  [1] page=Next.js (_next refs={next_refs}, status=200)")

    # 2. Bundle is clean (no dev URLs baked in)
    m = re.search(r"_next/static/chunks/app/page-[a-f0-9]+\.js", html_txt)
    if not m:
        failures.append("[2] couldn't locate app/page-*.js in HTML")
    else:
        bundle_path = "/" + m.group(0)
        status2, _, bundle = fetch(domain, bundle_path)
        if status2 != 200:
            failures.append(f"[2] bundle fetch {status2}")
        else:
            leaks = sorted(set(re.findall(r"127\.0\.0\.1:\d+|localhost:\d+", bundle.decode("utf-8", "replace"))))
            if leaks:
                failures.append(f"[2] bundle has dev URLs baked in: {leaks}")
            else:
                print(f"  [2] bundle clean (no localhost/127.0.0.1 leaks) — {bundle_path}")

    # 3. Real API endpoint with Origin header
    try:
        status3, h3, body = fetch(
            domain,
            args.api_path,
            headers={"Origin": f"https://{domain}", "Referer": f"https://{domain}/"},
        )
    except Exception as e:
        failures.append(f"[3] fetch {args.api_path}: {e}")
        status3 = None
        h3 = {}
        body = b""

    if status3 != 200:
        failures.append(f"[3] {args.api_path} status={status3}")
    else:
        cors = h3.get("access-control-allow-origin", "")
        if not cors:
            failures.append(f"[3] no CORS header on {args.api_path}")
        try:
            parsed = json.loads(body)
            if isinstance(parsed, dict):
                has_field = args.required_field in parsed
            elif isinstance(parsed, list) and parsed:
                has_field = isinstance(parsed[0], dict) and args.required_field in parsed[0]
            else:
                has_field = False
        except Exception:
            has_field = False
            parsed = None

        if not has_field:
            failures.append(f"[3] {args.api_path} body missing required field '{args.required_field}' (body head: {body[:120]!r})")
        else:
            print(f"  [3] {args.api_path}=200, CORS={cors!r}, JSON['{args.required_field}'] OK")

    if failures:
        print()
        print("FAIL:")
        for f in failures:
            print(f"  {f}")
        return 1

    print()
    print(f"PASS: {args.name} ({domain}) — browser-like end-to-end verified")
    return 0


if __name__ == "__main__":
    sys.exit(main())
