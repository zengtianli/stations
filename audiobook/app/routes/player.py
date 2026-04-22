"""播放器页 GET /books/{id}"""

from __future__ import annotations

import html as html_mod
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

from ..storage import load_meta, load_chapter_sync

router = APIRouter()


def _load_navbar() -> str:
    for p in [
        Path(__file__).resolve().parent.parent.parent / "site-navbar.html",
        Path.home() / "Dev" / "devtools" / "lib" / "templates" / "site-navbar.html",
    ]:
        if p.exists():
            return p.read_text(encoding="utf-8")
    return ""


NAVBAR_HTML = _load_navbar()


def _render_chapter_html(book_id: str, ch_idx: int, title: str, status: str) -> str:
    """渲染单个章节的 HTML 内容"""
    if status != "done":
        label = "排队中..." if status == "pending" else "生成中..."
        return (
            f'<section id="ch{ch_idx}" class="chapter" data-ch="{ch_idx}">\n'
            f'<h2>{html_mod.escape(title)}</h2>\n'
            f'<div class="ch-loading">{label}</div>\n'
            f'</section>'
        )

    sync = load_chapter_sync(book_id, ch_idx)
    if not sync:
        return (
            f'<section id="ch{ch_idx}" class="chapter" data-ch="{ch_idx}">\n'
            f'<h2>{html_mod.escape(title)}</h2>\n'
            f'<p style="color:#999">（无内容）</p>\n'
            f'</section>'
        )

    blocks = sync.get("blocks", [])
    block_sents = sync.get("block_sents", [])
    all_sents = sync.get("sentences", [])

    body_parts = []
    text_idx = 0
    sent_counter = 0

    for blk in blocks:
        if blk["type"] == "heading":
            lvl = min(blk["level"] + 1, 6)
            body_parts.append(f'<h{lvl}>{html_mod.escape(blk["text"])}</h{lvl}>')
        else:
            sents = block_sents[text_idx] if text_idx < len(block_sents) else []
            text_idx += 1
            if not sents:
                body_parts.append(f'<p>{html_mod.escape(blk["text"])}</p>')
                continue
            spans = []
            for s in sents:
                sid = f"s{ch_idx}_{sent_counter}"
                spans.append(
                    f'<span id="{sid}" data-ch="{ch_idx}" '
                    f'data-start="{s["start"]:.3f}" '
                    f'data-end="{s["end"]:.3f}">'
                    f'{html_mod.escape(s["text"])}</span>'
                )
                sent_counter += 1
            body_parts.append(f'<p>{"".join(spans)}</p>')

    return (
        f'<section id="ch{ch_idx}" class="chapter" data-ch="{ch_idx}">\n'
        f'<h2>{html_mod.escape(title)}</h2>\n'
        + "\n".join(body_parts)
        + "\n</section>"
    )


def _build_sync_data(book_id: str, ch_idx: int) -> list[dict]:
    """构建章节的句子同步数据"""
    sync = load_chapter_sync(book_id, ch_idx)
    if not sync:
        return []
    sentences = sync.get("sentences", [])
    result = []
    for j, s in enumerate(sentences):
        result.append({
            "id": f"s{ch_idx}_{j}",
            "start": round(s["start"], 3),
            "end": round(s["end"], 3),
        })
    return result


