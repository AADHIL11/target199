/**
 * TARGET200 — app.js
 * Daily study tracker · Class 12 · March 2027 public exam
 *
 * Sections:
 *  1. Config & syllabus data
 *  2. Storage helpers
 *  3. Auth
 *  4. Shell / navigation
 *  5. Welcome popup
 *  6. Today page
 *  7. Syllabus page
 *  8. Study session + face detection
 *  9. Progress page
 * 10. Helpers & DOM init
 */

import {
  FaceDetector,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm";

/* ============================================================
   1. CONFIG & SYLLABUS DATA
   ============================================================ */

/** Demo accounts — edit freely. */
const ACCOUNTS = {
  STU001: { password: "maths199",   name: "Arun Kumar" },
  STU002: { password: "physics199", name: "Priya S." },
  STU003: { password: "chem199",    name: "Karthik R." },
};

const EXAM_DATE        = new Date("2027-03-01T00:00:00");
const DAILY_GOAL_SECS  = 3 * 3600;   // 3 hours
const BLOCK_SECS       = 90 * 60;    // auto-break after 90 min
const BREAK_SECS       = 30 * 60;    // break is 30 min
const FACE_GRACE_SECS  = 5;          // grace period before pause
const FACE_POLL_MS     = 500;        // ~2 detections per second
const SAVE_INTERVAL_MS = 30_000;     // auto-save every 30 s

/** Full syllabus — Subject → Chapter → [topics] */
const SYLLABUS = {
  Maths: {
    "1. Applications of Matrices and Determinants": [
      "Rank of a matrix", "Consistency of linear equations",
      "Cramer's rule", "Gaussian elimination method",
    ],
    "2. Complex Numbers": [
      "Rectangular form", "Polar form",
      "De Moivre's theorem", "Roots of complex numbers",
    ],
    "3. Theory of Equations": [
      "Polynomial roots", "Relations between roots and coefficients",
      "Descartes' rule of signs",
    ],
    "4. Inverse Trigonometric Functions": [
      "Domain and range", "Principal values", "Graphs", "Basic properties",
    ],
    "5. Two Dimensional Analytical Geometry-II": [
      "Conics", "Parabola", "Ellipse", "Hyperbola", "Tangents", "Normals",
    ],
    "6. Applications of Vector Algebra": [
      "Scalar triple product", "Vector triple product",
      "Equations of lines", "Equations of planes",
    ],
    "7. Applications of Differential Calculus": [
      "Rates of change", "Rolle's theorem", "Mean value theorem",
      "L'Hôpital's rule", "Curve sketching",
    ],
    "8. Differentials and Partial Derivatives": [
      "Linear approximation", "Total differentials",
      "Partial derivatives", "Euler's theorem on homogeneous functions",
    ],
    "9. Applications of Integration": [
      "Definite integrals", "Reduction formulas",
      "Area under plane curves", "Volumes of solids of revolution",
    ],
    "10. Ordinary Differential Equations": [
      "Order and degree", "Variable separable method",
      "First-order linear differential equations",
    ],
    "11. Probability Distributions": [
      "Random variables", "Probability density functions",
      "Mathematical expectation", "Mean and variance",
    ],
    "12. Discrete Mathematics": [
      "Binary operations", "Mathematical logic",
      "Truth tables", "Tautologies and contradictions",
    ],
  },
  Physics: {
    "1. Electrostatics": [
      "Electric charges", "Coulomb's law", "Electric field",
      "Electric potential", "Gauss's law", "Capacitors",
    ],
    "2. Current Electricity": [
      "Ohm's law", "Drift velocity", "Kirchhoff's rules",
      "Wheatstone bridge", "Potentiometer",
    ],
    "3. Magnetism and Magnetic Effects of Electric Current": [
      "Lorentz force", "Ampere's circuital law", "Cyclotron",
      "Magnetic field due to a circular current loop", "Earth's magnetism",
    ],
    "4. Electromagnetic Induction and Alternating Current": [
      "Faraday's laws", "Lenz's law", "Self and mutual induction",
      "AC generators", "Transformers", "LCR circuits",
    ],
    "5. Electromagnetic Waves": [
      "Displacement current", "Maxwell's equations", "Electromagnetic spectrum",
    ],
    "6. Ray Optics": [
      "Reflection and refraction at spherical surfaces", "Total internal reflection",
      "Thin lenses", "Prism", "Optical instruments",
    ],
    "7. Wave Optics": [
      "Wavefronts", "Huygens's principle",
      "Young's double-slit experiment", "Diffraction",
    ],
    "8. Dual Nature of Radiation and Matter": [
      "Electron emission", "Photoelectric effect",
      "Einstein's photoelectric equation", "de Broglie wavelength of matter waves",
    ],
    "9. Atomic and Nuclear Physics": [
      "Atomic spectra", "Rutherford and Bohr model", "Radioactivity",
      "Mass defect and nuclear binding energy", "Nuclear fission", "Nuclear fusion",
    ],
    "10. Electronics and Communication Systems": [
      "Semiconductor diodes", "Transistor characteristics", "Logic gates",
      "Principles of communication", "Modulation and demodulation",
    ],
    "11. Recent Developments in Physics": [
      "Nanoscience", "Nanotechnology", "Robotics",
    ],
  },
  Chemistry: {
    "1. Metallurgy": [
      "Principles of metal extraction", "Concentration of ores",
      "Refining and zone refining", "Ellingham diagram", "Hall-Heroult process",
    ],
    "2. p-Block Elements I": [
      "Group 13 general trends", "Group 14 general trends",
      "Compounds of boron", "Compounds of carbon",
    ],
    "3. p-Block Elements II": [
      "Group 15 elements", "Group 16 elements", "Group 17 elements",
      "Group 18 elements", "Important oxoacids and halides",
    ],
    "4. Transition and Inner Transition Elements": [
      "d-block elements", "f-block elements (lanthanides and actinides)",
      "Potassium permanganate (KMnO4)", "Potassium dichromate (K2Cr2O7)",
    ],
    "5. Coordination Chemistry": [
      "Werner's theory", "IUPAC nomenclature",
      "Valence Bond Theory (VBT)", "Crystal Field Theory (CFT)",
    ],
    "6. Solid State": [
      "Crystal lattices", "Unit cells", "Close-packed structures",
      "Packing efficiency", "Point and crystal defects",
    ],
    "7. Chemical Kinetics": [
      "Rate of a reaction", "Integrated rate equations", "Half-life period",
      "Collision theory", "Arrhenius equation",
    ],
    "8. Ionic Equilibrium": [
      "Acids and bases", "pH scale", "Buffer solutions",
      "Solubility product (Ksp)", "Common ion effect",
    ],
    "9. Electrochemistry": [
      "Specific and molar conductance", "Kohlrausch's law", "Nernst equation",
      "Electrochemical cells", "Secondary batteries", "Corrosion",
    ],
    "10. Surface Chemistry": [
      "Adsorption (physisorption and chemisorption)", "Catalysis",
      "Colloids", "Emulsion properties",
    ],
    "11. Hydroxy Compounds and Ethers": [
      "Classification", "Alcohols", "Phenols", "Ethers",
    ],
    "12. Carbonyl Compounds and Carboxylic Acids": [
      "Aldehydes and ketones", "Carboxylic acids", "Nucleophilic addition",
      "Cannizzaro reaction", "Aldol condensation", "Acid derivatives",
    ],
    "13. Organic Nitrogen Compounds": [
      "Nitro compounds", "Amines", "Diazonium salts", "Cyanides and isocyanides",
    ],
    "14. Biomolecules": [
      "Carbohydrates", "Proteins and amino acids",
      "Nucleic acids (DNA and RNA)", "Vitamins",
    ],
    "15. Chemistry in Everyday Life": [
      "Chemicals in medicines", "Food additives", "Cleansing agents",
    ],
  },
};

/* ============================================================
   2. STORAGE HELPERS
   ============================================================ */

/** Mutable session state — single source of truth for UI */
const state = {
  studentId:           null,
  name:                null,
  // Study session
  sessionSubject:      null,
  sessionChapter:      null,
  sessionTopic:        null,
  sessionSeconds:      0,       // delta since last flush (reset on flush)
  sessionTotalSeconds: 0,       // total for this session (never reset, for auto-mark)
  sessionBlockSeconds: 0,       // seconds since last break
  sessionRunning:      false,
  sessionPaused:       true,
  // Face detection
  facePresent:         false,
  faceAbsentSince:     null,    // ms timestamp when face last disappeared
  faceDetector:        null,
  faceStream:          null,
  facePollId:          null,
  // Timers
  tickId:              null,
  saveId:              null,
  // Break
  breakActive:         false,
  breakRemaining:      BREAK_SECS,
  breakTickId:         null,
};

const storageKey = (suffix) => `target200_${state.studentId}_${suffix}`;
const todayStr   = ()        => new Date().toISOString().slice(0, 10);
const dateStr    = (d)       => d.toISOString().slice(0, 10);

const getJSON  = (k, def = {}) => JSON.parse(localStorage.getItem(k) || JSON.stringify(def));
const setJSON  = (k, v)        => localStorage.setItem(k, JSON.stringify(v));

const getStudiedTopics  = ()  => getJSON(storageKey("topics"), {});
const saveStudiedTopics = (v) => setJSON(storageKey("topics"), v);
const getTimeData       = ()  => getJSON(storageKey("time"), {});
const saveTimeData      = (v) => setJSON(storageKey("time"), v);
const getTopicTimeData  = ()  => getJSON(storageKey("topicTime"), {});
const saveTopicTimeData = (v) => setJSON(storageKey("topicTime"), v);
const getTodayList      = ()  => getJSON(storageKey("todayList_" + todayStr()), []);
const saveTodayList     = (v) => setJSON(storageKey("todayList_" + todayStr()), v);
const getTodayDone      = ()  => getJSON(storageKey("todayDone_" + todayStr()), {});
const saveTodayDone     = (v) => setJSON(storageKey("todayDone_" + todayStr()), v);

/* ============================================================
   3. AUTH
   ============================================================ */

function doLogin(id, pwd) {
  const acc = ACCOUNTS[id.trim().toUpperCase()];
  if (!acc || acc.password !== pwd) return false;
  state.studentId = id.trim().toUpperCase();
  state.name      = acc.name;
  setJSON("target200_session", { studentId: state.studentId, name: state.name });
  return true;
}

function restoreSession() {
  const raw = localStorage.getItem("target200_session");
  if (!raw) return false;
  try {
    const s = JSON.parse(raw);
    if (!s || !ACCOUNTS[s.studentId]) return false;
    state.studentId = s.studentId;
    state.name      = s.name;
    return true;
  } catch (_) { return false; }
}

function doLogout() {
  teardownSession(true);
  state.studentId = state.name = null;
  localStorage.removeItem("target200_session");
  showScreen("login");
}

/* ============================================================
   4. SHELL / NAVIGATION
   ============================================================ */

let currentPage = "today";

const $ = (id) => document.getElementById(id);

function showScreen(screen) {
  $("login-screen").classList.toggle("hidden", screen !== "login");
  $("app").classList.toggle("hidden", screen !== "app");
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  $("page-" + page)?.classList.add("active");
  document.querySelectorAll("[data-page]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });
  if (page === "today")    renderToday();
  if (page === "syllabus") renderSyllabus();
  if (page === "progress") renderProgress();
  if (page === "study" && !state.sessionRunning) resetStudySetup();
}

function daysLeft() {
  return Math.max(0, Math.ceil((EXAM_DATE - new Date()) / 86_400_000));
}

function updateDaysChips() {
  const d   = daysLeft();
  const txt = `${d} days left`;
  $("days-chip").textContent          = txt;
  $("sidebar-days-chip").textContent  = txt;
  $("wp-days").textContent            = d;
}

/* ============================================================
   5. WELCOME POPUP
   ============================================================ */

function showWelcomePopup() {
  updateDaysChips();
  $("welcome-popup").classList.remove("hidden");
}

/* ============================================================
   6. TODAY PAGE
   ============================================================ */

function renderToday() {
  // Greeting
  const h = new Date().getHours();
  const gr = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  $("today-greeting").textContent = `${gr}, ${state.name.split(" ")[0]}!`;
  $("today-subline").textContent  = motivationalLine();

  // Time data
  const timeData = getTimeData();
  const today    = todayStr();
  const dayTime  = timeData[today] || {};
  const maths    = dayTime.Maths    || 0;
  const physics  = dayTime.Physics  || 0;
  const chem     = dayTime.Chemistry|| 0;
  const totalSecs= maths + physics + chem;

  // Goal ring (circumference of r=52 circle ≈ 326.7)
  const C = 326.7;
  const pct = Math.min(totalSecs / DAILY_GOAL_SECS, 1);
  $("ring-fill").style.strokeDashoffset = C * (1 - pct);
  $("ring-time-text").textContent       = formatDuration(totalSecs);

  // Subject bars
  const subMax = Math.max(maths, physics, chem, 1);
  $("bar-maths").style.width   = (maths   / subMax * 100) + "%";
  $("bar-physics").style.width = (physics / subMax * 100) + "%";
  $("bar-chem").style.width    = (chem    / subMax * 100) + "%";
  $("time-maths").textContent   = formatDuration(maths);
  $("time-physics").textContent = formatDuration(physics);
  $("time-chem").textContent    = formatDuration(chem);

  // Streak
  $("streak-number").textContent = computeStreak();

  // Completion
  const { done, total } = computeOverallCompletion();
  const cpct = total > 0 ? Math.round(done / total * 100) : 0;
  $("completion-pct").textContent  = cpct + "%";
  $("completion-bar").style.width  = cpct + "%";

  renderTodayTopics();
}

function motivationalLine() {
  const d = daysLeft();
  if (d <= 10)  return `${d} days to the exam — finish strong.`;
  if (d <= 30)  return "The final stretch — every hour counts.";
  if (d <= 60)  return "Stay consistent. Small sessions add up.";
  return "Build the habit now. March 2027 is counting on you.";
}

function computeStreak() {
  const td = getTimeData();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d  = new Date(); d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    const day = td[ds] || {};
    const tot = (day.Maths||0) + (day.Physics||0) + (day.Chemistry||0);
    if (tot < DAILY_GOAL_SECS) break;
    streak++;
  }
  return streak;
}

function computeOverallCompletion() {
  const studied = getStudiedTopics();
  let done = 0, total = 0;
  for (const subj of Object.keys(SYLLABUS))
    for (const ch of Object.keys(SYLLABUS[subj]))
      for (const t of SYLLABUS[subj][ch]) {
        total++;
        if (studied[`${subj}|${ch}|${t}`]) done++;
      }
  return { done, total };
}

function renderTodayTopics() {
  const list      = getTodayList();
  const done      = getTodayDone();
  const carryover = getCarryoverTopics();
  const allKeys   = [...new Set([...carryover.map(c => c.key), ...list])];

  const container = $("today-topics-list");
  const empty     = $("today-topics-empty");

  if (allKeys.length === 0) {
    container.innerHTML = "";
    empty.classList.remove("hidden");
    container.appendChild(empty);
    return;
  }
  empty.classList.add("hidden");
  container.innerHTML = "";

  allKeys.forEach(k => {
    const [subj, ch, topic] = k.split("|");
    const isDone = !!done[k];
    const co     = carryover.find(c => c.key === k);

    const el  = document.createElement("div");
    el.className = "topic-item" + (isDone ? " done" : "");
    el.innerHTML = `
      <input type="checkbox" ${isDone ? "checked" : ""} aria-label="${escHtml(topic)}">
      <div class="topic-item-text">
        <div class="topic-item-name">${escHtml(topic)}</div>
        <div class="topic-item-meta">${escHtml(subj)} · ${escHtml(ch)}</div>
      </div>
      ${co ? `<span class="carryover-tag">Carried over · ${co.days}d</span>` : ""}
    `;
    el.querySelector("input").addEventListener("change", cb => {
      const d = getTodayDone();
      if (cb.target.checked) d[k] = true; else delete d[k];
      saveTodayDone(d);
      el.classList.toggle("done", cb.target.checked);
    });
    container.appendChild(el);
  });
}

function getCarryoverTopics() {
  const result = [], seen = new Set(), now = new Date();
  for (let i = 1; i <= 30; i++) {
    const d  = new Date(now); d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    const pastList = getJSON(storageKey("todayList_" + ds), []);
    const pastDone = getJSON(storageKey("todayDone_" + ds), {});
    for (const k of pastList)
      if (!pastDone[k] && !seen.has(k)) { seen.add(k); result.push({ key: k, days: i }); }
  }
  return result;
}

/* ============================================================
   7. SYLLABUS PAGE
   ============================================================ */

let syllabusSubject = "Maths";

function renderSyllabus() {
  const studied    = getStudiedTopics();
  const topicTimes = getTopicTimeData();

  // Overall bar
  const { done, total } = computeOverallCompletion();
  const op = total ? Math.round(done / total * 100) : 0;
  $("overall-pct-text").textContent        = op + "%";
  $("overall-progress-bar").style.width    = op + "%";

  // Tabs
  document.querySelectorAll("#syllabus-tabs .tab-btn").forEach(btn => {
    const active = btn.dataset.subject === syllabusSubject;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active);
  });

  // Subject progress
  const chapters = SYLLABUS[syllabusSubject];
  let sDone = 0, sTotal = 0;
  for (const ch of Object.keys(chapters))
    for (const t of chapters[ch]) {
      sTotal++;
      if (studied[`${syllabusSubject}|${ch}|${t}`]) sDone++;
    }
  const spct = sTotal ? Math.round(sDone / sTotal * 100) : 0;
  $("tab-subject-name").textContent  = syllabusSubject;
  $("tab-subject-pct").textContent   = spct + "%";
  const tabBar = $("tab-subject-bar");
  tabBar.style.width = spct + "%";
  tabBar.className   = `subject-tab-bar bar-${syllabusSubject.toLowerCase()}`;

  // Chapter list
  const container = $("chapter-list");
  container.innerHTML = "";

  for (const [chapter, topics] of Object.entries(chapters)) {
    let chDone = 0;
    topics.forEach(t => { if (studied[`${syllabusSubject}|${chapter}|${t}`]) chDone++; });
    const chPct = Math.round(chDone / topics.length * 100);

    const details = document.createElement("details");
    details.className = "chapter-card";

    const summary = document.createElement("summary");
    summary.className = "chapter-summary";
    summary.innerHTML = `
      <span class="chapter-name">${escHtml(chapter)}</span>
      <span class="chapter-progress-info">
        <span>${chDone}/${topics.length}</span>
        <span class="chapter-mini-bar-track">
          <span class="chapter-mini-bar bar-${syllabusSubject.toLowerCase()}" style="width:${chPct}%"></span>
        </span>
      </span>
      <svg class="chapter-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    `;

    const topicsDiv = document.createElement("div");
    topicsDiv.className = "chapter-topics";

    topics.forEach(topic => {
      const tk       = `${syllabusSubject}|${chapter}|${topic}`;
      const isStudied = !!studied[tk];

      // Aggregate time for this topic across all dates
      let topicSecs = 0;
      for (const [k, v] of Object.entries(topicTimes))
        if (k.slice(11) === tk) topicSecs += v;  // "YYYY-MM-DD|tk"

      const row = document.createElement("div");
      row.className = "topic-row";
      row.innerHTML = `
        <input type="checkbox" ${isStudied ? "checked" : ""} aria-label="${escHtml(topic)}">
        <span class="topic-row-name">${escHtml(topic)}</span>
        <span class="topic-row-time">${topicSecs >= 60 ? formatDuration(topicSecs) : ""}</span>
      `;
      row.querySelector("input").addEventListener("change", cb => {
        const s = getStudiedTopics();
        if (cb.target.checked) s[tk] = true; else delete s[tk];
        saveStudiedTopics(s);
        renderSyllabus();
      });
      topicsDiv.appendChild(row);
    });

    details.appendChild(summary);
    details.appendChild(topicsDiv);
    container.appendChild(details);
  }
}

