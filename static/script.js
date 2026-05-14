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
    if (n >= 50) return "dr-high";
    if (n >= 20) return "dr-mid";
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
