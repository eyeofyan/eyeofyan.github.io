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

  /* ---------- console note ---------- */
  const titleStyle = "background:#22d3ee;color:#04131a;font-weight:700;padding:3px 8px;border-radius:4px 0 0 4px;";
  const subtitleStyle = "background:#111521;color:#eef1f8;padding:3px 8px;border-radius:0 4px 4px 0;";
  const hintStyle = "color:#626c82;font-size:11px;";
  console.log("%c yan %c 信息技术安全 / 缓存垃圾 ", titleStyle, subtitleStyle);
  console.log("%c提示：在页面任意处输入 sudo。", hintStyle);
})();
