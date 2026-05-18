(function () {
  "use strict";

  const form = document.getElementById("audit-form");
  const fileInput = document.getElementById("backlinks");
  const drop = document.getElementById("drop");
  const pickBtn = document.getElementById("pick-btn");
  const dropHint = document.getElementById("drop-hint");
  const submitBtn = document.getElementById("submit-btn");
  const statusEl = document.getElementById("status");
  const resultCard = document.getElementById("result");
  const statsEl = document.getElementById("stats");
  const downloadLink = document.getElementById("download-link");

  // --- Sidebar nav: active state via IntersectionObserver, mobile toggle ---
  const navItems = document.querySelectorAll(".nav-item");
  const menuToggle = document.getElementById("menu-toggle");
  const sidebarOverlay = document.getElementById("sidebar-overlay");

  function setActiveNav(sectionId) {
    navItems.forEach(function (it) {
      it.classList.toggle("active",
        it.getAttribute("data-section") === sectionId);
    });
  }

  // Smooth-scroll and close mobile sidebar on click.
  navItems.forEach(function (it) {
    it.addEventListener("click", function (e) {
      const id = it.getAttribute("data-section");
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveNav(id);
        document.body.classList.remove("sidebar-open");
      }
    });
  });

  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      document.body.classList.toggle("sidebar-open");
    });
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", function () {
      document.body.classList.remove("sidebar-open");
    });
  }

  // Highlight nav as user scrolls through sections.
  const sectionIds = ["home", "audit", "demo-showcase", "history", "guide", "settings"];
  const observed = sectionIds
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  if ("IntersectionObserver" in window && observed.length) {
    const io = new IntersectionObserver(function (entries) {
      // Use the most-visible entry above the viewport midline.
      const visible = entries
        .filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) {
          return b.intersectionRatio - a.intersectionRatio;
        });
      if (visible[0]) setActiveNav(visible[0].target.id);
    }, { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] });
    observed.forEach(function (el) { io.observe(el); });
  }

  // --- Settings (DR thresholds) — stored in localStorage ------------------
  const drHighInput = document.getElementById("setting-dr-high");
  const drMidInput = document.getElementById("setting-dr-mid");
  const saveSettingsBtn = document.getElementById("save-settings");
  const resetSettingsBtn = document.getElementById("reset-settings");
  const settingsStatus = document.getElementById("settings-status");

  let drHigh = 50;
  let drMid = 20;

  function loadSettings() {
    try {
      const raw = localStorage.getItem("btvn.settings");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.drHigh === "number") drHigh = parsed.drHigh;
        if (typeof parsed.drMid === "number") drMid = parsed.drMid;
      }
    } catch (e) { /* ignore */ }
    if (drHighInput) drHighInput.value = drHigh;
    if (drMidInput) drMidInput.value = drMid;
  }

  function persistSettings() {
    const newHigh = parseInt(drHighInput.value, 10);
    const newMid = parseInt(drMidInput.value, 10);
    if (Number.isNaN(newHigh) || Number.isNaN(newMid) ||
        newMid >= newHigh || newHigh > 100 || newMid < 0) {
      settingsStatus.textContent = "Giá trị không hợp lệ (mid < high, 0–100).";
      settingsStatus.className = "status err";
      return;
    }
    drHigh = newHigh;
    drMid = newMid;
    localStorage.setItem("btvn.settings",
      JSON.stringify({ drHigh: drHigh, drMid: drMid }));
    settingsStatus.textContent = "Đã lưu ✓";
    settingsStatus.className = "status ok";
    // Re-render currently visible tables with new thresholds.
    rerenderAll();
  }

  function resetSettings() {
    drHigh = 50; drMid = 20;
    localStorage.removeItem("btvn.settings");
    drHighInput.value = drHigh;
    drMidInput.value = drMid;
    settingsStatus.textContent = "Đã đặt lại mặc định ✓";
    settingsStatus.className = "status ok";
    rerenderAll();
  }

  if (saveSettingsBtn) saveSettingsBtn.addEventListener("click", persistSettings);
  if (resetSettingsBtn) resetSettingsBtn.addEventListener("click", resetSettings);
  loadSettings();

  let lastUserData = null;
  let lastDemoData = null;
  function rerenderAll() {
    if (lastUserData) {
      const p = lastUserData.preview || {};
      renderDetailTable(p.detail || [], "detail-table");
      renderSummaryTable(p.summary || [], "summary-table");
    }
    if (lastDemoData) {
      const p = lastDemoData.preview || {};
      renderDetailTable(p.detail || [], "demo-detail-table");
      renderSummaryTable(p.summary || [], "demo-summary-table");
    }
  }

  function setStatus(text, kind) {
    statusEl.textContent = text || "";
    statusEl.className = "status" + (kind ? " " + kind : "");
  }

  function formatBytes(n) {
    if (!n) return "";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return n.toFixed(n < 10 ? 1 : 0) + " " + units[i];
  }

  function setFile(file) {
    if (!file) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    drop.classList.add("has-file");
    dropHint.innerHTML =
      "✓ <strong>" + file.name + "</strong> · " + formatBytes(file.size);
  }

  // --- File picker / drag & drop ---
  pickBtn.addEventListener("click", function (e) {
    e.preventDefault();
    fileInput.click();
  });
  drop.addEventListener("click", function (e) {
    if (e.target === pickBtn) return;
    fileInput.click();
  });
  fileInput.addEventListener("change", function () {
    if (fileInput.files && fileInput.files[0]) setFile(fileInput.files[0]);
  });

  ["dragenter", "dragover"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
      drop.classList.add("dragging");
    });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
      drop.classList.remove("dragging");
    });
  });
  drop.addEventListener("drop", function (e) {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) setFile(f);
  });

  // --- Submit ---
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    resultCard.classList.add("hidden");

    if (!fileInput.files || !fileInput.files[0]) {
      setStatus("Bạn chưa chọn file backlinks.", "err");
      return;
    }
    submitBtn.disabled = true;
    setStatus("Đang xử lý…", "working");

    const fd = new FormData(form);
    try {
      const res = await fetch("/api/audit", { method: "POST", body: fd });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        setStatus(data.error || ("Lỗi máy chủ (" + res.status + ")"), "err");
        return;
      }
      renderResult(data);
      setStatus("Hoàn tất ✓", "ok");
    } catch (err) {
      setStatus("Lỗi mạng: " + err.message, "err");
    } finally {
      submitBtn.disabled = false;
    }
  });

  function escapeHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;",
               '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function drClass(dr) {
    const n = Number(dr) || 0;
    if (n >= drHigh) return "dr-high";
    if (n >= drMid) return "dr-mid";
    return "";
  }

  function formatDR(dr) {
    if (dr == null || dr === "") return "—";
    const n = Number(dr);
    if (Number.isNaN(n)) return String(dr);
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  function renderDetailTable(detail, hostId) {
    const host = document.getElementById(hostId || "detail-table");
    if (!detail || !detail.length) {
      host.innerHTML = '<div class="preview-empty">Không có backlink chất lượng phù hợp.</div>';
      return;
    }
    const html = detail.map(function (g) {
      const rows = g.rows.map(function (r, i) {
        const cls = drClass(r.dr) || (i % 2 === 1 ? "dr-zebra" : "");
        const refHost = (function () {
          try { return new URL(r.ref_url).host.replace(/^www\./, ""); }
          catch (e) { return r.ref_url; }
        })();
        return '<tr class="' + cls + '">' +
          '<td class="num">' + r.stt + '</td>' +
          '<td>' + escapeHTML(r.anchor) + '</td>' +
          '<td class="url"><a href="' + escapeHTML(r.ref_url) +
            '" target="_blank" rel="noopener" title="' + escapeHTML(r.ref_url) +
            '">' + escapeHTML(refHost) + '</a></td>' +
          '<td class="dr">' + formatDR(r.dr) + '</td>' +
          '<td class="date">' + escapeHTML(r.first_seen) + '</td>' +
          '</tr>';
      }).join("");
      return '<div class="preview-group">' +
        '<div class="preview-group-head"><span class="chev">▼</span>' +
        '<span>📌 ' + escapeHTML(g.target) + '</span>' +
        '<span class="count">' + g.count + ' backlink</span></div>' +
        '<table><thead><tr>' +
          '<th class="num">STT</th><th>Anchor Text</th>' +
          '<th>URL nguồn</th><th class="dr">DR</th>' +
          '<th class="date">Ngày</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>' +
        '</div>';
    }).join("");
    host.innerHTML = html;
  }

  function renderSummaryTable(summary, hostId) {
    const host = document.getElementById(hostId || "summary-table");
    if (!summary || !summary.length) {
      host.innerHTML = '<div class="preview-empty">Không có dữ liệu tổng hợp.</div>';
      return;
    }
    const html = summary.map(function (g) {
      const rows = g.rows.map(function (r, i) {
        const cls = drClass(r.dr_max) || (i % 2 === 1 ? "dr-zebra" : "");
        return '<tr class="' + cls + '">' +
          '<td class="num">' + r.stt + '</td>' +
          '<td>' + escapeHTML(r.domain) + '</td>' +
          '<td class="dr">' + r.count + '</td>' +
          '<td class="dr">' + formatDR(r.dr_max) + '</td>' +
          '</tr>';
      }).join("");
      return '<div class="preview-group">' +
        '<div class="preview-group-head"><span class="chev">▼</span>' +
        '<span>📌 ' + escapeHTML(g.target_path) + '</span>' +
        '<span class="count">' + g.total_links + ' link / ' +
        g.domain_count + ' domain</span></div>' +
        '<table><thead><tr>' +
          '<th class="num">STT</th><th>Domain nguồn</th>' +
          '<th class="dr">Số link</th><th class="dr">DR (max)</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>' +
        '</div>';
    }).join("");
    host.innerHTML = html;
  }

  // Collapse/expand group headers (event-delegated, works for both panels).
  document.addEventListener("click", function (e) {
    const head = e.target.closest(".preview-group-head");
    if (head) head.parentElement.classList.toggle("collapsed");
  });

  // Tab switching for any group of .result-tabs — works for both the user's
  // result section and the demo showcase by scoping selectors to the parent.
  document.querySelectorAll(".result-tabs").forEach(function (group) {
    const scope = group.parentElement;
    const attr = group.querySelector(".tab[data-demo-tab]")
      ? "data-demo-tab" : "data-result-tab";
    group.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        const name = tab.getAttribute(attr);
        group.querySelectorAll(".tab").forEach(function (t) {
          t.classList.toggle("active", t === tab);
        });
        scope.querySelectorAll(".result-panel").forEach(function (p) {
          p.classList.toggle("active", p.getAttribute(attr) === name);
        });
      });
    });
  });

  function buildStatsHTML(stats, inputLabel) {
    const items = [
      [inputLabel, stats.input_rows],
      ["Backlink chất lượng", stats.kept_rows],
      ["Target URL", stats.target_urls],
      ["Tổng link giữ lại", stats.total_links],
      ["Dòng tổng hợp domain", stats.total_domain_rows],
    ];
    return items.map(function (it) {
      return '<div class="stat"><div class="label">' + it[0] +
             '</div><div class="value">' + (it[1] != null ? it[1] : "—") +
             "</div></div>";
    }).join("");
  }

  function renderResult(data) {
    lastUserData = data;
    const s = data.stats || {};
    const inputLabel = data.source === "ahrefs"
      ? "Backlink từ Ahrefs" : "Dòng đầu vào";
    statsEl.innerHTML = buildStatsHTML(s, inputLabel);
    downloadLink.href = data.download_url;
    downloadLink.setAttribute("download", data.filename || "audit.xlsx");

    const preview = data.preview || {};
    renderDetailTable(preview.detail || [], "detail-table");
    renderSummaryTable(preview.summary || [], "summary-table");

    resultCard.classList.remove("hidden");
    resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });

    loadHistory();
  }

  // --- Tab switching ---
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tab-panel");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const name = tab.getAttribute("data-tab");
      tabs.forEach(function (t) { t.classList.toggle("active", t === tab); });
      panels.forEach(function (p) {
        p.classList.toggle("active", p.getAttribute("data-tab") === name);
      });
    });
  });

  // --- Ahrefs form ---
  const ahrefsForm = document.getElementById("ahrefs-form");
  const ahrefsSubmit = document.getElementById("ahrefs-submit");
  const ahrefsStatus = document.getElementById("ahrefs-status");

  function setAhrefsStatus(text, kind) {
    ahrefsStatus.textContent = text || "";
    ahrefsStatus.className = "status" + (kind ? " " + kind : "");
  }

  // --- Demo showcase (auto-loads bundled TGDĐ + Reno15 sample on page open) ---
  async function loadDemoShowcase() {
    const statsHost = document.getElementById("demo-stats");
    try {
      const res = await fetch("/api/demo");
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        statsHost.innerHTML =
          '<div class="preview-empty">Không tải được dữ liệu mẫu: ' +
          escapeHTML(data.error || res.status) + "</div>";
        return;
      }
      lastDemoData = data;
      statsHost.innerHTML = buildStatsHTML(data.stats || {}, "Dòng đầu vào");
      const dl = document.getElementById("demo-download");
      dl.href = data.download_url;
      dl.setAttribute("download", data.filename || "demo.xlsx");
      const preview = data.preview || {};
      renderDetailTable(preview.detail || [], "demo-detail-table");
      renderSummaryTable(preview.summary || [], "demo-summary-table");
    } catch (err) {
      statsHost.innerHTML =
        '<div class="preview-empty">Lỗi mạng khi tải mẫu: ' +
        escapeHTML(err.message) + "</div>";
    }
  }
  loadDemoShowcase();

  // --- Audit history (DB-backed) -------------------------------------------
  const historyHost = document.getElementById("history-table");
  const historyRefreshBtn = document.getElementById("history-refresh");

  function formatHistoryDate(s) {
    if (!s) return "—";
    const d = new Date(s);
    if (isNaN(d.getTime())) return String(s);
    return d.toLocaleString("vi-VN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function renderHistoryTable(items) {
    if (!historyHost) return;
    if (!items || !items.length) {
      historyHost.innerHTML =
        '<div class="preview-empty">Chưa có lần audit nào được lưu.</div>';
      return;
    }
    const rows = items.map(function (it) {
      const sourceLabel = it.source === "ahrefs"
        ? "Ahrefs API"
        : (it.source === "demo" ? "Demo" : "Upload");
      const target = it.source === "ahrefs"
        ? (it.domain || "—")
        : (it.product_label || it.keyword || "—");
      const dl = it.download_url
        ? '<a class="link-btn" href="' + escapeHTML(it.download_url) +
          '" download>⇩ Tải</a>'
        : '<span class="muted">đã dọn</span>';
      return '<tr>' +
        '<td>' + escapeHTML(formatHistoryDate(it.created_at)) + '</td>' +
        '<td>' + escapeHTML(sourceLabel) + '</td>' +
        '<td>' + escapeHTML(target) + '</td>' +
        '<td>' + escapeHTML(it.keyword || "") + '</td>' +
        '<td class="num">' + (it.kept_rows ?? "—") + '</td>' +
        '<td class="num">' + (it.target_urls ?? "—") + '</td>' +
        '<td class="num">' + (it.total_links ?? "—") + '</td>' +
        '<td>' + dl + ' · ' +
        '<button type="button" class="link-btn history-del" data-id="' +
        it.id + '">✕ Xoá</button></td>' +
        '</tr>';
    }).join("");

    historyHost.innerHTML =
      '<table class="history">' +
      '<thead><tr>' +
      '<th>Thời gian</th><th>Nguồn</th><th>Domain / Nhãn</th>' +
      '<th>Từ khoá</th><th class="num">Giữ lại</th>' +
      '<th class="num">Target</th><th class="num">Tổng link</th>' +
      '<th>Hành động</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  async function loadHistory() {
    if (!historyHost) return;
    try {
      const res = await fetch("/api/history?limit=100");
      const data = await res.json().catch(function () { return {}; });
      if (res.status === 503) {
        historyHost.innerHTML =
          '<div class="preview-empty">⚙️ ' +
          escapeHTML(data.error || "Database chưa cấu hình.") + "</div>";
        return;
      }
      if (!res.ok) {
        historyHost.innerHTML =
          '<div class="preview-empty">Không tải được lịch sử: ' +
          escapeHTML(data.error || res.status) + "</div>";
        return;
      }
      renderHistoryTable(data.items || []);
    } catch (err) {
      historyHost.innerHTML =
        '<div class="preview-empty">Lỗi mạng: ' + escapeHTML(err.message) + "</div>";
    }
  }

  if (historyRefreshBtn) {
    historyRefreshBtn.addEventListener("click", loadHistory);
  }

  if (historyHost) {
    historyHost.addEventListener("click", async function (e) {
      const btn = e.target.closest(".history-del");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      if (!id || !confirm("Xoá bản ghi này khỏi lịch sử?")) return;
      btn.disabled = true;
      try {
        const res = await fetch("/api/history/" + encodeURIComponent(id), {
          method: "DELETE",
        });
        if (!res.ok) {
          alert("Xoá thất bại (" + res.status + ").");
          btn.disabled = false;
          return;
        }
        loadHistory();
      } catch (err) {
        alert("Lỗi mạng: " + err.message);
        btn.disabled = false;
      }
    });
  }

  loadHistory();

  // --- Claude-powered analysis -------------------------------------------------
  const analyzeBtn = document.getElementById("analyze-btn");
  const analysisSection = document.getElementById("analysis-section");
  const analysisStatus = document.getElementById("analysis-status");
  const analysisContent = document.getElementById("analysis-content");
  const analysisDownload = document.getElementById("analysis-download");
  let lastReport = "";
  let lastReportFilename = "bao-cao-backlink.md";

  function renderMarkdownSafe(md) {
    const lines = String(md || "").split("\n");
    const out = [];
    let listType = null;
    function closeList() {
      if (listType === "ul") out.push("</ul>");
      else if (listType === "ol") out.push("</ol>");
      listType = null;
    }
    function inline(text) {
      return escapeHTML(text)
        .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
        .replace(/`([^`\n]+)`/g, "<code>$1</code>");
    }
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { closeList(); continue; }
      let m;
      if ((m = line.match(/^(#{1,4})\s+(.+)$/))) {
        closeList();
        const lvl = m[1].length;
        out.push("<h" + lvl + ">" + inline(m[2]) + "</h" + lvl + ">");
        continue;
      }
      if ((m = line.match(/^[-*]\s+(.+)$/))) {
        if (listType !== "ul") { closeList(); out.push("<ul>"); listType = "ul"; }
        out.push("<li>" + inline(m[1]) + "</li>");
        continue;
      }
      if ((m = line.match(/^(\d+)\.\s+(.+)$/))) {
        if (listType !== "ol") { closeList(); out.push("<ol>"); listType = "ol"; }
        out.push("<li>" + inline(m[2]) + "</li>");
        continue;
      }
      closeList();
      out.push("<p>" + inline(line) + "</p>");
    }
    closeList();
    return out.join("\n");
  }

  function setAnalysisStatus(text, kind) {
    if (!analysisStatus) return;
    analysisStatus.textContent = text || "";
    analysisStatus.className = "status" + (kind ? " " + kind : "");
  }

  function pickAnalysisLabel(data) {
    if (data.product_label) return data.product_label;
    if (data.domain) return data.domain;
    const fn = data.filename || "";
    const m = fn.match(/chi_tiet_anchor_backlink_(.+?)__[a-z0-9]+\.xlsx$/i);
    return m ? m[1].replace(/_/g, " ") : "Backlink Profile";
  }

  async function runAnalyze() {
    const data = lastUserData || lastDemoData;
    if (!data) {
      alert("Chưa có dữ liệu audit. Hãy chạy audit hoặc xem demo trước.");
      return;
    }
    const label = pickAnalysisLabel(data);
    lastReportFilename = "bao-cao-backlink-" +
      label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") +
      ".md";

    analyzeBtn.disabled = true;
    analysisSection.classList.remove("hidden");
    analysisContent.innerHTML = "";
    analysisDownload.disabled = true;
    setAnalysisStatus("Đang gọi Claude (có thể mất 10–30 giây)…", "working");
    analysisSection.scrollIntoView({ behavior: "smooth", block: "nearest" });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats: data.stats || {},
          preview: data.preview || {},
          label: label,
          domain: data.domain || null,
        }),
      });
      const result = await res.json().catch(function () { return {}; });
      if (res.status === 503) {
        setAnalysisStatus("⚙️ " + (result.error || "Chưa cấu hình ANTHROPIC_API_KEY."), "err");
        return;
      }
      if (!res.ok) {
        setAnalysisStatus(result.error || ("Lỗi (" + res.status + ")"), "err");
        return;
      }
      lastReport = result.report || "";
      analysisContent.innerHTML = renderMarkdownSafe(lastReport);
      analysisDownload.disabled = !lastReport;
      const u = result.usage || {};
      const cached = (u.cache_read_input_tokens || 0) > 0
        ? " · cache hit " + u.cache_read_input_tokens + " tok" : "";
      setAnalysisStatus(
        "Hoàn tất ✓ · " + (result.model || "claude") + " · " +
        (u.input_tokens || 0) + "→" + (u.output_tokens || 0) + " tokens" + cached,
        "ok"
      );
    } catch (err) {
      setAnalysisStatus("Lỗi mạng: " + err.message, "err");
    } finally {
      analyzeBtn.disabled = false;
    }
  }

  if (analyzeBtn) analyzeBtn.addEventListener("click", runAnalyze);

  if (analysisDownload) {
    analysisDownload.addEventListener("click", function () {
      if (!lastReport) return;
      const blob = new Blob([lastReport], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = lastReportFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  ahrefsForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    resultCard.classList.add("hidden");

    const payload = {
      domain: document.getElementById("ahrefs-domain").value.trim(),
      api_key: document.getElementById("ahrefs-key").value.trim(),
      keyword: document.getElementById("ahrefs-keyword").value.trim(),
      product_label: document.getElementById("ahrefs-label").value.trim(),
      mode: document.getElementById("ahrefs-mode").value,
      limit: parseInt(document.getElementById("ahrefs-limit").value, 10) || 1000,
    };

    if (!payload.domain || !payload.api_key || !payload.keyword) {
      setAhrefsStatus("Vui lòng nhập đủ domain, API key và từ khoá.", "err");
      return;
    }

    ahrefsSubmit.disabled = true;
    setAhrefsStatus("Đang gọi Ahrefs API…", "working");

    try {
      const res = await fetch("/api/audit-ahrefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        setAhrefsStatus(data.error || ("Lỗi (" + res.status + ")"), "err");
        return;
      }
      renderResult(data);
      setAhrefsStatus("Hoàn tất ✓ " + (data.domain || ""), "ok");
    } catch (err) {
      setAhrefsStatus("Lỗi mạng: " + err.message, "err");
    } finally {
      ahrefsSubmit.disabled = false;
    }
  });
})();
