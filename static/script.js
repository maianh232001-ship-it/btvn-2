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

  function renderResult(data) {
    const s = data.stats || {};
    const inputLabel = data.source === "ahrefs"
      ? "Backlink từ Ahrefs"
      : "Dòng đầu vào";
    const items = [
      [inputLabel, s.input_rows],
      ["Backlink chất lượng", s.kept_rows],
      ["Target URL", s.target_urls],
      ["Tổng link giữ lại", s.total_links],
      ["Dòng tổng hợp domain", s.total_domain_rows],
    ];
    statsEl.innerHTML = items.map(function (it) {
      return '<div class="stat"><div class="label">' + it[0] +
             '</div><div class="value">' + (it[1] != null ? it[1] : "—") +
             "</div></div>";
    }).join("");
    downloadLink.href = data.download_url;
    downloadLink.setAttribute("download", data.filename || "audit.xlsx");
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