/* ============================================================
   8. STUDY SESSION + FACE DETECTION
   ============================================================ */

function resetStudySetup() {
  $("study-setup").classList.remove("hidden");
  $("study-session").classList.add("hidden");
  $("camera-preview-wrap").classList.add("hidden");
  $("face-banner").classList.add("hidden");
  $("camera-error").classList.add("hidden");
  document.querySelectorAll(".subject-btn").forEach(b =>
    b.classList.remove("selected-maths", "selected-physics", "selected-chem")
  );
  $("chapter-topic-card").style.display  = "none";
  $("btn-start-session").style.display   = "none";
  $("sel-chapter").innerHTML             = "<option value=''>— Select chapter —</option>";
  $("sel-topic").style.display           = "none";
  state.sessionSubject = state.sessionChapter = state.sessionTopic = null;
}

function buildChapterSelect(subject) {
  const sel = $("sel-chapter");
  sel.innerHTML = "<option value=''>— Select chapter —</option>";
  Object.keys(SYLLABUS[subject]).forEach(ch => {
    const o = document.createElement("option");
    o.value = o.textContent = ch;
    sel.appendChild(o);
  });
  $("sel-topic").style.display = "none";
  $("btn-start-session").style.display = "none";
}

function buildTopicSelect(subject, chapter) {
  const sel = $("sel-topic");
  sel.innerHTML = "<option value=''>— Select topic —</option>";
  SYLLABUS[subject][chapter].forEach(t => {
    const o = document.createElement("option");
    o.value = o.textContent = t;
    sel.appendChild(o);
  });
  sel.style.display = "block";
  $("btn-start-session").style.display = "none";
}

