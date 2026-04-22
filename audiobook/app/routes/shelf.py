"""书架页 GET /"""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

from ..config import VOICES

router = APIRouter()


def _load_navbar() -> str:
    # 先本地副本，再 devtools 模板，都没就空
    for p in [
        Path(__file__).resolve().parent.parent.parent / "site-navbar.html",
        Path.home() / "Dev" / "devtools" / "lib" / "templates" / "site-navbar.html",
    ]:
        if p.exists():
            return p.read_text(encoding="utf-8")
    return ""


NAVBAR_HTML = _load_navbar()


@router.get("/", response_class=HTMLResponse)
async def shelf_page():
    voice_options = "\n".join(
        f'<option value="{k}">{v["label"]}</option>' for k, v in VOICES.items()
    )

    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Audiobook</title>
<style>
:root {{
  --c-primary: #1a5276;
  --c-primary-light: #2980b9;
  --c-bg: #f5f7fa;
  --c-surface: #fff;
  --c-border: #e8eaed;
  --c-text: #2c3e50;
  --c-text-secondary: #7f8c8d;
  --c-success: #27ae60;
  --c-warning: #f39c12;
  --c-error: #e74c3c;
}}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{
  font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
               system-ui, sans-serif;
  background: var(--c-bg); color: var(--c-text); line-height: 1.6;
}}
.container {{ max-width: 800px; margin: 0 auto; padding: 32px 20px; }}

/* 头部 */
header {{ text-align: center; margin-bottom: 32px; }}
header h1 {{ font-size: 28px; color: var(--c-primary); font-weight: 700; }}
header p {{ color: var(--c-text-secondary); margin-top: 4px; }}

/* 上传区 */
.upload-card {{
  background: var(--c-surface); border-radius: 12px; padding: 24px;
  border: 1px solid var(--c-border); margin-bottom: 32px;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}}
.tabs {{ display: flex; gap: 0; margin-bottom: 16px; border-bottom: 2px solid var(--c-border); }}
.tab {{
  padding: 8px 20px; background: none; border: none; cursor: pointer;
  font-size: 14px; color: var(--c-text-secondary); border-bottom: 2px solid transparent;
  margin-bottom: -2px; transition: all .15s;
}}
.tab.active {{ color: var(--c-primary); border-bottom-color: var(--c-primary); font-weight: 500; }}
.tab-panel {{ display: none; }}
.tab-panel.active {{ display: block; }}

.drop-zone {{
  border: 2px dashed var(--c-border); border-radius: 8px; padding: 40px;
  text-align: center; color: var(--c-text-secondary); cursor: pointer;
  transition: all .2s;
}}
.drop-zone:hover, .drop-zone.dragover {{
  border-color: var(--c-primary-light); background: #f0f7ff; color: var(--c-primary);
}}
.drop-zone input {{ display: none; }}

textarea {{
  width: 100%; min-height: 120px; padding: 12px; border: 1px solid var(--c-border);
  border-radius: 8px; font-size: 14px; font-family: inherit; resize: vertical;
}}
input[type="url"] {{
  width: 100%; padding: 10px 12px; border: 1px solid var(--c-border);
  border-radius: 8px; font-size: 14px;
}}

.form-row {{ display: flex; gap: 12px; margin-top: 16px; align-items: center; }}
.form-row select {{
  padding: 8px 12px; border: 1px solid var(--c-border); border-radius: 8px;
  font-size: 14px; background: var(--c-surface);
}}
.form-row label {{ font-size: 14px; color: var(--c-text-secondary); }}
.btn-generate {{
  margin-left: auto; padding: 10px 28px; background: var(--c-primary); color: #fff;
  border: none; border-radius: 8px; font-size: 15px; font-weight: 500;
  cursor: pointer; transition: background .15s;
}}
.btn-generate:hover {{ background: var(--c-primary-light); }}
.btn-generate:disabled {{ opacity: .5; cursor: not-allowed; }}

