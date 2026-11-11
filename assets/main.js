/* =========================================================
   yan — personal site
   vanilla JS · no dependencies
   ========================================================= */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* ---------- year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- header / progress ---------- */
  const header = $("#site-header");
  const progressBar = $(".scroll-progress span");
  const sections = $$("main section[id]");
  const navLinks = $$(".nav a");
  let sectionTops = [];
  let ticking = false;

  function measureSections() {
    sectionTops = sections.map((section) => section.getBoundingClientRect().top + window.scrollY);
  }

  function updateScrollUI() {
    const scrollY = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    if (header) header.classList.toggle("is-scrolled", scrollY > 18);

    if (progressBar) {
      const ratio = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      progressBar.style.transform = "scaleX(" + ratio + ")";
    }

    if (sectionTops.length) {
      const marker = scrollY + window.innerHeight * 0.38;
      let activeIndex = 0;
      for (let i = 0; i < sectionTops.length; i += 1) {
        if (sectionTops[i] <= marker) activeIndex = i;
      }
      const activeId = sections[activeIndex] ? sections[activeIndex].id : "";
      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === "#" + activeId;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateScrollUI();
      ticking = false;
    });
  }

  measureSections();
  updateScrollUI();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    measureSections();
    updateScrollUI();
  });
  window.addEventListener("load", () => {
    measureSections();
    updateScrollUI();
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      measureSections();
      updateScrollUI();
    });
  }

  /* ---------- mobile menu ---------- */
  const menuToggle = $(".menu-toggle");
  const nav = $("#nav");
  let menuFocusTimer = null;

  function setMenu(open, returnFocus) {
    if (!menuToggle || !nav) return;
    menuToggle.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    window.clearTimeout(menuFocusTimer);

    if (open) {
      const firstLink = nav.querySelector("a");
      if (firstLink) {
        menuFocusTimer = window.setTimeout(() => firstLink.focus({ preventScroll: true }), 60);
      }
    } else if (returnFocus) {
      menuToggle.focus({ preventScroll: true });
    }
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setMenu(false, true);
      }
    });

    const desktopQuery = window.matchMedia("(min-width: 901px)");
    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", (event) => {
        if (event.matches) setMenu(false);
      });
    }
  }

  /* ---------- reveal on scroll ---------- */
  const revealItems = $$(".reveal");

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  /* ---------- terminal typing ---------- */
  const terminalBody = $("#terminal-body");

  const terminalScript = [
    { type: "cmd", text: "whoami" },
    { type: "out", html: '<span class="t-name">yan</span>' },
    { type: "cmd", text: "cat ~/.profile" },
    { type: "out", html: '<span class="t-key">major</span><span class="t-dim"> : </span>信息技术安全' },
    { type: "out", html: '<span class="t-key">focus</span><span class="t-dim"> : </span>web security · ctf' },
    { type: "out", html: '<span class="t-key">state</span><span class="t-dim"> : </span><span class="t-warn">cache_garbage</span> <span class="t-dim">(still running)</span>' },
    { type: "cmd", text: "cat ~/.motto" },
    { type: "out", html: '<span class="t-ok">"占着内存，偶尔命中。"</span>' },
    { type: "prompt" }
  ];

  function buildPromptLine() {
    const line = document.createElement("div");
    line.className = "t-line";

    const prompt = document.createElement("span");
    prompt.className = "t-prompt";
    prompt.textContent = "guest@yan";

    const separator = document.createElement("span");
    separator.className = "t-dim";
    separator.textContent = ":~$ ";

    const command = document.createElement("span");
    command.className = "t-cmd";

    line.append(prompt, separator, command);
    return { line, command };
  }

  function buildOutputLine(html) {
    const line = document.createElement("div");
    line.className = "t-line t-out";
    line.innerHTML = html;
    return line;
  }

  function buildFinalPrompt() {
    const { line, command } = buildPromptLine();
    const cursor = document.createElement("span");
    cursor.className = "t-cursor";
    cursor.setAttribute("aria-hidden", "true");
    command.appendChild(cursor);
    return line;
  }

  async function typeCommand(commandEl, text) {
    for (let i = 0; i < text.length; i += 1) {
      commandEl.textContent += text.charAt(i);
      await wait(32 + Math.round(Math.random() * 26));
    }
  }

  async function runTerminal() {
    if (!terminalBody) return;
    terminalBody.replaceChildren();

    if (reduceMotion.matches) {
      terminalScript.forEach((step) => {
        if (step.type === "cmd") {
          const { line, command } = buildPromptLine();
          command.textContent = step.text;
          terminalBody.appendChild(line);
        } else if (step.type === "out") {
          terminalBody.appendChild(buildOutputLine(step.html));
        } else {
          terminalBody.appendChild(buildFinalPrompt());
        }
      });
      return;
    }

    await wait(420);

    for (const step of terminalScript) {
      if (step.type === "cmd") {
        const { line, command } = buildPromptLine();
        terminalBody.appendChild(line);
        await typeCommand(command, step.text);
        await wait(260);
      } else if (step.type === "out") {
        terminalBody.appendChild(buildOutputLine(step.html));
        await wait(110);
      } else {
        terminalBody.appendChild(buildFinalPrompt());
      }
    }
  }

  runTerminal();

  /* ---------- terminal tilt ---------- */
  const terminalWrap = $(".terminal-wrap");
  const terminal = $(".terminal");

  if (terminalWrap && terminal && finePointer.matches && !reduceMotion.matches) {
    terminalWrap.addEventListener("pointermove", (event) => {
      const rect = terminalWrap.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      terminal.style.transform =
        "perspective(1200px) rotateY(" + (px * 5.5).toFixed(2) + "deg) rotateX(" + (-py * 5.5).toFixed(2) + "deg)";
    });

    terminalWrap.addEventListener("pointerleave", () => {
      terminal.style.transform = "";
    });
  }

  /* ---------- cursor glow ---------- */
  const cursorGlow = $(".cursor-glow");

  if (cursorGlow && finePointer.matches) {
    let glowX = 0;
    let glowY = 0;
    let currentX = 0;
    let currentY = 0;
    let glowFrame = null;

    function animateGlow() {
      currentX += (glowX - currentX) * 0.12;
      currentY += (glowY - currentY) * 0.12;
      cursorGlow.style.transform =
        "translate3d(calc(" + currentX.toFixed(1) + "px - 50%), calc(" + currentY.toFixed(1) + "px - 50%), 0)";

      if (Math.abs(glowX - currentX) > 0.5 || Math.abs(glowY - currentY) > 0.5) {
        glowFrame = window.requestAnimationFrame(animateGlow);
      } else {
        glowFrame = null;
      }
    }

    window.addEventListener(
      "pointermove",
      (event) => {
        glowX = event.clientX;
        glowY = event.clientY;
        if (glowFrame === null) glowFrame = window.requestAnimationFrame(animateGlow);
      },
      { passive: true }
    );
  }

  /* ---------- card spotlight ---------- */
  if (finePointer.matches) {
    $$(".spotlight").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", (event.clientX - rect.left).toFixed(0) + "px");
        card.style.setProperty("--my", (event.clientY - rect.top).toFixed(0) + "px");
      });
    });
  }

  /* ---------- copy email ---------- */
  const copyButton = $("#copy-email");
  const toast = $("#toast");
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-show"), 2800);
  }

  function legacyCopy(text) {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-1000px";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    field.remove();
    return copied;
  }

  if (copyButton) {
    const defaultCopyMarkup = copyButton.innerHTML;
    let copyResetTimer = null;

    copyButton.addEventListener("click", async () => {
      const email = copyButton.getAttribute("data-email") || "hi@yan.dev";
      let copied = false;

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(email);
          copied = true;
        } catch (error) {
          copied = legacyCopy(email);
        }
      } else {
        copied = legacyCopy(email);
      }

      showToast(copied ? "邮箱已复制：" + email : "复制失败，请手动选择邮箱地址");

      if (copied) {
        window.clearTimeout(copyResetTimer);
        copyButton.innerHTML =
          '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>已复制';
        copyResetTimer = window.setTimeout(() => {
          copyButton.innerHTML = defaultCopyMarkup;
        }, 2000);
      }
    });
  }

  /* ---------- easter egg: type "sudo" ---------- */
  let typedBuffer = "";

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement) {
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || target.isContentEditable) return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1) return;

    typedBuffer = (typedBuffer + event.key.toLowerCase()).slice(-4);
    if (typedBuffer !== "sudo") return;
    typedBuffer = "";

    showToast("权限不足：你只是一块缓存垃圾 :)");

    const title = $(".hero-title");
    if (title && typeof title.animate === "function" && !reduceMotion.matches) {
      title.animate(
        [
          { transform: "translate(0, 0)", filter: "hue-rotate(0deg)" },
          { transform: "translate(-4px, 1px)", filter: "hue-rotate(28deg)" },
          { transform: "translate(4px, -1px)", filter: "hue-rotate(-24deg)" },
          { transform: "translate(0, 0)", filter: "hue-rotate(0deg)" }
        ],
        { duration: 420, easing: "steps(3, end)" }
      );
    }
  });

  /* ---------- opening film ---------- */
  const intro = $("#intro");

  if (intro) {
    const introVideo = $("#intro-video");
    const introSkip = $("#intro-skip");
    const introSound = $("#intro-sound");
    const introProgress = $("#intro-progress");
    const introTime = $("#intro-time");
    const pageMain = $("#main");
    const pageHeader = $("#site-header");
    let introFinished = false;
    let introFallback = null;

    const formatTime = (seconds) => {
      if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
      const minutes = Math.floor(seconds / 60);
      const rest = Math.floor(seconds % 60);
      return String(minutes).padStart(2, "0") + ":" + String(rest).padStart(2, "0");
    };

    const updateIntroProgress = () => {
      if (!introVideo || !introProgress) return;
      const duration = introVideo.duration;
      const current = introVideo.currentTime;
      const ratio = Number.isFinite(duration) && duration > 0 ? Math.min(1, current / duration) : 0;
      introProgress.style.width = (ratio * 100).toFixed(2) + "%";
      if (introTime) {
        introTime.textContent = formatTime(current) + " / " + formatTime(duration || 6.22);
      }
    };

    const finishIntro = () => {
      if (introFinished) return;
      introFinished = true;
      window.clearTimeout(introFallback);
      if (introVideo) introVideo.pause();
      intro.classList.add("is-leaving");
      document.documentElement.classList.remove("intro-active");
      if (pageMain) pageMain.inert = false;
      if (pageHeader) pageHeader.inert = false;
      try {
        sessionStorage.setItem("yan-intro-seen", "1");
      } catch (error) {
        /* storage may be unavailable */
      }
      window.setTimeout(() => {
        intro.remove();
      }, 950);
    };

    if (document.documentElement.classList.contains("intro-seen")) {
      intro.remove();
      if (pageMain) pageMain.inert = false;
      if (pageHeader) pageHeader.inert = false;
    } else {
      if (pageMain) pageMain.inert = true;
      if (pageHeader) pageHeader.inert = true;
      introFallback = window.setTimeout(finishIntro, reduceMotion.matches ? 6000 : 9000);

      if (reduceMotion.matches && introSkip) {
        introSkip.innerHTML = "进入网站 <span>ENTER</span> →";
      }

      if (introVideo) {
        introVideo.volume = 0.7;
        introVideo.addEventListener("timeupdate", updateIntroProgress);
        introVideo.addEventListener("loadedmetadata", updateIntroProgress);
        introVideo.addEventListener("ended", () => window.setTimeout(finishIntro, 550));
        introVideo.addEventListener(
          "error",
          () => {
            intro.classList.add("intro-no-video");
            window.clearTimeout(introFallback);
            introFallback = window.setTimeout(finishIntro, 4000);
          },
          { once: true }
        );

        if (reduceMotion.matches) {
          introVideo.pause();
          introVideo.currentTime = 2.5;
        } else {
          const playPromise = introVideo.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
              /* autoplay may be blocked; the skip button and timer remain */
            });
          }
        }
      }

      if (introSkip) {
        introSkip.addEventListener("click", finishIntro);
      }

      if (introSound && introVideo) {
        introSound.addEventListener("click", () => {
          const muted = !introVideo.muted;
          introVideo.muted = muted;
          introSound.setAttribute("aria-pressed", String(!muted));
          introSound.textContent = muted ? "声音 OFF" : "声音 ON";
          if (introVideo.paused && !reduceMotion.matches) {
            introVideo.play().catch(() => null);
          }
        });
      }

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") finishIntro();
      });
    }
  }

  /* ---------- music wall ---------- */
  const music = $(".music");
  const musicAudio = $("#music-audio");

  if (music && musicAudio) {
    const audioFile = (name) => "assets/audio/" + encodeURIComponent(name);

    const tracks = [
      {
        id: "aimer-kataomoi",
        title: "カタオモイ",
        artist: "Aimer",
        code: "YAN—001",
        index: "01",
        duration: "03:27",
        desc: "Aimer",
        src: audioFile("Aimer - カタオモイ.mp3")
      },
      {
        id: "akie-june",
        title: "六月",
        artist: "Akie秋绘",
        code: "YAN—002",
        index: "02",
        duration: "04:03",
        desc: "Akie秋绘",
        src: audioFile("Akie秋绘_-_六月.mp3")
      },
      {
        id: "gem-together",
        title: "多远都要在一起",
        artist: "G.E.M. 邓紫棋",
        code: "YAN—003",
        index: "03",
        duration: "03:38",
        desc: "G.E.M. 邓紫棋",
        src: audioFile("G.E.M. 邓紫棋 - 多远都要在一起.mp3")
      },
      {
        id: "supercell-hoshizora",
        title: "星が瞬くこんな夜に",
        artist: "supercell",
        code: "YAN—004",
        index: "04",
        duration: "02:22",
        desc: "supercell",
        src: audioFile("supercell - 星が瞬くこんな夜に.mp3")
      },
      {
        id: "yukana-minamo",
        title: "minamo",
        artist: "ゆかな",
        code: "YAN—005",
        index: "05",
        duration: "05:42",
        desc: "ゆかな",
        src: audioFile("ゆかな_-_minamo.mp3")
      },
      {
        id: "hoshizora",
        title: "星が瞬くこんな夜に",
        artist: "未知歌手",
        code: "YAN—006",
        index: "06",
        duration: "03:51",
        desc: "未知歌手",
        src: audioFile("星が瞬くこんな夜に.mp3")
      },
      {
        id: "jukai-mori",
        title: "あなたがいた森",
        artist: "樹海",
        code: "YAN—007",
        index: "07",
        duration: "04:59",
        desc: "樹海",
        src: audioFile("樹海 - あなたがいた森 (曾有你的森林).mp3")
      },
      {
        id: "wenlan-summer",
        title: "夏天的风",
        artist: "温岚",
        code: "YAN—008",
        index: "08",
        duration: "04:01",
        desc: "温岚",
        src: audioFile("温岚 - 夏天的风.mp3")
      },
      {
        id: "fragrance",
        title: "フレグランス",
        artist: "茉ひる RINZO",
        code: "YAN—009",
        index: "09",
        duration: "03:26",
        desc: "茉ひる RINZO",
        src: audioFile("茉ひる_RINZO_-_フレグランス_(.mp3")
      },
      {
        id: "sobainiiru",
        title: "そばにいる",
        artist: "青山テルマ & SoulJa",
        code: "YAN—010",
        index: "10",
        duration: "05:00",
        desc: "青山テルマ & SoulJa",
        src: audioFile("青山テルマ&SoulJa_-_そばにいる.mp3")
      }
    ];

    const musicVisual = $("#music-visual");
    const musicTitle = $("#music-title");
    const musicDesc = $("#music-desc");
    const musicCode = $("#album-code");
    const musicIndex = $("#album-index");
    const musicStatusText = $("#music-status-text");
    const musicToggle = $("#music-toggle");
    const musicPrev = $("#music-prev");
    const musicNext = $("#music-next");
    const musicMute = $("#music-mute");
    const musicProgress = $("#music-progress");
    const musicCurrent = $("#music-current");
    const musicDuration = $("#music-duration");
    const trackList = $("#track-list");
    const trackRows = [];
    let currentTrack = 0;
    let musicLoaded = false;

    const formatTrackTime = (seconds) => {
      if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
      return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");
    };

    const renderTrackRows = () => {
      if (!trackList) return;
      trackList.replaceChildren();
      trackRows.length = 0;

      tracks.forEach((track, index) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "track-row";
        row.dataset.track = track.id;
        row.setAttribute("aria-label", "播放 " + track.title + " — " + track.artist);

        const number = document.createElement("span");
        number.className = "track-num";
        number.textContent = track.index;

        const info = document.createElement("span");
        info.className = "track-info";
        const name = document.createElement("span");
        name.className = "track-name";
        name.textContent = track.title;
        const artist = document.createElement("span");
        artist.className = "track-genre";
        artist.textContent = track.artist;
        info.append(name, artist);

        const duration = document.createElement("span");
        duration.className = "track-duration";
        duration.textContent = track.duration;

        const icon = document.createElement("span");
        icon.className = "track-play-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "▶";

        row.append(number, info, duration, icon);
        row.addEventListener("click", () => loadTrack(index, true));
        trackList.appendChild(row);
        trackRows.push(row);
      });
    };

    const paintTrack = () => {
      const track = tracks[currentTrack];
      if (musicTitle) musicTitle.textContent = track.title;
      if (musicDesc) musicDesc.textContent = track.desc;
      if (musicCode) musicCode.textContent = track.code;
      if (musicIndex) musicIndex.textContent = track.index;
      if (musicVisual) musicVisual.setAttribute("data-track", track.id);
      trackRows.forEach((row) => {
        const active = row.getAttribute("data-track") === track.id;
        row.classList.toggle("is-active", active);
        row.setAttribute("aria-current", active ? "true" : "false");
      });
    };

    const loadTrack = (index, autoplay) => {
      currentTrack = (index + tracks.length) % tracks.length;
      const track = tracks[currentTrack];
      paintTrack();
      musicAudio.src = track.src;
      musicAudio.load();
      musicLoaded = true;
      if (musicStatusText) musicStatusText.textContent = autoplay ? "NOW PLAYING" : "READY TO PLAY";
      if (autoplay) {
        musicAudio.play().catch(() => {
          if (musicStatusText) musicStatusText.textContent = "PRESS PLAY";
          showToast("音频加载失败，请稍后再试");
        });
      }
    };

    const toggleMusic = () => {
      if (!musicLoaded) {
        loadTrack(currentTrack, true);
        return;
      }
      if (musicAudio.paused) {
        musicAudio.play().catch(() => showToast("音频加载失败，请稍后再试"));
      } else {
        musicAudio.pause();
      }
    };

    renderTrackRows();
    paintTrack();

    if (musicToggle) musicToggle.addEventListener("click", toggleMusic);
    if (musicPrev) musicPrev.addEventListener("click", () => loadTrack(currentTrack - 1, !musicAudio.paused));
    if (musicNext) musicNext.addEventListener("click", () => loadTrack(currentTrack + 1, !musicAudio.paused));

    musicAudio.addEventListener("play", () => {
      music.classList.add("is-playing");
      if (musicStatusText) musicStatusText.textContent = "NOW PLAYING";
    });

    musicAudio.addEventListener("pause", () => {
      music.classList.remove("is-playing");
      if (musicStatusText && musicAudio.currentTime > 0) musicStatusText.textContent = "PAUSED";
    });

    musicAudio.addEventListener("ended", () => loadTrack(currentTrack + 1, true));

    musicAudio.addEventListener("loadedmetadata", () => {
      if (musicDuration) musicDuration.textContent = formatTrackTime(musicAudio.duration);
      const activeRow = trackRows[currentTrack];
      if (activeRow) {
        const durationEl = activeRow.querySelector(".track-duration");
        if (durationEl) durationEl.textContent = formatTrackTime(musicAudio.duration);
      }
    });

    musicAudio.addEventListener("timeupdate", () => {
      const duration = musicAudio.duration;
      const ratio = Number.isFinite(duration) && duration > 0 ? musicAudio.currentTime / duration : 0;
      if (musicProgress) musicProgress.value = String(Math.round(ratio * 1000));
      if (musicCurrent) musicCurrent.textContent = formatTrackTime(musicAudio.currentTime);
      if (musicDuration) musicDuration.textContent = formatTrackTime(duration);
    });

    musicAudio.addEventListener("error", () => {
      music.classList.remove("is-playing");
      if (musicStatusText) musicStatusText.textContent = "AUDIO ERROR";
    });

    if (musicProgress) {
      musicProgress.addEventListener("input", () => {
        const duration = musicAudio.duration;
        if (Number.isFinite(duration) && duration > 0) {
          musicAudio.currentTime = (Number(musicProgress.value) / 1000) * duration;
        }
      });
    }

    if (musicMute) {
      musicMute.addEventListener("click", () => {
        musicAudio.muted = !musicAudio.muted;
        musicMute.classList.toggle("is-muted", musicAudio.muted);
        musicMute.setAttribute("aria-label", musicAudio.muted ? "取消静音" : "静音");
      });
    }
  }

  /* ---------- guestbook wall ---------- */
  const guestbook = $("#guestbook");

  if (guestbook) {
    const REPO = "eyeofyan/eyeofyan.github.io";
    const CACHE_KEY = "yan-guestbook-cache-v1";
    const messagesEl = $("#gb-messages");
    const statusEl = $("#gb-status");
    const refreshBtn = $("#gb-refresh");
    const form = $("#guestbook-form");
    const nameInput = $("#gb-name");
    const messageInput = $("#gb-message");
    const countEl = $("#gb-count");
    let submitted = false;

    const updateCount = () => {
      if (!countEl || !messageInput) return;
      countEl.textContent = messageInput.value.length + " / 200";
    };

    const readCache = () => {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.messages)) return null;
        if (Date.now() - parsed.time > 120000) return null;
        return parsed.messages;
      } catch (error) {
        return null;
      }
    };

    const writeCache = (messages) => {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), messages }));
      } catch (error) {
        /* storage may be unavailable */
      }
    };

    const setStatus = (text, link) => {
      if (!statusEl) return;
      statusEl.replaceChildren();
      statusEl.append(document.createTextNode(text));
      if (link) {
        statusEl.append(document.createTextNode(" "));
        const anchor = document.createElement("a");
        anchor.href = link;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.textContent = "在 GitHub 查看 ↗";
        statusEl.append(anchor);
      }
    };

    const showSkeletons = () => {
      if (!messagesEl) return;
      $$(".gb-skeleton", messagesEl).forEach((node) => node.remove());
      for (let i = 0; i < 2; i += 1) {
        const skeleton = document.createElement("div");
        skeleton.className = "gb-skeleton gb-dynamic";
        skeleton.setAttribute("aria-hidden", "true");
        messagesEl.appendChild(skeleton);
      }
    };

    const issueToMessage = (issue) => {
      const rawBody = (issue.body || "").split(/\n\s*---\s*\n/)[0] || "";
      const name = (issue.title || "").replace(/^\[留言\]\s*/u, "").trim() || (issue.user && issue.user.login) || "匿名";
      const body = rawBody.trim().slice(0, 280);
      return {
        name,
        body: body || "（这条留言没有正文）",
        avatar: issue.user && issue.user.avatar_url ? issue.user.avatar_url : "",
        login: issue.user && issue.user.login ? issue.user.login : "",
        date: issue.created_at
          ? new Date(issue.created_at).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
          : "",
        url: issue.html_url || "https://github.com/" + REPO + "/issues"
      };
    };

    const renderMessages = (messages) => {
      if (!messagesEl) return;
      $$(".gb-dynamic", messagesEl).forEach((node) => node.remove());

      if (!messages.length) {
        const empty = document.createElement("div");
        empty.className = "gb-empty gb-dynamic";
        empty.textContent = "还没有新留言。写下第一句吧，纸飞机已经在等了。";
        messagesEl.appendChild(empty);
        return;
      }

      messages.slice(0, 8).forEach((message) => {
        const card = document.createElement("article");
        card.className = "gb-card gb-dynamic";

        const head = document.createElement("div");
        head.className = "gb-card-head";

        let avatar;
        if (message.avatar) {
          avatar = document.createElement("img");
          avatar.src = message.avatar;
          avatar.alt = "";
          avatar.loading = "lazy";
          avatar.referrerPolicy = "no-referrer";
        } else {
          avatar = document.createElement("span");
          avatar.textContent = message.name.slice(0, 1).toUpperCase();
        }
        avatar.className = "gb-avatar";

        const who = document.createElement("div");
        who.className = "gb-who";
        const name = document.createElement("p");
        name.className = "gb-name";
        name.textContent = message.name;
        const date = document.createElement("p");
        date.className = "gb-date";
        date.textContent = message.date + (message.login ? " · @" + message.login : "");
        who.append(name, date);

        const link = document.createElement("a");
        link.className = "gb-link";
        link.href = message.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute("aria-label", "在 GitHub 查看这条留言");
        link.textContent = "↗";

        head.append(avatar, who, link);

        const text = document.createElement("p");
        text.className = "gb-text";
        text.textContent = message.body;

        card.append(head, text);
        messagesEl.appendChild(card);
      });
    };

    const loadGuestbook = async (force) => {
      if (!messagesEl) return;
      const cached = !force ? readCache() : null;
      if (cached) {
        renderMessages(cached);
        setStatus("已加载 " + cached.length + " 条留言 · 来自 GitHub Issues");
        return;
      }

      showSkeletons();
      setStatus("正在连接 GitHub Issues…");

      try {
        const response = await fetch("https://api.github.com/repos/" + REPO + "/issues?state=all&per_page=30&sort=created&direction=desc", {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
          }
        });

        if (!response.ok) {
          throw new Error("GitHub API " + response.status);
        }

        const issues = await response.json();
        const messages = issues
          .filter((issue) => !issue.pull_request && typeof issue.title === "string" && issue.title.indexOf("[留言]") === 0)
          .map(issueToMessage);

        writeCache(messages);
        renderMessages(messages);
        setStatus(messages.length ? "已加载 " + messages.length + " 条留言 · 来自 GitHub Issues" : "暂时没有新留言 · 来写第一条");
      } catch (error) {
        $$(".gb-skeleton", messagesEl).forEach((node) => node.remove());
        const existing = $$(".gb-dynamic", messagesEl);
        if (!existing.length) {
          const empty = document.createElement("div");
          empty.className = "gb-empty gb-dynamic";
          empty.textContent = "留言暂时加载失败，可能是网络或 GitHub API 限流。你仍然可以点击下方按钮去 GitHub 留言。";
          messagesEl.appendChild(empty);
        }
        setStatus("无法加载留言 · 可能是网络限制", "https://github.com/" + REPO + "/issues");
      }
    };

    if (nameInput) {
      try {
        const savedName = localStorage.getItem("yan-guestbook-name");
        if (savedName) nameInput.value = savedName;
      } catch (error) {
        /* ignore */
      }
    }

    if (messageInput) {
      messageInput.addEventListener("input", updateCount);
      updateCount();
    }

    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => loadGuestbook(true));
    }

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const message = messageInput ? messageInput.value.trim() : "";
        const name = nameInput ? nameInput.value.trim() : "";

        if (!message) {
          showToast("先写点什么再发吧");
          if (messageInput) messageInput.focus();
          return;
        }

        try {
          if (name) localStorage.setItem("yan-guestbook-name", name);
        } catch (error) {
          /* ignore */
        }

        const title = "[留言] " + (name || "匿名");
        const body = message + "\n\n---\n昵称：" + (name || "匿名") + "\n来自：https://eyeofyan.github.io/#guestbook";
        const url =
          "https://github.com/" +
          REPO +
          "/issues/new?title=" +
          encodeURIComponent(title) +
          "&body=" +
          encodeURIComponent(body);

        submitted = true;
        const opened = window.open(url, "_blank");
        if (opened) {
          opened.opener = null;
        } else {
          window.location.href = url;
        }
        showToast("已打开 GitHub，发布后回来刷新即可看到");
      });
    }

    window.addEventListener("focus", () => {
      if (!submitted) return;
      submitted = false;
      window.setTimeout(() => loadGuestbook(true), 800);
    });

    loadGuestbook(false);
  }

  /* ---------- console note ---------- */
  const titleStyle = "background:#22d3ee;color:#04131a;font-weight:700;padding:3px 8px;border-radius:4px 0 0 4px;";
  const subtitleStyle = "background:#111521;color:#eef1f8;padding:3px 8px;border-radius:0 4px 4px 0;";
  const hintStyle = "color:#626c82;font-size:11px;";
  console.log("%c yan %c 信息技术安全 / 缓存垃圾 ", titleStyle, subtitleStyle);
  console.log("%c提示：在页面任意处输入 sudo。", hintStyle);
})();