/** Start a study session */
async function beginSession() {
  const { sessionSubject: subject, sessionChapter: chapter, sessionTopic: topic } = state;
  if (!subject || !chapter || !topic) return;

  // Switch to session view
  $("study-setup").classList.add("hidden");
  $("study-session").classList.remove("hidden");
  $("session-subject-label").textContent = subject;
  $("session-topic-label").textContent   = topic;
  $("timer-display").textContent         = "0:00:00";
  $("timer-status-text").textContent     = "Starting camera…";
  $("face-banner").classList.add("hidden");
  $("camera-error").classList.add("hidden");
  $("break-overlay").classList.add("hidden");

  // Reset session counters; start paused — timer won't run until face detected
  state.sessionSeconds       = 0;
  state.sessionTotalSeconds  = 0;
  state.sessionBlockSeconds  = 0;
  state.sessionRunning       = true;
  state.sessionPaused        = true;  // wait for face
  state.facePresent          = false;
  state.faceAbsentSince      = null;
  state.breakActive          = false;

  // Auto-save interval
  state.saveId = setInterval(flushSessionTime, SAVE_INTERVAL_MS);

  await initCamera();
}

/** Request camera and boot MediaPipe */
async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } },
      audio: false,
    });
    state.faceStream = stream;
    const video = $("camera-video");
    video.srcObject = stream;
    await video.play();

    $("camera-preview-wrap").classList.remove("hidden");
    $("timer-status-text").textContent = "Loading face detector…";

    if (!state.faceDetector) await loadFaceDetector();

    $("timer-status-text").textContent = "Waiting for your face…";
    startFacePoll();

  } catch (err) {
    console.warn("Camera error:", err);
    $("camera-error").classList.remove("hidden");
    $("timer-status-text").textContent = "Camera unavailable";
  }
}