@router.get("/books/{book_id}", response_class=HTMLResponse)
async def player_page(book_id: str):
    meta = load_meta(book_id)
    if not meta:
        raise HTTPException(404)

    title = meta.title
    n_ch = len(meta.chapters)
    book_status = meta.status.value

    # TOC
    toc_items = []
    for i, ch in enumerate(meta.chapters):
        status_icon = {"done": "", "generating": " ...", "pending": "", "error": " !"}.get(ch.status, "")
        toc_items.append(
            f'<li><a href="#" data-ch="{i}">'
            f'{html_mod.escape(ch.title)}{status_icon}</a></li>'
        )

    # Chapter sections
    sections = []
    for i, ch in enumerate(meta.chapters):
        sections.append(_render_chapter_html(book_id, i, ch.title, ch.status))

    # Audio elements (only for completed chapters)
    audios = []
    for i, ch in enumerate(meta.chapters):
        if ch.status == "done" and ch.duration > 0:
            audios.append(
                f'<audio id="audio-{i}" preload="auto" '
                f'src="/api/books/{book_id}/audio/{i}"></audio>'
            )

    # Sync data (only for completed chapters)
    sync_data = {}
    for i, ch in enumerate(meta.chapters):
        if ch.status == "done":
            sync_data[str(i)] = _build_sync_data(book_id, i)

    toc_html = "\n".join(toc_items)
    chapters_html = "\n".join(sections)
    audios_html = "\n".join(audios)
    sync_json = json.dumps(sync_data, ensure_ascii=False)
    titles_json = json.dumps([ch.title for ch in meta.chapters], ensure_ascii=False)

    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{html_mod.escape(title)} - Audiobook</title>
<style>
:root {{
  --c-primary: #1a5276;
  --c-primary-light: #2980b9;
  --c-bg: #fafbfc;
  --c-surface: #fff;
  --c-border: #e8eaed;
  --c-text: #2c3e50;
  --c-text-secondary: #7f8c8d;
  --c-highlight: #fef9c3;
  --c-highlight-border: #facc15;
  --player-h: 72px;
  --sidebar-w: 260px;
}}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{
  font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
               "Segoe UI", system-ui, sans-serif;
  background: var(--c-bg); color: var(--c-text); line-height: 1.9; font-size: 16px;
}}

#app {{ display: flex; height: 100vh; flex-direction: column; }}
#body-wrap {{ display: flex; flex: 1; overflow: hidden; }}

/* 侧边栏 */
#sidebar {{
  width: var(--sidebar-w); min-width: var(--sidebar-w);
  background: var(--c-surface); border-right: 1px solid var(--c-border);
  display: flex; flex-direction: column; overflow: hidden;
}}
#sidebar-header {{
  padding: 20px 20px 12px; border-bottom: 1px solid var(--c-border);
  position: relative;
}}
#sidebar-header h1 {{
  font-size: 15px; font-weight: 700; color: var(--c-primary);
  line-height: 1.4; padding-right: 32px;
}}
#sidebar-header a {{
  font-size: 12px; color: var(--c-text-secondary); text-decoration: none;
  display: block; margin-top: 4px;
}}
#sidebar-header a:hover {{ color: var(--c-primary); }}
#sidebar-toggle {{
  position: absolute; top: 16px; right: 10px;
  background: none; border: none; cursor: pointer;
  font-size: 18px; color: var(--c-text-secondary); padding: 4px;
  border-radius: 4px; transition: background .15s;
}}
#sidebar-toggle:hover {{ background: #edf2f7; }}
.sidebar-hidden #sidebar {{ display: none; }}
#sidebar-show {{
  display: none; position: fixed; top: 12px; left: 12px; z-index: 50;
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: 8px; padding: 6px 10px; cursor: pointer;
  font-size: 18px; color: var(--c-text-secondary);
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
}}
.sidebar-hidden #sidebar-show {{ display: block; }}

#toc {{ list-style: none; flex: 1; overflow-y: auto; padding: 8px 10px; }}
#toc li {{ margin-bottom: 2px; }}
#toc a {{
  display: block; padding: 8px 12px; border-radius: 8px;
  color: var(--c-text-secondary); text-decoration: none; font-size: 14px;
  line-height: 1.5; transition: all .15s;
}}
#toc a:hover {{ background: #edf2f7; color: var(--c-text); }}
#toc a.active {{ background: var(--c-primary); color: #fff; font-weight: 500; }}

