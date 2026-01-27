(function () {
  "use strict";

  // Elements
  const elHours = document.getElementById("hours");
  const elMinutes = document.getElementById("minutes");
  const elSeconds = document.getElementById("seconds");
  const elMs = document.getElementById("milliseconds");

  const btnStart = document.getElementById("btn-start");
  const btnReset = document.getElementById("btn-reset");
  const btnLap = document.getElementById("btn-lap");

  const lapsTitle = document.getElementById("laps-title");
  const lapsList = document.getElementById("laps-list");

  // State
  let running = false;
  let elapsed = 0; // total ms elapsed
  let startTimestamp = 0;
  let rafId = null;
  let laps = []; // each entry: { lapTime, totalTime }
  let lapStart = 0;

  // Format helpers
  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return { h: pad2(h), m: pad2(m), s: pad2(s), ms: pad2(centis) };
  }

  function formatTimeString(ms) {
    const t = formatTime(ms);
    return t.h + ":" + t.m + ":" + t.s + "." + t.ms;
  }

  // Rendering
  function updateDisplay(ms) {
    const t = formatTime(ms);
    elHours.textContent = t.h;
    elMinutes.textContent = t.m;
    elSeconds.textContent = t.s;
    elMs.textContent = t.ms;
  }

  function tick(timestamp) {
    if (!running) return;
    const now = performance.now();
    const current = elapsed + (now - startTimestamp);
    updateDisplay(current);
    rafId = requestAnimationFrame(tick);
  }

  function currentElapsed() {
    if (running) {
      return elapsed + (performance.now() - startTimestamp);
    }
    return elapsed;
  }

  // Start / Stop
  function start() {
    running = true;
    startTimestamp = performance.now();
    if (elapsed === 0) {
      lapStart = 0;
    }
    btnStart.textContent = "ストップ";
    btnStart.classList.add("running");
    btnReset.disabled = false;
    btnLap.disabled = false;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    elapsed += performance.now() - startTimestamp;
    cancelAnimationFrame(rafId);
    btnStart.textContent = "スタート";
    btnStart.classList.remove("running");
    btnLap.disabled = true;
  }

  function reset() {
    running = false;
    elapsed = 0;
    lapStart = 0;
    laps = [];
    cancelAnimationFrame(rafId);
    updateDisplay(0);
    btnStart.textContent = "スタート";
    btnStart.classList.remove("running");
    btnReset.disabled = true;
    btnLap.disabled = true;
    lapsList.innerHTML = "";
    lapsTitle.hidden = true;
  }

  // Laps
  function addLap() {
    const total = currentElapsed();
    const lapTime = total - lapStart;
    lapStart = total;
    laps.push({ lapTime, totalTime: total });
    renderLaps();
  }

  function renderLaps() {
    if (laps.length === 0) {
      lapsTitle.hidden = true;
      return;
    }
    lapsTitle.hidden = false;

    // Find best/worst lap (only if 2+ laps)
    let bestIdx = -1;
    let worstIdx = -1;
    if (laps.length >= 2) {
      let min = Infinity;
      let max = -Infinity;
      laps.forEach(function (l, i) {
        if (l.lapTime < min) { min = l.lapTime; bestIdx = i; }
        if (l.lapTime > max) { max = l.lapTime; worstIdx = i; }
      });
    }

    lapsList.innerHTML = "";
    // Show newest first
    for (let i = laps.length - 1; i >= 0; i--) {
      const l = laps[i];
      const li = document.createElement("li");
      li.className = "lap-item";
      if (i === bestIdx) li.classList.add("lap-best");
      if (i === worstIdx) li.classList.add("lap-worst");

      li.innerHTML =
        '<span class="lap-number">ラップ ' + (i + 1) + "</span>" +
        '<span class="lap-split">' + formatTimeString(l.totalTime) + "</span>" +
        '<span class="lap-time">' + formatTimeString(l.lapTime) + "</span>";
      lapsList.appendChild(li);
    }
  }

  // Event listeners
  btnStart.addEventListener("click", function () {
    if (running) {
      stop();
    } else {
      start();
    }
  });

  btnReset.addEventListener("click", reset);
  btnLap.addEventListener("click", addLap);

  // Keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space") {
      e.preventDefault();
      if (running) stop(); else start();
    } else if (e.code === "KeyR" && !running && elapsed > 0) {
      reset();
    } else if (e.code === "KeyL" && running) {
      addLap();
    }
  });

  // Register service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function (err) {
        console.log("SW registration failed:", err);
      });
    });
  }
})();