/** One-time MediaPipe init */
async function loadFaceDetector() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  state.faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "./models/blaze_face_short_range.tflite",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    minDetectionConfidence: 0.5,
  });
}

/** Start periodic face detection */
function startFacePoll() {
  clearInterval(state.facePollId);
  state.facePollId = setInterval(() => {
    if (!state.sessionRunning || state.breakActive) return;
    const video = $("camera-video");
    if (!state.faceDetector || video.readyState < 2) return;
    try {
      const result = state.faceDetector.detectForVideo(video, performance.now());
      handleFace(result.detections?.length > 0);
    } catch (_) { /* occasional frame decode errors — ignore */ }
  }, FACE_POLL_MS);
}

/** React to current face-presence result */
function handleFace(present) {
  const ind = $("face-indicator");
  if (present) {
    state.facePresent     = true;
    state.faceAbsentSince = null;
    ind.classList.remove("no-face");
    ind.classList.add("has-face");
    // Resume if we were paused due to face absence
    if (state.sessionPaused && state.sessionRunning && !state.breakActive) {
      resumeTimer();
    }
  } else {
    ind.classList.remove("has-face");
    ind.classList.add("no-face");
    if (!state.faceAbsentSince) state.faceAbsentSince = Date.now();
    if ((Date.now() - state.faceAbsentSince) / 1000 >= FACE_GRACE_SECS && !state.sessionPaused) {
      pauseTimer("face");
    }
    state.facePresent = false;
  }
}