/* 内容区 */
#content-wrap {{ flex: 1; overflow-y: auto; padding-bottom: var(--player-h); }}
#content {{
  max-width: 960px; margin: 0 auto; padding: 32px 40px 48px;
}}
.chapter {{ display: none; }}
.chapter.visible {{ display: block; }}
.chapter h2 {{
  font-size: 24px; font-weight: 700; color: var(--c-primary);
  margin-bottom: 24px; padding-bottom: 12px;
  border-bottom: 3px solid #d4e6f1;
}}
.chapter h3 {{
  font-size: 19px; font-weight: 600; color: #34495e;
  margin: 28px 0 12px; padding-left: 12px;
  border-left: 4px solid var(--c-primary-light);
}}
.chapter h4 {{
  font-size: 17px; font-weight: 600; color: #4a6274;
  margin: 20px 0 8px;
}}
.chapter h5, .chapter h6 {{
  font-size: 16px; font-weight: 600; color: #5a6c7d;
  margin: 16px 0 6px;
}}
.chapter p {{
  margin: 12px 0; text-indent: 2em;
  color: var(--c-text); line-height: 2;
}}
.chapter span[data-start] {{
  transition: background-color .25s, box-shadow .25s;
  border-radius: 3px; padding: 1px 0; cursor: pointer;
}}
.chapter span[data-start]:hover {{ background-color: #f0f4f8; }}
.chapter span.highlight {{
  background-color: var(--c-highlight);
  box-shadow: 0 0 0 2px var(--c-highlight-border);
}}
.ch-loading {{
  text-align: center; padding: 60px 20px; color: var(--c-text-secondary);
  font-size: 15px;
}}

/* 底部播放栏 */
#player {{
  position: fixed; bottom: 0; left: 0; right: 0;
  height: var(--player-h); background: var(--c-surface);
  border-top: 1px solid var(--c-border);
  display: flex; align-items: center; padding: 0 24px; gap: 16px;
  box-shadow: 0 -2px 12px rgba(0,0,0,.06); z-index: 100;
}}
.ctrl-group {{ display: flex; align-items: center; gap: 6px; }}
.ctrl-btn {{
  width: 36px; height: 36px; border-radius: 50%; border: none;
  background: transparent; cursor: pointer; font-size: 16px;
  color: var(--c-text); display: flex; align-items: center;
  justify-content: center; transition: background .15s;
}}
.ctrl-btn:hover {{ background: #edf2f7; }}
#play-btn {{
  width: 44px; height: 44px; font-size: 20px;
  background: var(--c-primary); color: #fff; border-radius: 50%;
  border: none; cursor: pointer; display: flex;
  align-items: center; justify-content: center; transition: background .15s;
}}
#play-btn:hover {{ background: var(--c-primary-light); }}
.progress-area {{ flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }}
.progress-info {{
  display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; color: var(--c-text-secondary);
}}
#ch-title {{
  font-weight: 500; color: var(--c-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  max-width: 400px;
}}
#progress-wrap {{
  width: 100%; height: 6px; background: #e2e8f0;
  border-radius: 3px; cursor: pointer; position: relative; transition: height .15s;
}}
#progress-wrap:hover {{ height: 10px; }}
#progress-bar {{
  height: 100%; background: var(--c-primary); border-radius: 3px;
  width: 0; transition: width .15s linear; position: relative;
}}
#progress-bar::after {{
  content: ''; position: absolute; right: -6px; top: 50%;
  transform: translateY(-50%); width: 14px; height: 14px;
  background: var(--c-primary); border: 2px solid #fff;
  border-radius: 50%; opacity: 0; transition: opacity .15s;
  box-shadow: 0 1px 4px rgba(0,0,0,.2);
}}
#progress-wrap:hover #progress-bar::after {{ opacity: 1; }}
.speed-group {{ display: flex; gap: 4px; }}
.speed-btn {{
  padding: 4px 10px; border-radius: 16px; border: 1px solid var(--c-border);
  background: transparent; cursor: pointer; font-size: 13px;
  color: var(--c-text-secondary); transition: all .15s; white-space: nowrap;
}}
.speed-btn:hover {{ border-color: var(--c-primary); color: var(--c-primary); }}
.speed-btn.active {{ background: var(--c-primary); color: #fff; border-color: var(--c-primary); }}

@media (max-width: 768px) {{
  #sidebar {{ display: none; }}
  #content {{ padding: 20px 16px 40px; }}
  .speed-group {{ display: none; }}
  #ch-title {{ max-width: 200px; }}
}}
</style>
</head>
<body>
<div id="app">
  <div id="body-wrap">
    <button id="sidebar-show" title="显示目录">&#9776;</button>
    <nav id="sidebar">
      <div id="sidebar-header">
        <h1>{html_mod.escape(title)}</h1>
        <a href="/">&#8592; 返回书架</a>
        <button id="sidebar-toggle" title="收起目录">&#9776;</button>
      </div>
      <ul id="toc">{toc_html}</ul>
    </nav>
    <div id="content-wrap">
      <div id="content">{chapters_html}</div>
    </div>
  </div>

  <div id="player">
    <div class="ctrl-group">
      <button class="ctrl-btn" id="prev-btn" title="上一章">&#9198;</button>
      <button class="ctrl-btn" id="back-btn" title="-15s">&#8634;</button>
      <button id="play-btn" title="播放/暂停">&#9654;&#65039;</button>
      <button class="ctrl-btn" id="fwd-btn" title="+15s">&#8635;</button>
      <button class="ctrl-btn" id="next-btn" title="下一章">&#9197;</button>
    </div>
    <div class="progress-area">
      <div class="progress-info">
        <span id="ch-title"></span>
        <span id="time">00:00 / 00:00</span>
      </div>
      <div id="progress-wrap"><div id="progress-bar"></div></div>
    </div>
    <div class="speed-group">
      <button class="speed-btn" data-speed="0.75">0.75</button>
      <button class="speed-btn active" data-speed="1">1x</button>
      <button class="speed-btn" data-speed="1.25">1.25</button>
      <button class="speed-btn" data-speed="1.5">1.5</button>
      <button class="speed-btn" data-speed="2">2x</button>
    </div>
  </div>
</div>

{audios_html}

<script>
(function() {{
  const BOOK_ID = {json.dumps(book_id)};
  const BOOK_STATUS = {json.dumps(book_status)};
  const N = {n_ch};
  const SYNC = {sync_json};
  const TITLES = {titles_json};
  let cur = 0, playing = false;

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const getAudio = ch => document.getElementById('audio-' + ch);

  function fmt(s) {{
    if (!s || isNaN(s)) return '00:00';
    return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(Math.floor(s%60)).padStart(2,'0');
  }}

  function go(idx, t) {{
    if (idx < 0 || idx >= N) return;
    const was = playing;
    const a = getAudio(cur);
    if (a) {{ a.pause(); a.currentTime = 0; }}
    cur = idx;
    $$('.chapter').forEach(s => s.classList.remove('visible'));
    const sec = document.getElementById('ch' + idx);
    if (sec) sec.classList.add('visible');
    $$('#toc a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector('#toc a[data-ch="' + idx + '"]');
    if (link) {{ link.classList.add('active'); link.scrollIntoView({{block:'nearest'}}); }}
    $('#ch-title').textContent = TITLES[idx] || '';
    const na = getAudio(idx);
    if (na && typeof t === 'number') na.currentTime = t;
    if (was && na) na.play();
    clearHL();
    save();
  }}

  function clearHL() {{ $$('.highlight').forEach(s => s.classList.remove('highlight')); }}

  let lastHL = null;
  function highlight(a) {{
    const t = a.currentTime;
    const ss = SYNC[cur];
    if (!ss) return;
    for (const s of ss) {{
      if (t >= s.start && t < s.end) {{
        if (lastHL === s.id) return;
        clearHL();
        const el = document.getElementById(s.id);
        if (el) {{
          el.classList.add('highlight');
          el.scrollIntoView({{behavior:'smooth', block:'center'}});
        }}
        lastHL = s.id;
        return;
      }}
    }}
  }}

  function onTime() {{
    const a = getAudio(cur);
    if (!a) return;
    highlight(a);
    const pct = a.duration ? (a.currentTime / a.duration * 100) : 0;
    $('#progress-bar').style.width = pct + '%';
    $('#time').textContent = fmt(a.currentTime) + ' / ' + fmt(a.duration);
  }}

  function bindAudio(i) {{
    const a = getAudio(i);
    if (!a || a._bound) return;
    a._bound = true;
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', () => {{
      if (i + 1 < N) {{ go(i + 1, 0); const na = getAudio(i+1); if(na) na.play(); }}
      else {{ playing = false; $('#play-btn').innerHTML = '&#9654;&#65039;'; }}
    }});
  }}

  // 绑定已有 audio
  for (let i = 0; i < N; i++) bindAudio(i);

  $('#play-btn').addEventListener('click', () => {{
    const a = getAudio(cur);
    if (!a) return;
    if (playing) {{
      a.pause(); playing = false;
      $('#play-btn').innerHTML = '&#9654;&#65039;';
    }} else {{
      a.play(); playing = true;
      $('#play-btn').innerHTML = '&#9208;&#65039;';
    }}
  }});

  $('#progress-wrap').addEventListener('click', e => {{
    const a = getAudio(cur);
    if (!a || !a.duration) return;
    const r = $('#progress-wrap').getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * a.duration;
  }});

  $('#back-btn').addEventListener('click', () => {{
    const a = getAudio(cur); if (a) a.currentTime = Math.max(0, a.currentTime - 15);
  }});
  $('#fwd-btn').addEventListener('click', () => {{
    const a = getAudio(cur); if (a) a.currentTime = Math.min(a.duration||0, a.currentTime + 15);
  }});
  $('#prev-btn').addEventListener('click', () => go(cur - 1, 0));
  $('#next-btn').addEventListener('click', () => go(cur + 1, 0));

  $$('[data-speed]').forEach(btn => {{
    btn.addEventListener('click', () => {{
      const sp = parseFloat(btn.dataset.speed);
      for (let i = 0; i < N; i++) {{ const a = getAudio(i); if(a) a.playbackRate = sp; }}
      $$('[data-speed]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }});
  }});

  $$('#toc a').forEach(a => {{
    a.addEventListener('click', e => {{ e.preventDefault(); go(parseInt(a.dataset.ch), 0); }});
  }});

  $('#content').addEventListener('click', e => {{
    const span = e.target.closest('span[data-start]');
    if (!span) return;
    const ch = parseInt(span.dataset.ch);
    const t = parseFloat(span.dataset.start);
    if (ch !== cur) go(ch, t);
    else {{ const a = getAudio(cur); if(a) a.currentTime = t; }}
    if (!playing) {{
      const a = getAudio(cur);
      if(a) {{ a.play(); playing = true; $('#play-btn').innerHTML = '&#9208;&#65039;'; }}
    }}
  }});

  // 侧边栏 toggle
  const bodyWrap = $('#body-wrap');
  $('#sidebar-toggle').addEventListener('click', () => bodyWrap.classList.add('sidebar-hidden'));
  $('#sidebar-show').addEventListener('click', () => bodyWrap.classList.remove('sidebar-hidden'));

  // localStorage
  const KEY = 'audiobook_' + BOOK_ID;
  function save() {{
    try {{
      const a = getAudio(cur);
      localStorage.setItem(KEY, JSON.stringify({{ch:cur, t: a ? a.currentTime : 0}}));
    }} catch(_) {{}}
  }}
  setInterval(save, 3000);

  function restore() {{
    try {{
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s.ch === 'number') {{ go(s.ch, s.t || 0); return; }}
    }} catch(_) {{}}
    go(0, 0);
  }}

  document.addEventListener('keydown', e => {{
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const a = getAudio(cur);
    if (e.code === 'Space') {{ e.preventDefault(); $('#play-btn').click(); }}
    else if (e.code === 'ArrowLeft') {{ if(a) a.currentTime = Math.max(0, a.currentTime - 5); }}
    else if (e.code === 'ArrowRight') {{ if(a) a.currentTime = Math.min(a.duration||0, a.currentTime + 5); }}
  }});

  // SSE 进度更新（生成中的书）
  if (BOOK_STATUS !== 'done' && BOOK_STATUS !== 'error') {{
    const es = new EventSource('/api/books/' + BOOK_ID + '/progress');
    let autoStarted = false;
    es.onmessage = async (e) => {{
      const data = JSON.parse(e.data);
      if (data.error) {{ es.close(); return; }}

      // 更新章节状态
      for (const ch of data.chapters) {{
        const i = ch.index;
        const tocLink = document.querySelector('#toc a[data-ch="' + i + '"]');

        if (ch.status === 'done' && !getAudio(i)) {{
          // 章节刚完成 → 创建 audio 元素 + 加载 sync 数据
          const audioEl = document.createElement('audio');
          audioEl.id = 'audio-' + i;
          audioEl.preload = 'auto';
          audioEl.src = '/api/books/' + BOOK_ID + '/audio/' + i;
          document.body.appendChild(audioEl);
          bindAudio(i);

          // 加载 sync 数据
          try {{
            const resp = await fetch('/api/books/' + BOOK_ID + '/sync/' + i);
            if (resp.ok) {{
              const syncData = await resp.json();
              // 重建章节 HTML
              const sec = document.getElementById('ch' + i);
              if (sec && syncData.blocks) {{
                let html = '<h2>' + TITLES[i] + '</h2>\\n';
                let textIdx = 0, sentCnt = 0;
                const bs = syncData.block_sents || [];
                for (const blk of syncData.blocks) {{
                  if (blk.type === 'heading') {{
                    const lvl = Math.min(blk.level + 1, 6);
                    html += '<h' + lvl + '>' + blk.text + '</h' + lvl + '>\\n';
                  }} else {{
                    const sents = bs[textIdx] || [];
                    textIdx++;
                    if (!sents.length) {{
                      html += '<p>' + blk.text + '</p>\\n';
                    }} else {{
                      let spans = '';
                      for (const s of sents) {{
                        const sid = 's' + i + '_' + sentCnt;
                        spans += '<span id="' + sid + '" data-ch="' + i + '" data-start="' + s.start.toFixed(3) + '" data-end="' + s.end.toFixed(3) + '">' + s.text + '</span>';
                        sentCnt++;
                      }}
                      html += '<p>' + spans + '</p>\\n';
                    }}
                  }}
                }}
                sec.innerHTML = html;

                // 更新 SYNC
                const syncEntries = [];
                let sc = 0;
                for (const s of (syncData.sentences || [])) {{
                  syncEntries.push({{ id: 's' + i + '_' + sc, start: s.start, end: s.end }});
                  sc++;
                }}
                SYNC[i] = syncEntries;
              }}
            }}
          }} catch(_) {{}}

          if (tocLink) tocLink.textContent = TITLES[i];

          // 第一章完成 → 自动播放
          if (!autoStarted) {{
            autoStarted = true;
            go(i, 0);
            audioEl.play();
            playing = true;
            $('#play-btn').innerHTML = '&#9208;&#65039;';
          }}
        }} else if (ch.status === 'generating') {{
          const sec = document.getElementById('ch' + i);
          if (sec) {{
            const loading = sec.querySelector('.ch-loading');
            if (loading) loading.textContent = '生成中...';
          }}
          if (tocLink) tocLink.textContent = TITLES[i] + ' ...';
        }}
      }}

      if (data.status === 'done' || data.status === 'error') {{
        es.close();
      }}
    }};
    es.onerror = () => {{ es.close(); }};
  }}

  restore();
}})();
</script>
</body>
</html>'''
    return html.replace("<body>", "<body>\n" + NAVBAR_HTML, 1)