/* 书列表 */
.book-list h2 {{ font-size: 18px; margin-bottom: 16px; color: var(--c-text-secondary); font-weight: 500; }}
.book-card {{
  display: flex; align-items: center; gap: 16px;
  background: var(--c-surface); border-radius: 10px; padding: 16px 20px;
  border: 1px solid var(--c-border); margin-bottom: 10px;
  text-decoration: none; color: inherit; transition: box-shadow .15s;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
}}
.book-card:hover {{ box-shadow: 0 4px 12px rgba(0,0,0,.08); }}
.book-info {{ flex: 1; min-width: 0; }}
.book-title {{ font-weight: 600; font-size: 16px; }}
.book-meta {{ font-size: 13px; color: var(--c-text-secondary); margin-top: 4px; }}
.badge {{
  padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;
  white-space: nowrap;
}}
.badge-done {{ background: #e8f8f0; color: var(--c-success); }}
.badge-generating {{ background: #fef3e2; color: var(--c-warning); }}
.badge-queued {{ background: #edf2f7; color: var(--c-text-secondary); }}
.badge-error {{ background: #fde8e8; color: var(--c-error); }}

.empty {{ text-align: center; padding: 48px; color: var(--c-text-secondary); }}

/* 管理 */
.admin-bar {{
  display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
}}
.admin-bar input {{
  padding: 6px 10px; border: 1px solid var(--c-border); border-radius: 6px;
  font-size: 13px; width: 160px;
}}
.btn-delete {{
  padding: 4px 12px; background: none; border: 1px solid var(--c-error); color: var(--c-error);
  border-radius: 6px; cursor: pointer; font-size: 13px; display: none;
}}
.btn-delete:hover {{ background: var(--c-error); color: #fff; }}
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>Audiobook</h1>
    <p>Markdown to audiobook with sentence-level sync</p>
  </header>

  <div class="upload-card">
    <div class="tabs">
      <button class="tab active" data-tab="file">上传文件</button>
      <button class="tab" data-tab="text">粘贴文本</button>
      <button class="tab" data-tab="url">URL</button>
    </div>
    <div id="panel-file" class="tab-panel active">
      <div class="drop-zone" id="drop-zone">
        <input type="file" id="file-input" accept=".md,.txt,.markdown">
        <p>拖拽 Markdown 文件到这里，或点击选择</p>
        <p id="file-name" style="font-weight:500;margin-top:8px;color:var(--c-primary)"></p>
      </div>
    </div>
    <div id="panel-text" class="tab-panel">
      <textarea id="text-input" placeholder="粘贴 Markdown 文本..."></textarea>
    </div>
    <div id="panel-url" class="tab-panel">
      <input type="url" id="url-input" placeholder="https://example.com/doc.md">
    </div>
    <div class="form-row">
      <label>音色</label>
      <select id="voice-select">{voice_options}</select>
      <button class="btn-generate" id="btn-generate">生成有声书</button>
    </div>
  </div>

  <div class="book-list">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h2 id="book-count">书架</h2>
      <div class="admin-bar">
        <input type="password" id="admin-pw" placeholder="管理员密码">
      </div>
    </div>
    <div id="books"></div>
  </div>
</div>

<script>
(function() {{
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  // Tabs
  $$('.tab').forEach(tab => {{
    tab.addEventListener('click', () => {{
      $$('.tab').forEach(t => t.classList.remove('active'));
      $$('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      $('#panel-' + tab.dataset.tab).classList.add('active');
    }});
  }});

  // Drop zone
  const dz = $('#drop-zone');
  const fi = $('#file-input');
  dz.addEventListener('click', () => fi.click());
  dz.addEventListener('dragover', e => {{ e.preventDefault(); dz.classList.add('dragover'); }});
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', e => {{
    e.preventDefault(); dz.classList.remove('dragover');
    if (e.dataTransfer.files.length) {{
      fi.files = e.dataTransfer.files;
      $('#file-name').textContent = fi.files[0].name;
    }}
  }});
  fi.addEventListener('change', () => {{
    if (fi.files.length) $('#file-name').textContent = fi.files[0].name;
  }});

  // Generate
  $('#btn-generate').addEventListener('click', async () => {{
    const btn = $('#btn-generate');
    btn.disabled = true; btn.textContent = '提交中...';

    const activeTab = $('.tab.active').dataset.tab;
    const voice = $('#voice-select').value;
    const form = new FormData();
    form.append('voice', voice);

    if (activeTab === 'file') {{
      if (!fi.files.length) {{ alert('请选择文件'); btn.disabled = false; btn.textContent = '生成有声书'; return; }}
      form.append('file', fi.files[0]);
    }} else if (activeTab === 'text') {{
      const text = $('#text-input').value.trim();
      if (!text) {{ alert('请输入文本'); btn.disabled = false; btn.textContent = '生成有声书'; return; }}
      form.append('text', text);
    }} else {{
      const url = $('#url-input').value.trim();
      if (!url) {{ alert('请输入 URL'); btn.disabled = false; btn.textContent = '生成有声书'; return; }}
      form.append('url', url);
    }}

    try {{
      const resp = await fetch('/api/books', {{ method: 'POST', body: form }});
      if (!resp.ok) {{
        const err = await resp.json();
        alert(err.detail || '提交失败');
        return;
      }}
      const data = await resp.json();
      window.location.href = '/books/' + data.id;
    }} catch(e) {{
      alert('网络错误: ' + e.message);
    }} finally {{
      btn.disabled = false; btn.textContent = '生成有声书';
    }}
  }});

  // Book list
  function fmtDur(s) {{
    if (!s) return '';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m + ':' + String(sec).padStart(2, '0');
  }}

  function badgeClass(status) {{
    return 'badge badge-' + status;
  }}
  function badgeText(status) {{
    return {{ queued: '排队中', generating: '生成中...', done: '就绪', error: '失败' }}[status] || status;
  }}

  let adminPw = '';
  $('#admin-pw').addEventListener('input', e => {{ adminPw = e.target.value; renderBooks(); }});

  let booksData = [];
  function renderBooks() {{
    const el = $('#books');
    if (!booksData.length) {{
      el.innerHTML = '<div class="empty">还没有有声书，上传一个 Markdown 试试</div>';
      $('#book-count').textContent = '书架';
      return;
    }}
    $('#book-count').textContent = '书架 (' + booksData.length + ')';
    el.innerHTML = booksData.map(b => `
      <div class="book-card">
        <div class="book-info" style="cursor:pointer" onclick="location.href='/books/${{b.id}}'">
          <div class="book-title">${{b.title}}</div>
          <div class="book-meta">${{b.chapters}} 章 ${{b.duration ? '· ' + fmtDur(b.duration) : ''}}</div>
        </div>
        <span class="${{badgeClass(b.status)}}">${{badgeText(b.status)}}</span>
        ${{adminPw ? `<button class="btn-delete" style="display:inline-block" onclick="deleteBook('${{b.id}}',event)">删除</button>` : ''}}
      </div>
    `).join('');
  }}

  window.deleteBook = async (id, e) => {{
    e.stopPropagation();
    if (!confirm('确定删除？')) return;
    const resp = await fetch('/api/books/' + id, {{
      method: 'DELETE', headers: {{ 'X-Admin-Password': adminPw }}
    }});
    if (resp.ok) {{ loadBooks(); }}
    else {{ const d = await resp.json(); alert(d.detail || '删除失败'); }}
  }};

  async function loadBooks() {{
    try {{
      const resp = await fetch('/api/books');
      booksData = await resp.json();
      renderBooks();
    }} catch(e) {{}}
  }}

  loadBooks();
  setInterval(loadBooks, 5000);
}})();
</script>
</body>
</html>'''
    return html.replace("<body>", "<body>\n" + NAVBAR_HTML, 1)