/** Tick the study clock every second */
function startTimerTick() {
  if (state.tickId) return; // already running
  state.tickId = setInterval(() => {
    if (!state.sessionRunning || state.sessionPaused || state.breakActive) return;
    state.sessionSeconds++;
    state.sessionTotalSeconds++;
    state.sessionBlockSeconds++;
    $("timer-display").textContent = formatHMS(state.sessionTotalSeconds);
    if (state.sessionBlockSeconds >= BLOCK_SECS) startBreak(true);
  }, 1000);
}

function stopTimerTick() {
  clearInterval(state.tickId);
  state.tickId = null;
}

function resumeTimer() {
  state.sessionPaused = false;
  $("face-banner").classList.add("hidden");
  $("timer-status-text").textContent = "Timer running";
  startTimerTick();
}

function pauseTimer(reason) {
  state.sessionPaused = true;
  stopTimerTick();
  flushSessionTime();
  if (reason === "face") {
    $("face-banner").classList.remove("hidden");
  }
  $("timer-status-text").textContent = "Timer paused";
}

/** Write accumulated delta seconds to localStorage then reset the delta counter */
function flushSessionTime() {
  const secs = state.sessionSeconds; // delta since last flush
  if (!state.sessionSubject || secs <= 0) return;

  const today    = todayStr();
  const timeData = getTimeData();
  if (!timeData[today]) timeData[today] = { Maths: 0, Physics: 0, Chemistry: 0 };
  timeData[today][state.sessionSubject] = (timeData[today][state.sessionSubject] || 0) + secs;
  saveTimeData(timeData);

  const topicTimes = getTopicTimeData();
  const tk = `${today}|${state.sessionSubject}|${state.sessionChapter}|${state.sessionTopic}`;
  topicTimes[tk] = (topicTimes[tk] || 0) + secs;
  saveTopicTimeData(topicTimes);

  // Auto-mark as studied after 5 minutes of cumulative session time
  if (state.sessionTotalSeconds >= 300) {
    const studied = getStudiedTopics();
    const topicKey = `${state.sessionSubject}|${state.sessionChapter}|${state.sessionTopic}`;
    if (!studied[topicKey]) {
      studied[topicKey] = true;
      saveStudiedTopics(studied);
    }
  }

  state.sessionSeconds = 0; // reset delta; sessionTotalSeconds keeps running
}

/** Fully tear down the active session */
function teardownSession(silent = false) {
  if (!state.sessionRunning && !silent) return;
  flushSessionTime();
  stopTimerTick();
  clearInterval(state.saveId);
  clearInterval(state.facePollId);
  clearInterval(state.breakTickId);
  state.facePollId = state.saveId = state.breakTickId = null;

  if (state.faceStream) {
    state.faceStream.getTracks().forEach(t => t.stop());
    state.faceStream = null;
  }
  const video = $("camera-video");
  video.srcObject = null;

  state.sessionRunning  = false;
  state.sessionPaused   = true;
  state.breakActive     = false;
  state.facePresent     = false;
  state.faceAbsentSince = null;

  $("camera-preview-wrap").classList.add("hidden");
  $("break-overlay").classList.add("hidden");
  $("face-banner").classList.add("hidden");
}

/* ----- Break ----- */

function startBreak(auto = false) {
  if (state.breakActive) return;
  state.breakActive         = true;
  state.breakRemaining      = BREAK_SECS;
  state.sessionBlockSeconds = 0;

  pauseTimer("break");

  // Stop camera during break (saves battery / privacy)
  clearInterval(state.facePollId);
  if (state.faceStream) {
    state.faceStream.getTracks().forEach(t => t.stop());
    state.faceStream = null;
  }
  $("camera-preview-wrap").classList.add("hidden");
  $("face-banner").classList.add("hidden");

  $("break-overlay").classList.remove("hidden");
  updateBreakDisplay();

  state.breakTickId = setInterval(() => {
    state.breakRemaining--;
    updateBreakDisplay();
    if (state.breakRemaining <= 0) {
      clearInterval(state.breakTickId);
      endBreak();
      playChime();
    }
  }, 1000);
}

function updateBreakDisplay() {
  const m = String(Math.floor(state.breakRemaining / 60)).padStart(2, "0");
  const s = String(state.breakRemaining % 60).padStart(2, "0");
  $("break-timer-display").textContent = `${m}:${s}`;
}

function endBreak() {
  clearInterval(state.breakTickId);
  state.breakActive = false;
  $("break-overlay").classList.add("hidden");
  if (state.sessionRunning) {
    // Restart camera + detection
    initCamera();
  }
}

/** Gentle 4-note chime via Web Audio API */
function playChime() {
  try {
    const ctx   = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type   = "sine";
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.28;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.15, t0 + 0.05);
      gain.gain.linearRampToValueAtTime(0,    t0 + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.7);
    });
  } catch (_) {}
}

/* ============================================================
   9. PROGRESS PAGE
   ============================================================ */

let progressPeriod = "today";

function renderProgress() {
  const { m, p, c } = getPeriodTotals(progressPeriod);
  const total   = m + p + c;
  const subMax  = Math.max(m, p, c, 1);

  $("progress-total-time").textContent = formatDuration(total);

  $("prog-bar-maths").style.width   = (m / subMax * 100) + "%";
  $("prog-bar-physics").style.width = (p / subMax * 100) + "%";
  $("prog-bar-chem").style.width    = (c / subMax * 100) + "%";
  $("prog-time-maths").textContent   = formatDuration(m);
  $("prog-time-physics").textContent = formatDuration(p);
  $("prog-time-chem").textContent    = formatDuration(c);

  renderTopTopics();
}

function getPeriodTotals(period) {
  const td   = getTimeData();
  const now  = new Date();
  const days = period === "today" ? 1 : period === "week" ? 7 : 30;
  let m = 0, p = 0, c = 0;
  for (let i = 0; i < days; i++) {
    const d  = new Date(now); d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    const day = td[ds] || {};
    m += day.Maths    || 0;
    p += day.Physics  || 0;
    c += day.Chemistry|| 0;
  }
  return { m, p, c };
}

function renderTopTopics() {
  const topicTimes = getTopicTimeData();
  const byTopic    = {};

  // key format: "YYYY-MM-DD|Subject|Chapter|Topic" (11 chars for date + pipe)
  for (const [k, v] of Object.entries(topicTimes)) {
    const tk = k.slice(11); // strip date prefix "YYYY-MM-DD|"
    byTopic[tk] = (byTopic[tk] || 0) + v;
  }

  const sorted = Object.entries(byTopic).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const container = $("top-topics-list");

  if (!sorted.length) {
    container.innerHTML = '<p class="empty-state">No study time recorded yet.</p>';
    return;
  }
  container.innerHTML = "";
  sorted.forEach(([tk, secs], idx) => {
    const parts   = tk.split("|");
    const subject = parts[0];
    const topic   = parts[parts.length - 1];
    const el = document.createElement("div");
    el.className  = "top-topic-item";
    el.innerHTML  = `
      <span class="top-topic-rank">#${idx + 1}</span>
      <div class="top-topic-info">
        <div class="top-topic-name">${escHtml(topic)}</div>
        <div class="top-topic-subject">
          <span class="subject-dot dot-${subject.toLowerCase()}"></span>
          ${escHtml(subject)}
        </div>
      </div>
      <span class="top-topic-time">${formatDuration(secs)}</span>
    `;
    container.appendChild(el);
  });
}

/* ============================================================
   10. HELPERS & DOM INIT
   ============================================================ */

const formatDuration = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${s}s`;
};
const formatHMS = (s) =>
  `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const escHtml = (str) =>
  String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

/* ---------- DOM ready ---------- */
document.addEventListener("DOMContentLoaded", () => {

  /* Login */
  $("login-form").addEventListener("submit", e => {
    e.preventDefault();
    const id  = $("inp-student-id").value;
    const pwd = $("inp-password").value;
    const err = $("login-error");
    if (doLogin(id, pwd)) {
      err.classList.add("hidden");
      launchApp();
    } else {
      err.textContent = "Hmm, that Student ID or password doesn't look right. Try again.";
      err.classList.remove("hidden");
    }
  });

  /* Settings */
  const openSettings = () => {
    $("settings-name").textContent = state.name;
    $("settings-id").textContent   = state.studentId;
    $("settings-panel").classList.remove("hidden");
  };
  $("btn-settings").addEventListener("click", openSettings);
  $("sidebar-settings-btn").addEventListener("click", openSettings);
  $("btn-close-settings").addEventListener("click", () => $("settings-panel").classList.add("hidden"));
  $("btn-logout").addEventListener("click", doLogout);

  /* Welcome popup */
  $("btn-start-studying").addEventListener("click", () => {
    $("welcome-popup").classList.add("hidden");
    navigateTo("today");
  });

  /* Nav */
  document.querySelectorAll("[data-page]").forEach(btn =>
    btn.addEventListener("click", () => navigateTo(btn.dataset.page))
  );

  /* Syllabus tabs */
  document.querySelectorAll("#syllabus-tabs .tab-btn").forEach(btn =>
    btn.addEventListener("click", () => {
      syllabusSubject = btn.dataset.subject;
      renderSyllabus();
    })
  );

  /* Study: subject buttons */
  document.querySelectorAll(".subject-btn").forEach(btn =>
    btn.addEventListener("click", () => {
      const subj = btn.dataset.subject;
      state.sessionSubject = subj;
      document.querySelectorAll(".subject-btn").forEach(b =>
        b.classList.remove("selected-maths","selected-physics","selected-chem")
      );
      btn.classList.add(`selected-${subj.toLowerCase()}`);
      $("chapter-topic-card").style.display = "block";
      buildChapterSelect(subj);
      state.sessionChapter = state.sessionTopic = null;
    })
  );

  /* Study: chapter picker */
  $("sel-chapter").addEventListener("change", e => {
    const ch = e.target.value;
    if (!ch) return;
    state.sessionChapter = ch;
    buildTopicSelect(state.sessionSubject, ch);
    state.sessionTopic = null;
  });

  /* Study: topic picker */
  $("sel-topic").addEventListener("change", e => {
    state.sessionTopic = e.target.value;
    $("btn-start-session").style.display = state.sessionTopic ? "inline-flex" : "none";
  });

  /* Study: start / stop / break */
  $("btn-start-session").addEventListener("click", beginSession);
  $("btn-stop-session").addEventListener("click", () => {
    teardownSession();
    resetStudySetup();
    renderToday();
  });
  $("btn-break").addEventListener("click", () => startBreak(false));
  $("btn-end-break").addEventListener("click", endBreak);

  /* Camera retry */
  $("btn-retry-camera").addEventListener("click", () => {
    $("camera-error").classList.add("hidden");
    initCamera();
  });

  /* Tab visibility — pause when hidden */
  document.addEventListener("visibilitychange", () => {
    if (!state.sessionRunning || state.breakActive) return;
    if (document.hidden) {
      pauseTimer("tab");
    } else if (state.facePresent) {
      // Only auto-resume if face was present before hiding
      resumeTimer();
    }
  });

  /* Progress period tabs */
  document.querySelectorAll(".period-tab").forEach(btn =>
    btn.addEventListener("click", () => {
      progressPeriod = btn.dataset.period;
      document.querySelectorAll(".period-tab").forEach(b => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn);
      });
      renderProgress();
    })
  );

  /* Add-topic modal */
  $("btn-add-topic").addEventListener("click", () => {
    $("add-topic-modal").classList.remove("hidden");
    $("modal-sel-subject").value = "";
    $("modal-sel-chapter").innerHTML = "<option value=''>— Chapter —</option>";
    $("modal-sel-topic").innerHTML   = "<option value=''>— Topic —</option>";
  });
  $("btn-close-add-topic").addEventListener("click", () => $("add-topic-modal").classList.add("hidden"));
  $("add-topic-modal").addEventListener("click", e => {
    if (e.target === $("add-topic-modal")) $("add-topic-modal").classList.add("hidden");
  });

  $("modal-sel-subject").addEventListener("change", e => {
    const subj   = e.target.value;
    const chSel  = $("modal-sel-chapter");
    const tSel   = $("modal-sel-topic");
    chSel.innerHTML = "<option value=''>— Chapter —</option>";
    tSel.innerHTML  = "<option value=''>— Topic —</option>";
    if (!subj) return;
    Object.keys(SYLLABUS[subj]).forEach(ch => {
      const o = document.createElement("option");
      o.value = o.textContent = ch;
      chSel.appendChild(o);
    });
  });

  $("modal-sel-chapter").addEventListener("change", e => {
    const subj  = $("modal-sel-subject").value;
    const ch    = e.target.value;
    const tSel  = $("modal-sel-topic");
    tSel.innerHTML = "<option value=''>— Topic —</option>";
    if (!subj || !ch) return;
    SYLLABUS[subj][ch].forEach(t => {
      const o = document.createElement("option");
      o.value = o.textContent = t;
      tSel.appendChild(o);
    });
  });

  $("btn-add-topic-confirm").addEventListener("click", () => {
    const subj  = $("modal-sel-subject").value;
    const ch    = $("modal-sel-chapter").value;
    const topic = $("modal-sel-topic").value;
    if (!subj || !ch || !topic) return;
    const k    = `${subj}|${ch}|${topic}`;
    const list = getTodayList();
    if (!list.includes(k)) { list.push(k); saveTodayList(list); }
    $("add-topic-modal").classList.add("hidden");
    renderTodayTopics();
  });

  /* Boot */
  if (restoreSession()) {
    launchApp();
  } else {
    showScreen("login");
  }
});

/** Launch the app after successful auth */
function launchApp() {
  showScreen("app");
  updateDaysChips();
  showWelcomePopup();
  navigateTo("today");
}
