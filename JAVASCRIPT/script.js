const clockElement = document.getElementById("clock");
const dragChip = document.getElementById("dragChip");
const dragTetherLayer = document.getElementById("dragTetherLayer");
const dragTetherLine = document.getElementById("dragTetherLine");
const dragIndicator = document.getElementById("dragIndicator");
const dragIndicatorReadout = document.getElementById("dragIndicatorReadout");
const heroDescription = document.getElementById("heroDescription");
const introLoader = document.getElementById("siteIntroLoader");
const introLoaderCount = document.getElementById("siteIntroLoaderCount");
const INTRO_SESSION_KEY = "jeffersonPortfolioIntroSeen";
const PAGE_TRANSITION_SESSION_KEY = "jeffersonPortfolioPageTransition";
const SKIP_INTRO_ONCE_SESSION_KEY = "jeffersonPortfolioSkipIntroOnce";
const THEME_STORAGE_KEY = "jeffersonPortfolioTheme";

try {
    document.documentElement.classList.toggle(
        "theme-light",
        window.localStorage.getItem(THEME_STORAGE_KEY) === "light",
    );
} catch (error) {
    // Keep the default dark theme if local storage is unavailable.
}

const siteHeader = document.querySelector(".site-header");
const stackTransition = document.querySelector(".stack-transition");
const stackStage = document.getElementById("stackStage");
const heroPanel = document.querySelector(".hero-panel");
const heroOrbits = Array.from(document.querySelectorAll("[data-hero-orbit]"));
const themeToggle = document.querySelector("[data-theme-toggle]");
const themedImages = Array.from(document.querySelectorAll("[data-light-src]"));
const featuredCards = Array.from(document.querySelectorAll(".featured-card"));
const featuredMediaItems = Array.from(
    document.querySelectorAll(".featured-media"),
);
const featuredImages = Array.from(document.querySelectorAll(".featured-image"));
const workProjectMediaItems = Array.from(
    document.querySelectorAll(".work-project-media"),
);
const workProjectImages = Array.from(
    document.querySelectorAll(".work-project-image"),
);
const footerPhotoGallery = document.querySelector("[data-footer-gallery]");
const footerPhotos = Array.from(
    document.querySelectorAll("[data-footer-photo]"),
);
const aboutPageGallery = document.querySelector(".about-page-gallery");
const aboutPagePhotos = Array.from(
    document.querySelectorAll(".about-page-gallery .about-page-photo"),
);
const revealPanels = Array.from(
    document.querySelectorAll("[data-reveal-panel]"),
);
const draggableWordmarks = Array.from(
    document.querySelectorAll("[data-draggable-wordmark]"),
);

if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
}

function resetHomeScrollPosition() {
    const shouldReset =
        stackTransition &&
        (!window.location.hash || window.location.hash === "#hero");

    if (!shouldReset) {
        return;
    }

    window.scrollTo({
        left: 0,
        top: 0,
        behavior: "auto",
    });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
}

function setupPageTransitions() {
    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const root = document.documentElement;

    if (prefersReducedMotion) {
        root.classList.remove(
            "is-page-transition-entering",
            "is-page-transition-leaving",
        );
        return;
    }

    const transitionDuration = 920;
    let isTransitioning = false;
    let cleanupTimerId = null;

    function cleanupEntryState() {
        root.classList.remove("is-page-transition-entering");
    }

    if (root.classList.contains("is-page-transition-entering")) {
        cleanupTimerId = window.setTimeout(() => {
            cleanupEntryState();
            cleanupTimerId = null;
        }, transitionDuration);
    }

    function isHomeDestination(url) {
        const filename = url.pathname.split("/").pop() || "";

        return !filename || filename.toLowerCase() === "index.html";
    }

    function shouldHandleNavigation(link, event) {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return false;
        }

        if (link.hasAttribute("download")) {
            return false;
        }

        const rawHref = link.getAttribute("href");

        if (
            !rawHref ||
            rawHref.startsWith("#") ||
            rawHref.startsWith("mailto:") ||
            rawHref.startsWith("tel:") ||
            rawHref.startsWith("javascript:")
        ) {
            return false;
        }

        if (link.target && link.target.toLowerCase() !== "_self") {
            return false;
        }

        return true;
    }

    document.addEventListener("click", (event) => {
        const link = event.target.closest("a[href]");

        if (!link || !shouldHandleNavigation(link, event)) {
            return;
        }

        const destination = new URL(link.href, window.location.href);
        const current = new URL(window.location.href);
        const isSameDocument =
            destination.origin === current.origin &&
            destination.pathname === current.pathname &&
            destination.search === current.search;

        if (destination.origin !== window.location.origin) {
            return;
        }

        if (isSameDocument && destination.hash !== current.hash) {
            return;
        }

        if (isSameDocument && destination.hash === current.hash) {
            return;
        }

        if (isTransitioning) {
            event.preventDefault();
            return;
        }

        event.preventDefault();
        isTransitioning = true;

        if (cleanupTimerId !== null) {
            window.clearTimeout(cleanupTimerId);
            cleanupTimerId = null;
        }

        const shouldSkipIntro = isHomeDestination(destination);
        root.classList.remove("is-page-transition-entering");
        root.classList.add("is-page-transition-leaving");

        try {
            window.sessionStorage.setItem(PAGE_TRANSITION_SESSION_KEY, "true");

            if (shouldSkipIntro) {
                window.sessionStorage.setItem(
                    SKIP_INTRO_ONCE_SESSION_KEY,
                    "true",
                );
                window.sessionStorage.setItem(INTRO_SESSION_KEY, "true");
            } else {
                window.sessionStorage.removeItem(SKIP_INTRO_ONCE_SESSION_KEY);
            }
        } catch (error) {
            // Keep navigation working if storage is unavailable.
        }

        window.setTimeout(() => {
            window.location.assign(destination.href);
        }, 640);
    });

    window.addEventListener("pageshow", () => {
        isTransitioning = false;
        root.classList.remove("is-page-transition-leaving");
    });

    window.addEventListener("pagehide", () => {
        if (cleanupTimerId !== null) {
            window.clearTimeout(cleanupTimerId);
            cleanupTimerId = null;
        }
    });
}

function setupSiteCursor() {
    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const supportsFinePointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)",
    ).matches;

    if (prefersReducedMotion || !supportsFinePointer) {
        return;
    }

    const siteCursor = document.createElement("div");
    const cursorHalo = document.createElement("span");
    const cursorFrame = document.createElement("span");
    const cursorCore = document.createElement("span");
    const cursorLabel = document.createElement("span");
    const state = {
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2,
        currentX: window.innerWidth / 2,
        currentY: window.innerHeight / 2,
        visible: false,
        rafId: null,
        mode: "default",
        label: "You",
    };

    siteCursor.className = "site-cursor";
    siteCursor.setAttribute("aria-hidden", "true");
    siteCursor.dataset.mode = "default";

    cursorHalo.className = "site-cursor-halo";
    cursorFrame.className = "site-cursor-frame";
    cursorCore.className = "site-cursor-core";
    cursorLabel.className = "site-cursor-label";
    cursorLabel.textContent = state.label;

    siteCursor.append(cursorHalo, cursorFrame, cursorCore, cursorLabel);
    document.body.append(siteCursor);

    function renderCursor() {
        state.rafId = null;

        const deltaX = state.targetX - state.currentX;
        const deltaY = state.targetY - state.currentY;

        state.currentX += deltaX * 0.18;
        state.currentY += deltaY * 0.18;

        siteCursor.style.transform = `translate3d(${state.currentX}px, ${state.currentY}px, 0)`;

        if (Math.abs(deltaX) > 0.15 || Math.abs(deltaY) > 0.15) {
            state.rafId = window.requestAnimationFrame(renderCursor);
        }
    }

    function requestCursorRender() {
        if (state.rafId !== null) {
            return;
        }

        state.rafId = window.requestAnimationFrame(renderCursor);
    }

    function setCursorProfile(mode, label) {
        if (state.mode !== mode) {
            state.mode = mode;
            siteCursor.dataset.mode = mode;
        }

        if (state.label !== label) {
            state.label = label;
            cursorLabel.textContent = label;
        }
    }

    function resolveCursorProfile(target) {
        if (!(target instanceof Element)) {
            return { mode: "default", label: "You" };
        }

        if (target.closest(".footer-photo-handle")) {
            return { mode: "drag", label: "RESIZE" };
        }

        const footerPhoto = target.closest(".footer-photo");

        if (footerPhoto) {
            return footerPhoto.classList.contains("is-dragging") ||
                footerPhoto.classList.contains("is-resizing")
                ? { mode: "drag", label: "DRAG" }
                : { mode: "action", label: "OPEN" };
        }

        if (target.closest(".draggable-wordmark, .about-page-photo")) {
            return { mode: "drag", label: "DRAG" };
        }

        if (target.closest("#heroDescription.is-restartable")) {
            return { mode: "action", label: "REPLAY" };
        }

        if (target.closest("[data-theme-toggle]")) {
            const isLightTheme =
                document.documentElement.classList.contains("theme-light");

            return {
                mode: "action",
                label: isLightTheme
                    ? "Switch to dark mode"
                    : "Switch to light mode",
            };
        }

        if (target.closest("a[href], button, [role='button']")) {
            return { mode: "action", label: "OPEN" };
        }

        if (
            target.closest(
                ".featured-card, .work-project-card, .about-page-photo, .about-toolkit-card",
            )
        ) {
            return { mode: "inspect", label: "SCAN" };
        }

        return { mode: "default", label: "You" };
    }

    function showCursor() {
        if (!state.visible) {
            state.visible = true;
            document.body.classList.add("has-custom-cursor");
            siteCursor.classList.add("is-visible");
        }
    }

    function hideCursor() {
        state.visible = false;
        document.body.classList.remove("has-custom-cursor");
        siteCursor.classList.remove("is-visible", "is-pressed");

        if (state.rafId !== null) {
            window.cancelAnimationFrame(state.rafId);
            state.rafId = null;
        }
    }

    function updateCursorTarget(target) {
        const profile = resolveCursorProfile(target);
        setCursorProfile(profile.mode, profile.label);
    }

    window.addEventListener(
        "pointermove",
        (event) => {
            if (event.pointerType && event.pointerType !== "mouse") {
                hideCursor();
                return;
            }

            state.targetX = event.clientX;
            state.targetY = event.clientY;

            if (!state.visible) {
                state.currentX = event.clientX;
                state.currentY = event.clientY;
                siteCursor.style.transform = `translate3d(${state.currentX}px, ${state.currentY}px, 0)`;
            }

            showCursor();
            updateCursorTarget(event.target);
            requestCursorRender();
        },
        { passive: true },
    );

    window.addEventListener("pointerdown", (event) => {
        if (event.pointerType && event.pointerType !== "mouse") {
            return;
        }

        showCursor();
        updateCursorTarget(event.target);
        siteCursor.classList.add("is-pressed");
    });

    window.addEventListener("pointerup", (event) => {
        if (event.pointerType && event.pointerType !== "mouse") {
            return;
        }

        updateCursorTarget(event.target);
        siteCursor.classList.remove("is-pressed");
    });

    window.addEventListener("pointercancel", () => {
        siteCursor.classList.remove("is-pressed");
    });

    window.addEventListener("mouseout", (event) => {
        if (event.relatedTarget) {
            return;
        }

        hideCursor();
    });

    window.addEventListener("blur", hideCursor);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            hideCursor();
        }
    });
}

function setupMobileMenu() {
    const headers = Array.from(document.querySelectorAll(".site-header"));

    headers.forEach((header) => {
        const nav = header.querySelector(".site-nav");

        if (!nav || header.querySelector(".site-menu-toggle")) {
            return;
        }

        const toggle = document.createElement("button");
        const toggleLine = document.createElement("span");

        toggle.className = "site-menu-toggle";
        toggle.type = "button";
        toggle.setAttribute("aria-label", "Open menu");
        toggle.setAttribute("aria-expanded", "false");
        toggle.append(toggleLine);
        header.insertBefore(toggle, nav);

        function closeMenu() {
            header.classList.remove("is-menu-open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Open menu");
        }

        function openMenu() {
            header.classList.add("is-menu-open");
            toggle.setAttribute("aria-expanded", "true");
            toggle.setAttribute("aria-label", "Close menu");
        }

        toggle.addEventListener("click", () => {
            if (header.classList.contains("is-menu-open")) {
                closeMenu();
                return;
            }

            openMenu();
        });

        nav.addEventListener("click", (event) => {
            if (event.target.closest("a")) {
                closeMenu();
            }
        });

        document.addEventListener("click", (event) => {
            if (!header.contains(event.target)) {
                closeMenu();
            }
        });

        window.addEventListener("resize", closeMenu);
    });
}

function updateClock() {
    if (!clockElement) {
        return;
    }

    const formatter = new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    const time = formatter.format(new Date());

    clockElement.textContent = `Manila, PH - ${time} PHT`;
}

function wait(duration) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, duration);
    });
}

function getPortfolioRootPath() {
    const path = window.location.pathname.replace(/\\/g, "/");

    if (path.includes("/HTML/MahWorksNibbah/")) {
        return "../../";
    }

    if (path.includes("/HTML/")) {
        return "../";
    }

    return "";
}

function ensurePortfolioAssistantMarkup() {
    if (
        document.getElementById("portfolioAssistant") &&
        document.querySelector("[data-assistant-toggle]")
    ) {
        return;
    }

    const rootPath = getPortfolioRootPath();
    const featuredHref = document.body.classList.contains("home-page")
        ? "#featured"
        : `${rootPath}index.html#featured`;
    const workHref = `${rootPath}HTML/work.html`;
    const assistant = document.createElement("section");
    const toggle = document.createElement("button");

    assistant.className = "portfolio-assistant";
    assistant.id = "portfolioAssistant";
    assistant.setAttribute("aria-label", "Portfolio assistant");
    assistant.setAttribute("aria-hidden", "true");
    assistant.innerHTML = `
        <div class="portfolio-assistant-shell">
            <header class="portfolio-assistant-header">
                <div>
                    <p class="portfolio-assistant-kicker">PORTFOLIO_AI</p>
                    <h2 class="portfolio-assistant-title">Ask about my work</h2>
                </div>
                <button
                    class="portfolio-assistant-close"
                    type="button"
                    data-assistant-close
                    aria-label="Close portfolio assistant"
                >
                    <span aria-hidden="true"></span>
                </button>
            </header>

            <div
                class="portfolio-assistant-answer"
                data-assistant-messages
                aria-live="polite"
            >
                <div class="portfolio-assistant-message is-assistant">
                    <span>Jefferson AI</span>
                    <p>
                        Hey, ask me anything about Jefferson's work, stack,
                        projects, or process. Casual questions are okay too.
                    </p>
                </div>
            </div>

            <form class="portfolio-assistant-form" data-assistant-form>
                <label class="portfolio-assistant-input-label">
                    <span>Message the assistant</span>
                    <input
                        type="text"
                        name="question"
                        data-assistant-input
                        placeholder="Type like you're chatting..."
                        autocomplete="off"
                        maxlength="220"
                    />
                </label>
                <button type="submit">Send</button>
            </form>

            <p class="portfolio-assistant-status" data-assistant-status>
                Powered by Gemini · Trained on Jefferson's portfolio data
            </p>

            <div class="portfolio-assistant-actions">
                <a href="${featuredHref}">View featured work</a>
                <a href="${workHref}">Open work page</a>
            </div>
        </div>
    `;

    toggle.className = "ask-pill";
    toggle.type = "button";
    toggle.dataset.assistantToggle = "";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "portfolioAssistant");
    toggle.innerHTML = `
        <span class="ask-pill-icon" aria-hidden="true">+</span>
        <span>Ask about my work</span>
    `;

    document.body.append(assistant, toggle);
}

function setupPortfolioAssistant() {
    ensurePortfolioAssistantMarkup();

    const assistant = document.getElementById("portfolioAssistant");
    const toggle = document.querySelector("[data-assistant-toggle]");
    const closeButton = document.querySelector("[data-assistant-close]");
    const messagesElement = document.querySelector("[data-assistant-messages]");
    const form = document.querySelector("[data-assistant-form]");
    const input = document.querySelector("[data-assistant-input]");
    const status = document.querySelector("[data-assistant-status]");
    const assistantEndpoint =
        window.PORTFOLIO_ASSISTANT_API || "/api/portfolio-assistant";

    if (!assistant || !toggle || !messagesElement) {
        return;
    }

    const introMessage =
        "Hey, ask me anything about Jefferson's work, stack, projects, or process. Casual questions are okay too.";
    const chatMessages = [
        {
            role: "assistant",
            content: introMessage,
        },
    ];

    function setOpen(isOpen) {
        assistant.classList.toggle("is-open", isOpen);
        assistant.setAttribute("aria-hidden", String(!isOpen));
        toggle.setAttribute("aria-expanded", String(isOpen));
    }

    function setStatus(message) {
        if (status) {
            status.textContent = message;
        }
    }

    function renderMessage(message) {
        const messageElement = document.createElement("div");
        const label = document.createElement("span");
        const paragraph = document.createElement("p");

        messageElement.className = `portfolio-assistant-message is-${message.role}`;
        label.textContent = message.role === "user" ? "You" : "Jefferson AI";

        if (message.isTyping) {
            paragraph.className = "portfolio-assistant-typing";
            paragraph.setAttribute("aria-label", "Jefferson AI is typing");
            paragraph.innerHTML = `
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
            `;
        } else {
            paragraph.textContent = message.content;
        }

        messageElement.append(label, paragraph);

        return messageElement;
    }

    function renderMessages() {
        messagesElement.replaceChildren(
            ...chatMessages.map((message) => renderMessage(message)),
        );
        messagesElement.scrollTop = messagesElement.scrollHeight;
    }

    function setLoading(isLoading) {
        if (input) {
            input.disabled = isLoading;
        }

        const submitButton = form?.querySelector("button[type='submit']");

        if (submitButton) {
            submitButton.disabled = isLoading;
            submitButton.textContent = isLoading ? "Thinking" : "Send";
        }
    }

    async function askAssistant(question, fallbackAnswer) {
        const cleanQuestion = question.trim();

        if (!cleanQuestion) {
            return;
        }

        chatMessages.push({ role: "user", content: cleanQuestion });
        chatMessages.push({
            role: "assistant",
            content: "",
            isTyping: true,
        });
        renderMessages();
        setLoading(true);
        setStatus("");

        try {
            const response = await fetch(assistantEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: cleanQuestion,
                    messages: chatMessages
                        .slice(0, -1)
                        .slice(-8)
                        .map((message) => ({
                            role: message.role,
                            content: message.content,
                        })),
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        `The assistant endpoint returned ${response.status}.`,
                );
            }

            chatMessages[chatMessages.length - 1].content =
                data.answer || fallbackAnswer;
            delete chatMessages[chatMessages.length - 1].isTyping;
            setStatus(
                "Powered by Gemini · Trained on Jefferson's portfolio data",
            );
        } catch (error) {
            chatMessages[chatMessages.length - 1].content =
                fallbackAnswer ||
                "The AI endpoint is not available yet. Add the serverless function and set GEMINI_API_KEY to make this live.";
            delete chatMessages[chatMessages.length - 1].isTyping;
            setStatus(
                "Jefferson AI is taking a short break. Please try again in a moment.",
            );
        } finally {
            setLoading(false);
            renderMessages();
        }
    }

    toggle.addEventListener("click", () => {
        setOpen(!assistant.classList.contains("is-open"));
    });

    closeButton?.addEventListener("click", () => {
        setOpen(false);
        toggle.focus();
    });

    form?.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!input) {
            return;
        }

        askAssistant(
            input.value,
            "I am having trouble reaching the portfolio brain right now. Give me a moment, then ask again.",
        );
        input.value = "";
    });

    document.addEventListener("click", (event) => {
        if (
            !assistant.classList.contains("is-open") ||
            assistant.contains(event.target) ||
            toggle.contains(event.target)
        ) {
            return;
        }

        setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && assistant.classList.contains("is-open")) {
            setOpen(false);
            toggle.focus();
        }
    });

    renderMessages();
}

function setupThemeToggle() {
    if (!themeToggle) {
        return;
    }

    const root = document.documentElement;

    function syncToggleState() {
        const isLightTheme = root.classList.contains("theme-light");
        themeToggle.setAttribute("aria-pressed", `${isLightTheme}`);
        themeToggle.setAttribute(
            "aria-label",
            isLightTheme ? "Switch to dark mode" : "Switch to light mode",
        );
        themeToggle.removeAttribute("title");
    }

    syncToggleState();

    themeToggle.addEventListener("click", () => {
        const isLightTheme = root.classList.toggle("theme-light");

        try {
            window.localStorage.setItem(
                THEME_STORAGE_KEY,
                isLightTheme ? "light" : "dark",
            );
        } catch (error) {
            // Keep the toggle usable if local storage is unavailable.
        }

        syncToggleState();
    });
}

function setupThemeToggleGuide() {
    if (!document.body.classList.contains("home-page") || !themeToggle) {
        return;
    }

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const supportsFinePointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)",
    ).matches;

    if (prefersReducedMotion || !supportsFinePointer) {
        return;
    }

    let hasPlayed = false;
    let guideTimeoutId = null;
    let activeGuide = null;

    function clearGuide() {
        if (guideTimeoutId !== null) {
            window.clearTimeout(guideTimeoutId);
            guideTimeoutId = null;
        }

        if (activeGuide) {
            activeGuide.remove();
            activeGuide = null;
        }

        themeToggle.classList.remove("is-guide-target");
    }

    function createGuide() {
        if (hasPlayed || !document.body.contains(themeToggle)) {
            return;
        }

        const scrolledAwayFromHero = window.scrollY > 24;
        const toggleRect = themeToggle.getBoundingClientRect();
        const toggleIsVisible =
            toggleRect.bottom > 0 &&
            toggleRect.top < window.innerHeight &&
            toggleRect.right > 0 &&
            toggleRect.left < window.innerWidth;

        if (scrolledAwayFromHero || !toggleIsVisible) {
            hasPlayed = true;
            clearGuide();
            return;
        }

        hasPlayed = true;

        const targetX = toggleRect.left + toggleRect.width / 2;
        const targetY = toggleRect.top + toggleRect.height / 2;
        const startX = window.innerWidth + 92;
        const startY = Math.min(
            Math.max(targetY + 92, 120),
            window.innerHeight - 90,
        );
        const guide = document.createElement("div");
        const halo = document.createElement("span");
        const frame = document.createElement("span");
        const core = document.createElement("span");
        const label = document.createElement("span");
        const message = document.createElement("span");
        const isLightTheme =
            document.documentElement.classList.contains("theme-light");

        guide.className = "theme-toggle-guide";
        halo.className = "theme-toggle-guide-halo";
        frame.className = "theme-toggle-guide-frame";
        core.className = "theme-toggle-guide-core";
        label.className = "theme-toggle-guide-label";
        message.className = "theme-toggle-guide-message";
        label.textContent = "TIP";
        message.textContent = isLightTheme
            ? "You can switch back to dark mode here."
            : "You can switch to light mode here.";
        guide.setAttribute("aria-hidden", "true");
        guide.style.setProperty("--theme-guide-start-x", `${startX}px`);
        guide.style.setProperty("--theme-guide-start-y", `${startY}px`);
        guide.style.setProperty("--theme-guide-target-x", `${targetX}px`);
        guide.style.setProperty("--theme-guide-target-y", `${targetY}px`);
        guide.append(halo, frame, core, label, message);

        themeToggle.classList.add("is-guide-target");
        document.body.append(guide);
        activeGuide = guide;

        guide.addEventListener(
            "animationend",
            () => {
                if (activeGuide === guide) {
                    activeGuide = null;
                    guide.remove();
                    themeToggle.classList.remove("is-guide-target");
                }
            },
            { once: true },
        );
    }

    window.addEventListener(
        "scroll",
        () => {
            if (window.scrollY > 24) {
                clearGuide();
            }
        },
        { passive: true },
    );

    window.addEventListener(
        "portfolio:intro-scroll-unlocked",
        () => {
            guideTimeoutId = window.setTimeout(() => {
                guideTimeoutId = null;
                createGuide();
            }, 1150);
        },
        { once: true },
    );
}

function syncThemedImages() {
    if (!themedImages.length) {
        return;
    }

    const isLightTheme =
        document.documentElement.classList.contains("theme-light");

    themedImages.forEach((image) => {
        const nextSource = isLightTheme
            ? image.dataset.lightSrc
            : image.dataset.darkSrc;

        if (nextSource && image.getAttribute("src") !== nextSource) {
            image.setAttribute("src", nextSource);
        }
    });
}

function setupThemedImages() {
    if (!themedImages.length) {
        return;
    }

    syncThemedImages();

    const observer = new MutationObserver(syncThemedImages);
    observer.observe(document.documentElement, {
        attributeFilter: ["class"],
        attributes: true,
    });
}

function unlockIntroScrolling() {
    resetHomeScrollPosition();
    document.body.classList.remove("is-intro-loading");
    window.dispatchEvent(new CustomEvent("portfolio:intro-scroll-unlocked"));
}

function waitForWindowLoad() {
    if (document.readyState === "complete") {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        window.addEventListener("load", resolve, { once: true });
    });
}

function markIntroAsSeen() {
    try {
        window.sessionStorage.setItem(INTRO_SESSION_KEY, "true");
    } catch (error) {
        // Ignore storage failures and continue with the intro flow.
    }
}

function playHeroWordmarkEntrance() {
    if (!draggableWordmarks.length) {
        return;
    }

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    draggableWordmarks.forEach((wordmark, index) => {
        const reveal = () => {
            wordmark.classList.add("is-wordmark-visible");
        };

        if (prefersReducedMotion) {
            reveal();
            return;
        }

        window.setTimeout(reveal, index * 120);
    });
}

async function setupIntroLoader() {
    if (!introLoader || !introLoaderCount) {
        unlockIntroScrolling();
        return;
    }

    if (document.documentElement.classList.contains("has-seen-intro")) {
        unlockIntroScrolling();
        introLoader.setAttribute("hidden", "");
        return;
    }

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    const runCounter = () =>
        new Promise((resolve) => {
            let value = 1;
            const intervalDelay = 18;

            introLoaderCount.textContent = `${value}%`;

            const intervalId = window.setInterval(() => {
                value += 1;
                introLoaderCount.textContent = `${Math.min(value, 100)}%`;

                if (value >= 100) {
                    window.clearInterval(intervalId);
                    resolve();
                }
            }, intervalDelay);
        });

    resetHomeScrollPosition();

    await Promise.all([runCounter(), waitForWindowLoad()]);

    if (prefersReducedMotion) {
        await wait(360);
        introLoader.classList.add("is-complete");
        await wait(280);
        introLoader.classList.add("is-fading-count", "is-line-visible");
        await wait(220);
        introLoader.classList.add("is-opening");
        playHeroWordmarkEntrance();
        unlockIntroScrolling();
        await wait(40);
        introLoader.classList.add("is-hidden");
        introLoader.setAttribute("hidden", "");
        markIntroAsSeen();
        return;
    }

    await wait(520);
    introLoader.classList.add("is-complete");
    await wait(920);
    introLoader.classList.add("is-blinking");
    await wait(620);
    await wait(420);
    introLoader.classList.add("is-fading-count");
    await wait(680);
    await wait(260);
    introLoader.classList.add("is-line-visible");
    await wait(520);
    introLoader.classList.add("is-opening");
    playHeroWordmarkEntrance();
    unlockIntroScrolling();
    await wait(900);
    introLoader.classList.add("is-hidden");
    await wait(340);
    introLoader.setAttribute("hidden", "");
    markIntroAsSeen();
}

function setupDraggableWordmarks() {
    if (!draggableWordmarks.length) {
        return;
    }

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const defaultWordmark = draggableWordmarks[0];
    let activeWordmark = defaultWordmark;

    function syncTetherViewport() {
        if (!dragTetherLayer) {
            return;
        }

        dragTetherLayer.setAttribute("width", `${window.innerWidth}`);
        dragTetherLayer.setAttribute("height", `${window.innerHeight}`);
        dragTetherLayer.setAttribute(
            "viewBox",
            `0 0 ${window.innerWidth} ${window.innerHeight}`,
        );
    }

    function hideTether() {
        if (!dragTetherLayer || !dragTetherLine) {
            return;
        }

        dragTetherLayer.classList.remove("is-visible");
        dragTetherLine.removeAttribute("x1");
        dragTetherLine.removeAttribute("y1");
        dragTetherLine.removeAttribute("x2");
        dragTetherLine.removeAttribute("y2");
    }

    function hideDragIndicator() {
        if (!dragIndicator) {
            return;
        }

        dragIndicator.classList.remove("is-visible");
    }

    function setDragChipHidden(hidden) {
        if (!dragChip) {
            return;
        }

        dragChip.classList.toggle("is-hidden-during-drag", hidden);
    }

    function updateDragIndicator(homeX, homeY, currentX, currentY, state) {
        if (!dragIndicator || !dragIndicatorReadout) {
            return;
        }

        const indicatorX = homeX + (currentX - homeX) * 0.62;
        const indicatorY = homeY + (currentY - homeY) * 0.62 - 16;

        dragIndicator.style.left = `${indicatorX}px`;
        dragIndicator.style.top = `${indicatorY}px`;
        dragIndicatorReadout.textContent = `dx: ${Math.round(state.offsetX)}, dy: ${Math.round(state.offsetY)}`;
        dragIndicator.classList.add("is-visible");
    }

    function updateTether(element, state) {
        if (
            !dragTetherLayer ||
            !dragTetherLine ||
            state.homeCenterX === null ||
            state.homeCenterY === null
        ) {
            return;
        }

        const rect = element.getBoundingClientRect();
        const currentCenterX = rect.left + rect.width / 2;
        const currentCenterY = rect.top + rect.height / 2;
        const distance = Math.hypot(
            currentCenterX - state.homeCenterX,
            currentCenterY - state.homeCenterY,
        );

        if (distance < 1) {
            hideTether();
            hideDragIndicator();
            return;
        }

        dragTetherLine.setAttribute("x1", `${state.homeCenterX}`);
        dragTetherLine.setAttribute("y1", `${state.homeCenterY}`);
        dragTetherLine.setAttribute("x2", `${currentCenterX}`);
        dragTetherLine.setAttribute("y2", `${currentCenterY}`);
        dragTetherLayer.classList.add("is-visible");
        updateDragIndicator(
            state.homeCenterX,
            state.homeCenterY,
            currentCenterX,
            currentCenterY,
            state,
        );
    }

    function getHoveredWordmark() {
        return (
            draggableWordmarks.find((element) => element.matches(":hover")) ??
            null
        );
    }

    function setActiveWordmark(element = defaultWordmark) {
        if (!element) {
            return;
        }

        if (activeWordmark && activeWordmark !== element) {
            activeWordmark.classList.remove("is-active");
        }

        activeWordmark = element;
        activeWordmark.classList.add("is-active");

        if (dragChip && dragChip.parentElement !== activeWordmark) {
            activeWordmark.prepend(dragChip);
        }
    }

    function restoreActiveWordmark() {
        const hoveredWordmark = getHoveredWordmark();
        setActiveWordmark(hoveredWordmark ?? defaultWordmark);
    }

    draggableWordmarks.forEach((element) => {
        const state = {
            pointerId: null,
            offsetX: 0,
            offsetY: 0,
            startX: 0,
            startY: 0,
            resetFrame: null,
            homeCenterX: null,
            homeCenterY: null,
        };

        function applyTransform() {
            element.style.transform = `translate(${state.offsetX}px, ${state.offsetY}px)`;
        }

        function finishReturn() {
            element.classList.remove("is-returning");
            setDragChipHidden(false);
            hideTether();
            hideDragIndicator();
            restoreActiveWordmark();
        }

        function resetPosition() {
            if (state.resetFrame) {
                cancelAnimationFrame(state.resetFrame);
                state.resetFrame = null;
            }

            const shouldAnimateReturn =
                !prefersReducedMotion &&
                (Math.abs(state.offsetX) > 0.5 ||
                    Math.abs(state.offsetY) > 0.5);

            if (!shouldAnimateReturn) {
                state.offsetX = 0;
                state.offsetY = 0;
                applyTransform();
                finishReturn();
                return;
            }

            element.classList.add("is-returning");
            state.resetFrame = requestAnimationFrame(() => {
                state.offsetX = 0;
                state.offsetY = 0;
                applyTransform();
                state.resetFrame = null;
            });
        }

        function endDrag(event) {
            if (event.pointerId !== state.pointerId) {
                return;
            }

            const releasedPointerId = state.pointerId;
            state.pointerId = null;

            if (element.hasPointerCapture(releasedPointerId)) {
                element.releasePointerCapture(releasedPointerId);
            }

            element.classList.remove("is-dragging");
            hideTether();
            hideDragIndicator();
            resetPosition();
        }

        element.addEventListener("pointerenter", () => {
            if (state.pointerId !== null) {
                return;
            }

            setActiveWordmark(element);
        });

        element.addEventListener("pointerleave", () => {
            if (state.pointerId !== null) {
                return;
            }

            requestAnimationFrame(() => {
                restoreActiveWordmark();
            });
        });

        element.addEventListener("pointerdown", (event) => {
            if (state.pointerId !== null) {
                return;
            }

            if (state.resetFrame) {
                cancelAnimationFrame(state.resetFrame);
                state.resetFrame = null;
            }

            const rect = element.getBoundingClientRect();

            state.pointerId = event.pointerId;
            state.startX = event.clientX - state.offsetX;
            state.startY = event.clientY - state.offsetY;
            state.homeCenterX = rect.left + rect.width / 2;
            state.homeCenterY = rect.top + rect.height / 2;

            setActiveWordmark(element);
            element.classList.remove("is-returning");
            setDragChipHidden(true);
            element.classList.add("is-dragging");
            syncTetherViewport();
            element.setPointerCapture(state.pointerId);
        });

        element.addEventListener("pointermove", (event) => {
            if (event.pointerId !== state.pointerId) {
                return;
            }

            state.offsetX = event.clientX - state.startX;
            state.offsetY = event.clientY - state.startY;
            applyTransform();
            updateTether(element, state);
        });

        element.addEventListener("pointerup", endDrag);
        element.addEventListener("pointercancel", endDrag);
        element.addEventListener("lostpointercapture", () => {
            if (state.pointerId === null) {
                return;
            }

            state.pointerId = null;
            element.classList.remove("is-dragging");
            hideTether();
            hideDragIndicator();
            resetPosition();
        });

        element.addEventListener("transitionend", (event) => {
            if (
                event.propertyName !== "transform" ||
                !element.classList.contains("is-returning")
            ) {
                return;
            }

            finishReturn();
        });
    });

    syncTetherViewport();
    window.addEventListener("resize", syncTetherViewport);
    setActiveWordmark(defaultWordmark);
}

function setupAutoHidingHeader() {
    if (!siteHeader) {
        return;
    }

    const headers = Array.from(document.querySelectorAll(".site-header"));

    function showHeader() {
        headers.forEach((header) => {
            header.classList.remove("is-hidden");
        });
    }

    function hideHeader() {
        headers.forEach((header) => {
            header.classList.add("is-hidden");
        });
    }

    function isMenuOpen() {
        return headers.some((header) =>
            header.classList.contains("is-menu-open"),
        );
    }

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const mobileHeaderMedia = window.matchMedia("(max-width: 640px)");

    if (prefersReducedMotion) {
        showHeader();
        return;
    }

    let previousScrollY = Math.max(
        window.pageYOffset || document.documentElement.scrollTop || 0,
        0,
    );
    let upwardScrollDistance = 0;
    let downwardScrollDistance = 0;
    const topRevealDistance = 24;
    const revealDistance = 6;
    const hideDistance = 12;
    const scrollNoiseThreshold = 1;

    function updateHeaderState() {
        const currentScrollY = Math.max(
            window.pageYOffset || document.documentElement.scrollTop || 0,
            0,
        );
        const scrollDelta = currentScrollY - previousScrollY;

        if (Math.abs(scrollDelta) <= scrollNoiseThreshold) {
            return;
        }

        if (isMenuOpen()) {
            showHeader();
        } else if (currentScrollY <= topRevealDistance) {
            showHeader();
            upwardScrollDistance = 0;
            downwardScrollDistance = 0;
        } else if (scrollDelta < 0) {
            upwardScrollDistance += Math.abs(scrollDelta);
            downwardScrollDistance = 0;

            if (upwardScrollDistance >= revealDistance) {
                showHeader();
            }
        } else {
            downwardScrollDistance += scrollDelta;
            upwardScrollDistance = 0;

            if (downwardScrollDistance >= hideDistance) {
                hideHeader();
            }
        }

        previousScrollY = currentScrollY;
    }

    window.addEventListener("scroll", updateHeaderState, { passive: true });

    window.addEventListener("pageshow", () => {
        previousScrollY = Math.max(
            window.pageYOffset || document.documentElement.scrollTop || 0,
            0,
        );
        upwardScrollDistance = 0;
        downwardScrollDistance = 0;
        showHeader();
    });

    mobileHeaderMedia.addEventListener("change", showHeader);
    showHeader();
}

function setupHeroDescriptionTypewriter() {
    if (!heroDescription) {
        return;
    }

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const initialPhrase = heroDescription.textContent.trim();
    const configuredPhrases = (heroDescription.dataset.typewriterPhrases ?? "")
        .split("|")
        .map((phrase) => phrase.trim())
        .filter(Boolean);
    const phrases = Array.from(new Set([initialPhrase, ...configuredPhrases]));

    heroDescription.textContent = initialPhrase;
    heroDescription.classList.remove("is-restartable");
    heroDescription.removeAttribute("tabindex");
    heroDescription.removeAttribute("role");
    heroDescription.removeAttribute("aria-label");

    if (prefersReducedMotion || phrases.length < 2) {
        return;
    }

    let phraseIndex = 0;
    let characterIndex = phrases[0].length;
    let isDeleting = false;
    let isFinished = false;
    let timeoutId = null;

    function setRestartableState(enabled) {
        heroDescription.classList.toggle("is-restartable", enabled);

        if (enabled) {
            heroDescription.setAttribute("tabindex", "0");
            heroDescription.setAttribute("role", "button");
            heroDescription.setAttribute(
                "aria-label",
                "Restart description animation",
            );
            return;
        }

        heroDescription.removeAttribute("tabindex");
        heroDescription.removeAttribute("role");
        heroDescription.removeAttribute("aria-label");
    }

    function clearQueuedStep() {
        if (timeoutId === null) {
            return;
        }

        window.clearTimeout(timeoutId);
        timeoutId = null;
    }

    function queueNextStep(delay) {
        if (isFinished) {
            return;
        }

        clearQueuedStep();
        timeoutId = window.setTimeout(runTypewriterStep, delay);
    }

    function runTypewriterStep() {
        timeoutId = null;

        if (isFinished) {
            return;
        }

        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            characterIndex = Math.max(0, characterIndex - 1);
            heroDescription.textContent = currentPhrase.slice(
                0,
                characterIndex,
            );

            if (characterIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                queueNextStep(260);
                return;
            }

            queueNextStep(42);
            return;
        }

        const nextPhrase = phrases[phraseIndex];
        characterIndex = Math.min(nextPhrase.length, characterIndex + 1);
        heroDescription.textContent = nextPhrase.slice(0, characterIndex);

        if (characterIndex === nextPhrase.length) {
            if (phraseIndex === phrases.length - 1) {
                isFinished = true;
                setRestartableState(true);
                return;
            }

            isDeleting = true;
            queueNextStep(2300);
            return;
        }

        queueNextStep(72);
    }

    function restartSequence() {
        clearQueuedStep();
        phraseIndex = phrases.length - 1;
        characterIndex = phrases[phraseIndex].length;
        isDeleting = true;
        isFinished = false;
        setRestartableState(false);
        heroDescription.textContent = phrases[phraseIndex];
        queueNextStep(42);
    }

    heroDescription.addEventListener("click", () => {
        if (!isFinished) {
            return;
        }

        restartSequence();
    });

    heroDescription.addEventListener("keydown", (event) => {
        if (!isFinished || (event.key !== "Enter" && event.key !== " ")) {
            return;
        }

        event.preventDefault();
        restartSequence();
    });

    queueNextStep(2100);
}

function setupHeroSpotlight() {
    if (!heroPanel) {
        return;
    }

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    function setSpotlightPosition(xPercent, yPercent) {
        heroPanel.style.setProperty("--hero-spotlight-x", `${xPercent}%`);
        heroPanel.style.setProperty("--hero-spotlight-y", `${yPercent}%`);
    }

    if (prefersReducedMotion) {
        setSpotlightPosition(50, 50);
        return;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function updateSpotlight(event) {
        if (event.pointerType && event.pointerType !== "mouse") {
            return;
        }

        const rect = heroPanel.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            return;
        }

        const xPercent = clamp(
            ((event.clientX - rect.left) / rect.width) * 100,
            0,
            100,
        );
        const yPercent = clamp(
            ((event.clientY - rect.top) / rect.height) * 100,
            0,
            100,
        );

        setSpotlightPosition(xPercent, yPercent);
    }

    window.addEventListener("pointermove", updateSpotlight, { passive: true });
}

function setupHeroAtmosphereTrail() {
    if (!heroPanel || !heroOrbits.length) {
        return;
    }

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const state = {
        targetX: 0,
        targetY: 0,
        currentX: 0,
        currentY: 0,
        frameId: null,
    };

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function renderOffsets(x, y) {
        heroOrbits.forEach((orbit) => {
            const depth = Number.parseFloat(
                orbit.style.getPropertyValue("--orbit-depth") || "0.3",
            );
            const shiftX = x * depth;
            const shiftY = y * depth;
            const shiftRotation = (
                x * depth * 0.045 -
                y * depth * 0.02
            ).toFixed(2);

            orbit.style.setProperty(
                "--orbit-shift-x",
                `${shiftX.toFixed(2)}px`,
            );
            orbit.style.setProperty(
                "--orbit-shift-y",
                `${shiftY.toFixed(2)}px`,
            );
            orbit.style.setProperty("--orbit-shift-r", `${shiftRotation}deg`);
        });
    }

    if (prefersReducedMotion) {
        renderOffsets(0, 0);
        return;
    }

    function step() {
        state.currentX += (state.targetX - state.currentX) * 0.085;
        state.currentY += (state.targetY - state.currentY) * 0.085;

        renderOffsets(state.currentX, state.currentY);

        if (
            Math.abs(state.targetX - state.currentX) < 0.08 &&
            Math.abs(state.targetY - state.currentY) < 0.08
        ) {
            state.frameId = null;
            return;
        }

        state.frameId = window.requestAnimationFrame(step);
    }

    function requestStep() {
        if (state.frameId !== null) {
            return;
        }

        state.frameId = window.requestAnimationFrame(step);
    }

    function updateTrail(event) {
        if (event.pointerType && event.pointerType !== "mouse") {
            return;
        }

        const rect = heroPanel.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            return;
        }

        const normalizedX = clamp(
            (event.clientX - (rect.left + rect.width / 2)) / rect.width,
            -0.72,
            0.72,
        );
        const normalizedY = clamp(
            (event.clientY - (rect.top + rect.height / 2)) / rect.height,
            -0.62,
            0.62,
        );

        state.targetX = normalizedX * 150;
        state.targetY = normalizedY * 110;
        requestStep();
    }

    renderOffsets(0, 0);
    heroPanel.addEventListener("pointermove", updateTrail, { passive: true });
}

function setupStackTransition() {
    if (!stackTransition || !stackStage || !heroPanel || !revealPanels.length) {
        return;
    }

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const mobileStackMedia = window.matchMedia("(max-width: 640px)");
    const panelStates = revealPanels
        .map((panel) => {
            const editor = panel.querySelector(".reveal-editor");
            const indexLabel = panel.querySelector(".reveal-index");
            const message = panel.querySelector(".reveal-message");
            const lines = Array.from(panel.querySelectorAll(".reveal-line"));
            const segments = Array.from(
                panel.querySelectorAll(".reveal-segment"),
            );
            const segmentTexts = segments.map(
                (segment) => segment.dataset.scrollText ?? "",
            );
            const totalCharacters = segmentTexts.reduce(
                (sum, text) => sum + text.length,
                0,
            );

            if (
                !editor ||
                !indexLabel ||
                !message ||
                !lines.length ||
                !segments.length
            ) {
                return null;
            }

            return {
                panel,
                editor,
                indexLabel,
                message,
                lines,
                segments,
                segmentTexts,
                totalCharacters,
                lastVisibleCharacters: -1,
            };
        })
        .filter(Boolean);

    if (!panelStates.length) {
        return;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function renderIndex(panelState, entranceProgress) {
        const fadeProgress = clamp(entranceProgress / 0.55, 0, 1);
        const shift = (1 - fadeProgress) * 14;

        panelState.indexLabel.style.setProperty(
            "--reveal-index-opacity",
            fadeProgress.toFixed(4),
        );
        panelState.indexLabel.style.setProperty(
            "--reveal-index-shift",
            `${shift.toFixed(2)}px`,
        );
    }

    function getViewportHeight() {
        if (mobileStackMedia.matches) {
            return Math.max(
                document.documentElement.clientHeight || window.innerHeight,
                1,
            );
        }

        return Math.max(window.visualViewport?.height ?? window.innerHeight, 1);
    }

    function getStackTimings() {
        const viewportHeight = getViewportHeight();
        const isMobile = mobileStackMedia.matches;

        return {
            viewportHeight,
            transitionDistance: Math.max(
                viewportHeight * (isMobile ? 0.78 : 0.95),
                1,
            ),
            typingDistance: Math.max(
                viewportHeight * (isMobile ? 0.68 : 0.8),
                1,
            ),
            holdDistance: Math.max(
                viewportHeight * (isMobile ? 0.24 : 0.55),
                1,
            ),
        };
    }

    function syncStackHeight() {
        const {
            viewportHeight,
            transitionDistance,
            typingDistance,
            holdDistance,
        } = getStackTimings();
        const totalScrollDistance =
            panelStates.length * (transitionDistance + typingDistance) +
            holdDistance;

        stackTransition.style.minHeight = `${viewportHeight + totalScrollDistance}px`;
    }

    function renderSegments(panelState, textProgress) {
        const visibleCharacters = Math.floor(
            panelState.totalCharacters * textProgress,
        );

        if (visibleCharacters === panelState.lastVisibleCharacters) {
            return;
        }

        panelState.lastVisibleCharacters = visibleCharacters;
        let remainingCharacters = visibleCharacters;

        panelState.segments.forEach((segment, index) => {
            const fullText = panelState.segmentTexts[index];
            const shownLength = clamp(remainingCharacters, 0, fullText.length);

            segment.textContent = fullText.slice(0, shownLength);
            remainingCharacters -= shownLength;
        });

        panelState.lines.forEach((line) => {
            const hasVisibleText = Array.from(
                line.querySelectorAll(".reveal-segment"),
            ).some((segment) => segment.textContent.length > 0);

            line.classList.toggle("is-empty", !hasVisibleText);
        });
    }

    function render() {
        if (prefersReducedMotion) {
            heroPanel.style.transform = "none";
            stackStage.style.setProperty("--stack-progress", "0");

            panelStates.forEach((panelState, index) => {
                panelState.panel.style.transform =
                    index === panelStates.length - 1
                        ? "translate3d(0, 0, 0)"
                        : "translate3d(0, -100%, 0)";
                renderSegments(panelState, 1);
                renderIndex(panelState, 1);
                panelState.message.classList.add("is-visible");
                panelState.editor.classList.add("is-active");
                panelState.editor.classList.add("is-complete");
            });
            return;
        }

        const isMobile = mobileStackMedia.matches;
        const rect = stackTransition.getBoundingClientRect();
        const scrolledDistance = clamp(-rect.top, 0, Number.MAX_SAFE_INTEGER);
        const { transitionDistance, typingDistance } = getStackTimings();
        const transitionProgresses = panelStates.map(() => 0);
        const textProgresses = panelStates.map(() => 0);
        let cursor = 0;

        transitionProgresses[0] = clamp(
            scrolledDistance / transitionDistance,
            0,
            1,
        );
        cursor += transitionDistance;
        textProgresses[0] = clamp(
            (scrolledDistance - cursor) / typingDistance,
            0,
            1,
        );
        cursor += typingDistance;

        for (let index = 1; index < panelStates.length; index += 1) {
            transitionProgresses[index] = clamp(
                (scrolledDistance - cursor) / transitionDistance,
                0,
                1,
            );
            cursor += transitionDistance;
            textProgresses[index] = clamp(
                (scrolledDistance - cursor) / typingDistance,
                0,
                1,
            );
            cursor += typingDistance;
        }

        const panelProgress = transitionProgresses[0];

        const pushBack = (isMobile ? -52 : -150) * panelProgress;
        const scale = 1 - (isMobile ? 0.025 : 0.06) * panelProgress;
        const tiltX = (isMobile ? 2.4 : 8.5) * panelProgress;
        const tiltZ = (isMobile ? -0.8 : -2.6) * panelProgress;

        stackStage.style.setProperty(
            "--stack-progress",
            panelProgress.toFixed(4),
        );
        heroPanel.style.transform = `translate3d(0, 0, ${pushBack}px) scale(${scale}) rotateX(${tiltX}deg) rotate(${tiltZ}deg)`;

        panelStates.forEach((panelState, index) => {
            const entranceProgress = transitionProgresses[index];
            const exitProgress =
                index < panelStates.length - 1
                    ? transitionProgresses[index + 1]
                    : 0;
            const textProgress = textProgresses[index];
            const translateY = (1 - entranceProgress - exitProgress) * 100;

            panelState.panel.style.transform = `translate3d(0, ${translateY}%, 0)`;
            renderSegments(panelState, textProgress);
            renderIndex(panelState, entranceProgress);
            panelState.message.classList.toggle("is-visible", textProgress > 0);
            panelState.editor.classList.toggle("is-active", textProgress > 0);
            panelState.editor.classList.toggle(
                "is-complete",
                textProgress >= 1,
            );
        });
    }

    let ticking = false;

    function requestUpdate() {
        if (ticking) {
            return;
        }

        ticking = true;
        window.requestAnimationFrame(() => {
            render();
            ticking = false;
        });
    }

    function refreshStackLayout() {
        syncStackHeight();
        requestUpdate();
    }

    function refreshStackLayoutAfterPaint() {
        window.requestAnimationFrame(() => {
            resetHomeScrollPosition();
            refreshStackLayout();
        });
    }

    resetHomeScrollPosition();
    syncStackHeight();
    render();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", refreshStackLayout);
    window.addEventListener("load", refreshStackLayout, { once: true });
    window.addEventListener(
        "portfolio:intro-scroll-unlocked",
        refreshStackLayoutAfterPaint,
        { once: true },
    );
    window.visualViewport?.addEventListener("resize", refreshStackLayout);
    mobileStackMedia.addEventListener("change", refreshStackLayout);
}

function setupFeaturedMediaParallax() {
    if (!featuredMediaItems.length || !featuredImages.length) {
        return;
    }

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const mobileParallaxMedia = window.matchMedia("(max-width: 640px)");

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    if (prefersReducedMotion) {
        featuredImages.forEach((image) => {
            image.style.setProperty("--featured-image-shift", "0px");
        });
        return;
    }

    const mediaStates = featuredMediaItems
        .map((media, index) => {
            const image = featuredImages[index];

            if (!image) {
                return null;
            }

            return {
                media,
                image,
                currentShift: 0,
                targetShift: 0,
            };
        })
        .filter(Boolean);

    if (!mediaStates.length) {
        return;
    }

    let frameId = null;

    function getViewportHeight() {
        return Math.max(window.visualViewport?.height ?? window.innerHeight, 1);
    }

    function measureTargetShift(media) {
        const rect = media.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            return 0;
        }

        const viewportHeight = getViewportHeight();
        const progress = clamp(
            (viewportHeight - rect.top) / (viewportHeight + rect.height),
            0,
            1,
        );
        const maxTravel = mobileParallaxMedia.matches
            ? Math.min(44, rect.width * 0.1)
            : Math.min(144, rect.width * 0.24);
        return (0.5 - progress) * maxTravel;
    }

    function renderShifts() {
        mediaStates.forEach((state) => {
            state.image.style.setProperty(
                "--featured-image-shift",
                `${state.currentShift.toFixed(2)}px`,
            );
        });
    }

    function step() {
        let isAnimating = false;

        mediaStates.forEach((state) => {
            const delta = state.targetShift - state.currentShift;

            state.currentShift +=
                delta * (mobileParallaxMedia.matches ? 0.16 : 0.09);

            if (Math.abs(delta) < 0.05) {
                state.currentShift = state.targetShift;
                return;
            }

            isAnimating = true;
        });

        renderShifts();

        if (!isAnimating) {
            frameId = null;
            return;
        }

        frameId = window.requestAnimationFrame(step);
    }

    function requestStep() {
        if (frameId !== null) {
            return;
        }

        frameId = window.requestAnimationFrame(step);
    }

    function syncTarget() {
        mediaStates.forEach((state) => {
            state.targetShift = measureTargetShift(state.media);
        });
        requestStep();
    }

    mediaStates.forEach((state) => {
        state.currentShift = measureTargetShift(state.media);
        state.targetShift = state.currentShift;

        if (!state.image.complete) {
            state.image.addEventListener("load", syncTarget, { once: true });
        }
    });
    renderShifts();

    window.addEventListener("scroll", syncTarget, { passive: true });
    window.addEventListener("resize", syncTarget);
    window.addEventListener("orientationchange", syncTarget);
    window.addEventListener("pageshow", syncTarget);
    window.visualViewport?.addEventListener("resize", syncTarget);
    window.visualViewport?.addEventListener(
        "scroll",
        () => {
            if (!mobileParallaxMedia.matches) {
                syncTarget();
            }
        },
        { passive: true },
    );
    mobileParallaxMedia.addEventListener("change", syncTarget);
}

function setupWorkProjectImageScroll() {
    if (!workProjectMediaItems.length || !workProjectImages.length) {
        return;
    }

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const mobileParallaxMedia = window.matchMedia("(max-width: 640px)");

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    if (prefersReducedMotion) {
        workProjectImages.forEach((image) => {
            image.style.setProperty("--work-project-image-shift", "0px");
        });
        return;
    }

    const mediaStates = workProjectMediaItems
        .map((media, index) => {
            const image = workProjectImages[index];

            if (!image) {
                return null;
            }

            return {
                media,
                image,
                currentShift: 0,
                targetShift: 0,
            };
        })
        .filter(Boolean);

    if (!mediaStates.length) {
        return;
    }

    let frameId = null;

    function getViewportHeight() {
        return Math.max(window.visualViewport?.height ?? window.innerHeight, 1);
    }

    function measureTargetShift(media) {
        const rect = media.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            return 0;
        }

        const viewportHeight = getViewportHeight();
        const progress = clamp(
            (viewportHeight - rect.top) / (viewportHeight + rect.height),
            0,
            1,
        );
        const maxTravel = mobileParallaxMedia.matches
            ? Math.min(32, rect.width * 0.08)
            : Math.min(88, rect.width * 0.16);
        return (0.5 - progress) * maxTravel;
    }

    function renderShifts() {
        mediaStates.forEach((state) => {
            state.image.style.setProperty(
                "--work-project-image-shift",
                `${state.currentShift.toFixed(2)}px`,
            );
        });
    }

    function step() {
        let isAnimating = false;

        mediaStates.forEach((state) => {
            const delta = state.targetShift - state.currentShift;

            state.currentShift +=
                delta * (mobileParallaxMedia.matches ? 0.16 : 0.09);

            if (Math.abs(delta) < 0.05) {
                state.currentShift = state.targetShift;
                return;
            }

            isAnimating = true;
        });

        renderShifts();

        if (!isAnimating) {
            frameId = null;
            return;
        }

        frameId = window.requestAnimationFrame(step);
    }

    function requestStep() {
        if (frameId !== null) {
            return;
        }

        frameId = window.requestAnimationFrame(step);
    }

    function syncTarget() {
        mediaStates.forEach((state) => {
            state.targetShift = measureTargetShift(state.media);
        });
        requestStep();
    }

    mediaStates.forEach((state) => {
        state.currentShift = measureTargetShift(state.media);
        state.targetShift = state.currentShift;

        if (!state.image.complete) {
            state.image.addEventListener("load", syncTarget, { once: true });
        }
    });
    renderShifts();

    window.addEventListener("scroll", syncTarget, { passive: true });
    window.addEventListener("resize", syncTarget);
    window.addEventListener("orientationchange", syncTarget);
    window.addEventListener("pageshow", syncTarget);
    window.visualViewport?.addEventListener("resize", syncTarget);
    window.visualViewport?.addEventListener(
        "scroll",
        () => {
            if (!mobileParallaxMedia.matches) {
                syncTarget();
            }
        },
        { passive: true },
    );
    mobileParallaxMedia.addEventListener("change", syncTarget);
}

function setupFeaturedCardStack() {
    if (featuredCards.length < 2) {
        return;
    }

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const compactLayout = window.matchMedia("(max-width: 960px)");

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function resetCards() {
        featuredCards.forEach((card, index) => {
            card.style.setProperty("--featured-layer", `${index + 1}`);
            card.style.setProperty("--featured-card-shift-y", "0px");
            card.style.setProperty("--featured-card-depth", "0px");
            card.style.setProperty("--featured-card-scale", "1");
            card.style.setProperty("--featured-card-blur", "0px");
            card.style.setProperty("--featured-card-opacity", "1");
            card.style.setProperty("--featured-card-brightness", "1");
        });
    }

    function render() {
        if (prefersReducedMotion || compactLayout.matches) {
            resetCards();
            return;
        }

        resetCards();

        const stickyTop =
            Number.parseFloat(window.getComputedStyle(featuredCards[0]).top) ||
            0;
        const handoffDistance = Math.max(window.innerHeight * 0.48, 1);

        for (let index = 0; index < featuredCards.length - 1; index += 1) {
            const card = featuredCards[index];
            const nextCard = featuredCards[index + 1];
            const nextRect = nextCard.getBoundingClientRect();
            const progress = clamp(
                (stickyTop + handoffDistance - nextRect.top) / handoffDistance,
                0,
                1,
            );

            card.style.setProperty(
                "--featured-card-shift-y",
                `${(-24 * progress).toFixed(2)}px`,
            );
            card.style.setProperty(
                "--featured-card-depth",
                `${(-220 * progress).toFixed(2)}px`,
            );
            card.style.setProperty(
                "--featured-card-scale",
                `${(1 - 0.1 * progress).toFixed(4)}`,
            );
            card.style.setProperty(
                "--featured-card-blur",
                `${(18 * progress).toFixed(2)}px`,
            );
            card.style.setProperty(
                "--featured-card-opacity",
                `${(1 - 0.82 * progress).toFixed(4)}`,
            );
            card.style.setProperty(
                "--featured-card-brightness",
                `${(1 - 0.22 * progress).toFixed(4)}`,
            );
        }
    }

    let ticking = false;

    function requestUpdate() {
        if (ticking) {
            return;
        }

        ticking = true;
        window.requestAnimationFrame(() => {
            render();
            ticking = false;
        });
    }

    render();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    compactLayout.addEventListener("change", requestUpdate);
}

function setupFooterPhotoGallery() {
    if (!footerPhotoGallery || !footerPhotos.length) {
        return;
    }

    const dragBoundsElement = footerPhotoGallery.closest(".site-footer");

    if (!dragBoundsElement) {
        return;
    }

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const photoStates = [];
    let zIndexSeed = footerPhotos.length + 10;
    let activeFooterPhotoTrigger = null;

    const footerPhotoPreview = document.createElement("div");
    const footerPhotoPreviewImage = document.createElement("img");
    const footerPhotoPreviewClose = document.createElement("button");

    footerPhotoPreview.className = "footer-photo-preview";
    footerPhotoPreview.setAttribute("aria-hidden", "true");
    footerPhotoPreview.innerHTML = `
        <span class="footer-photo-preview-title" aria-hidden="true">
            PHOTOGRAPHY
        </span>
        <span
            class="footer-photo-preview-title footer-photo-preview-title-secondary"
            aria-hidden="true"
        >
            PHOTOGRAPHY
        </span>
        <div class="footer-photo-preview-frame"></div>
    `;

    footerPhotoPreviewImage.className = "footer-photo-preview-image";
    footerPhotoPreviewImage.decoding = "async";

    footerPhotoPreviewClose.className = "footer-photo-preview-close";
    footerPhotoPreviewClose.type = "button";
    footerPhotoPreviewClose.setAttribute("aria-label", "Close footer image");
    footerPhotoPreviewClose.innerHTML = '<span aria-hidden="true"></span>';

    footerPhotoPreview
        .querySelector(".footer-photo-preview-frame")
        ?.append(footerPhotoPreviewImage, footerPhotoPreviewClose);
    document.body.append(footerPhotoPreview);

    footerPhotoGallery.querySelectorAll("img").forEach((image) => {
        image.loading = "eager";
        image.decoding = "async";

        if (!image.complete && typeof image.decode === "function") {
            image.decode().catch(() => {
                // The regular image load path still handles decode failures.
            });
        }
    });

    function bringToFront(element) {
        element.style.zIndex = `${zIndexSeed}`;
        zIndexSeed += 1;
    }

    function closeFooterPhotoPreview() {
        footerPhotoPreview.classList.remove("is-open");
        footerPhotoPreview.setAttribute("aria-hidden", "true");
        footerPhotoPreviewImage.removeAttribute("src");
        footerPhotoPreviewImage.removeAttribute("alt");

        if (activeFooterPhotoTrigger) {
            activeFooterPhotoTrigger.focus();
            activeFooterPhotoTrigger = null;
        }
    }

    function openFooterPhotoPreview(element) {
        const image = element.querySelector("img");
        const source = element.getAttribute("href") || image?.currentSrc;

        if (!source) {
            return;
        }

        activeFooterPhotoTrigger = element;
        footerPhotoPreviewImage.src = source;
        footerPhotoPreviewImage.alt = image?.alt || "Footer image preview";
        footerPhotoPreview.classList.add("is-open");
        footerPhotoPreview.setAttribute("aria-hidden", "false");
        footerPhotoPreviewClose.focus();
    }

    footerPhotoPreview.addEventListener("click", (event) => {
        if (
            event.target === footerPhotoPreview ||
            event.target.classList.contains("footer-photo-preview-frame")
        ) {
            closeFooterPhotoPreview();
        }
    });

    footerPhotoPreviewClose.addEventListener("click", closeFooterPhotoPreview);

    document.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            footerPhotoPreview.classList.contains("is-open")
        ) {
            closeFooterPhotoPreview();
        }
    });

    footerPhotos.forEach((element, index) => {
        const configuredLayer = Number.parseInt(
            element.style.getPropertyValue("--photo-layer") || `${index + 1}`,
            10,
        );

        if (Number.isFinite(configuredLayer)) {
            element.style.zIndex = `${configuredLayer}`;
            zIndexSeed = Math.max(zIndexSeed, configuredLayer + 1);
        }
    });

    footerPhotos.forEach((element) => {
        const rotation =
            element.style.getPropertyValue("--photo-rotate").trim() || "0deg";
        const state = {
            pointerId: null,
            action: "move",
            resizeHandle: null,
            offsetX: 0,
            offsetY: 0,
            startX: 0,
            startY: 0,
            startWidth: 0,
            initialOffsetX: 0,
            initialOffsetY: 0,
            minX: Number.NEGATIVE_INFINITY,
            maxX: Number.POSITIVE_INFINITY,
            minY: Number.NEGATIVE_INFINITY,
            maxY: Number.POSITIVE_INFINITY,
            moved: false,
            suppressClick: false,
        };

        function applyTransform() {
            element.style.transform = `translate3d(${state.offsetX}px, ${state.offsetY}px, 0) rotate(${rotation})`;
        }

        function constrainToFooter() {
            const boundsRect = dragBoundsElement.getBoundingClientRect();
            const rect = element.getBoundingClientRect();
            const padding = 8;
            const minX =
                state.offsetX + (boundsRect.left + padding - rect.left);
            const maxX =
                state.offsetX + (boundsRect.right - padding - rect.right);
            const minY = state.offsetY + (boundsRect.top + padding - rect.top);
            const maxY =
                state.offsetY + (boundsRect.bottom - padding - rect.bottom);

            state.offsetX = clamp(state.offsetX, minX, maxX);
            state.offsetY = clamp(state.offsetY, minY, maxY);
            applyTransform();
        }

        function endDrag(event) {
            if (event.pointerId !== state.pointerId) {
                return;
            }

            const releasedPointerId = state.pointerId;
            state.pointerId = null;
            state.resizeHandle = null;

            if (element.hasPointerCapture(releasedPointerId)) {
                element.releasePointerCapture(releasedPointerId);
            }

            element.classList.remove("is-dragging");
            element.classList.remove("is-resizing");
        }

        applyTransform();
        photoStates.push({ constrainToFooter });

        element.addEventListener("dragstart", (event) => {
            event.preventDefault();
        });

        element.addEventListener("pointerenter", () => {
            bringToFront(element);
        });

        element.addEventListener("focus", () => {
            bringToFront(element);
        });

        element.addEventListener("pointerdown", (event) => {
            if (state.pointerId !== null) {
                return;
            }

            if (event.button !== undefined && event.button !== 0) {
                return;
            }

            const boundsRect = dragBoundsElement.getBoundingClientRect();
            const rect = element.getBoundingClientRect();
            const padding = 8;
            const resizeHandle = event.target.closest(".footer-photo-handle");

            state.pointerId = event.pointerId;
            state.action = resizeHandle ? "resize" : "move";
            state.resizeHandle = resizeHandle;
            state.startX = event.clientX;
            state.startY = event.clientY;
            state.startWidth = rect.width;
            state.initialOffsetX = state.offsetX;
            state.initialOffsetY = state.offsetY;
            state.moved = false;
            state.suppressClick = false;
            state.minX =
                state.offsetX + (boundsRect.left + padding - rect.left);
            state.maxX =
                state.offsetX + (boundsRect.right - padding - rect.right);
            state.minY = state.offsetY + (boundsRect.top + padding - rect.top);
            state.maxY =
                state.offsetY + (boundsRect.bottom - padding - rect.bottom);

            bringToFront(element);
            if (state.action === "resize") {
                element.classList.add("is-resizing");
                event.preventDefault();
            } else {
                element.classList.add("is-dragging");
            }
            element.setPointerCapture(state.pointerId);
        });

        element.addEventListener("pointermove", (event) => {
            if (event.pointerId !== state.pointerId) {
                return;
            }

            if (state.action === "resize") {
                const handleClasses = state.resizeHandle?.classList;
                const horizontalDelta = handleClasses?.contains(
                    "footer-photo-handle-middle-left",
                )
                    ? state.startX - event.clientX
                    : handleClasses?.contains(
                            "footer-photo-handle-middle-right",
                        )
                      ? event.clientX - state.startX
                      : 0;
                const verticalDelta =
                    handleClasses?.contains("footer-photo-handle-top-left") ||
                    handleClasses?.contains("footer-photo-handle-top-center") ||
                    handleClasses?.contains("footer-photo-handle-top-right")
                        ? state.startY - event.clientY
                        : handleClasses?.contains(
                                "footer-photo-handle-bottom-left",
                            ) ||
                            handleClasses?.contains(
                                "footer-photo-handle-bottom-center",
                            ) ||
                            handleClasses?.contains(
                                "footer-photo-handle-bottom-right",
                            )
                          ? event.clientY - state.startY
                          : 0;
                const cornerDelta =
                    handleClasses?.contains("footer-photo-handle-top-left") ||
                    handleClasses?.contains("footer-photo-handle-bottom-left")
                        ? state.startX - event.clientX
                        : handleClasses?.contains(
                                "footer-photo-handle-top-right",
                            ) ||
                            handleClasses?.contains(
                                "footer-photo-handle-bottom-right",
                            )
                          ? event.clientX - state.startX
                          : 0;
                const resizeDelta =
                    Math.abs(cornerDelta) > Math.abs(verticalDelta)
                        ? cornerDelta
                        : verticalDelta || horizontalDelta;
                const boundsRect = dragBoundsElement.getBoundingClientRect();
                const minWidth = 72;
                const maxWidth = Math.min(260, boundsRect.width * 0.72);
                const nextWidth = clamp(
                    state.startWidth + resizeDelta,
                    minWidth,
                    maxWidth,
                );

                element.style.width = `${nextWidth}px`;
                constrainToFooter();

                if (
                    !state.moved &&
                    Math.abs(nextWidth - state.startWidth) > 3
                ) {
                    state.moved = true;
                    state.suppressClick = true;
                }

                event.preventDefault();
                return;
            }

            const rawX = state.initialOffsetX + (event.clientX - state.startX);
            const rawY = state.initialOffsetY + (event.clientY - state.startY);

            state.offsetX = clamp(rawX, state.minX, state.maxX);
            state.offsetY = clamp(rawY, state.minY, state.maxY);

            if (!state.moved) {
                const distance = Math.hypot(
                    state.offsetX - state.initialOffsetX,
                    state.offsetY - state.initialOffsetY,
                );

                if (distance > 3) {
                    state.moved = true;
                    state.suppressClick = true;
                    element.classList.add("is-dragging");
                }
            }

            applyTransform();

            if (state.moved) {
                event.preventDefault();
            }
        });

        element.addEventListener("pointerup", endDrag);
        element.addEventListener("pointercancel", endDrag);
        element.addEventListener("lostpointercapture", () => {
            if (state.pointerId === null) {
                return;
            }

            state.pointerId = null;
            state.resizeHandle = null;
            element.classList.remove("is-dragging");
            element.classList.remove("is-resizing");
        });

        element.addEventListener("click", (event) => {
            event.preventDefault();

            if (state.suppressClick) {
                state.suppressClick = false;
                return;
            }

            if (event.target.closest(".footer-photo-handle")) {
                return;
            }

            openFooterPhotoPreview(element);
        });

        if (prefersReducedMotion) {
            constrainToFooter();
        }
    });

    photoStates.forEach((photoState) => {
        photoState.constrainToFooter();
    });

    window.addEventListener("resize", () => {
        photoStates.forEach((photoState) => {
            photoState.constrainToFooter();
        });
    });
}

function setupAboutPagePhotoDrag() {
    if (!aboutPageGallery || !aboutPagePhotos.length) {
        return;
    }

    const supportsDesktopPointer = window.matchMedia(
        "(hover: hover) and (pointer: fine) and (min-width: 769px)",
    ).matches;

    if (!supportsDesktopPointer) {
        return;
    }

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const photoStates = [];
    const returnQueue = [];
    const returnWorkerMessages = [
        "dud, stop destroying the layout",
        "Again? really?",
        "This dud doesn't kno how to listen",
        "i said stop destroying the layout -_-",
    ];
    let isReturnWorkerActive = false;
    let returnWorkerMessageIndex = 0;
    let zIndexSeed = aboutPagePhotos.length + 20;

    function bringToFront(element) {
        element.style.zIndex = `${zIndexSeed}`;
        zIndexSeed += 1;
    }

    function getNextReturnWorkerMessage() {
        const message =
            returnWorkerMessages[
                returnWorkerMessageIndex % returnWorkerMessages.length
            ];

        returnWorkerMessageIndex += 1;
        return message;
    }

    function animateReturnCursor(element, offsetX, offsetY, onComplete) {
        if (!offsetX && !offsetY) {
            onComplete?.();
            return;
        }

        const galleryRect = aboutPageGallery.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const cursor = document.createElement("span");
        const cursorHalo = document.createElement("span");
        const cursorFrame = document.createElement("span");
        const cursorCore = document.createElement("span");
        const cursorLabel = document.createElement("span");
        const cursorMessage = document.createElement("span");
        const pickupX =
            elementRect.left + elementRect.width / 2 - galleryRect.left;
        const pickupY =
            elementRect.top + elementRect.height / 2 - galleryRect.top;
        const startX = galleryRect.width + 42;
        const startY = pickupY - 36;
        const endX = pickupX - offsetX;
        const endY = pickupY - offsetY;

        cursor.className = "about-photo-reset-cursor";
        cursorHalo.className = "about-photo-reset-cursor-halo";
        cursorFrame.className = "about-photo-reset-cursor-frame";
        cursorCore.className = "about-photo-reset-cursor-core";
        cursorLabel.className = "about-photo-reset-cursor-label";
        cursorMessage.className = "about-photo-reset-cursor-message";
        cursorLabel.textContent = "DRAG";
        cursorMessage.textContent = getNextReturnWorkerMessage();
        cursor.setAttribute("aria-hidden", "true");
        cursor.style.setProperty("--reset-cursor-start-x", `${startX}px`);
        cursor.style.setProperty("--reset-cursor-start-y", `${startY}px`);
        cursor.style.setProperty("--reset-cursor-pickup-x", `${pickupX}px`);
        cursor.style.setProperty("--reset-cursor-pickup-y", `${pickupY}px`);
        cursor.style.setProperty("--reset-cursor-end-x", `${endX}px`);
        cursor.style.setProperty("--reset-cursor-end-y", `${endY}px`);
        cursor.append(
            cursorHalo,
            cursorFrame,
            cursorCore,
            cursorLabel,
            cursorMessage,
        );
        aboutPageGallery.append(cursor);

        cursor.addEventListener(
            "animationend",
            () => {
                cursor.remove();
                onComplete?.();
            },
            { once: true },
        );
    }

    function removeQueuedReturn(element) {
        for (let index = returnQueue.length - 1; index >= 0; index -= 1) {
            if (returnQueue[index].element === element) {
                returnQueue.splice(index, 1);
            }
        }
    }

    function isPhotoAwayFromHome(state) {
        return Math.hypot(state.offsetX, state.offsetY) > 1;
    }

    function processReturnQueue() {
        if (isReturnWorkerActive) {
            return;
        }

        const task = returnQueue.shift();

        if (!task) {
            return;
        }

        isReturnWorkerActive = true;
        bringToFront(task.element);

        animateReturnCursor(task.element, task.offsetX, task.offsetY, () => {
            task.element.classList.remove("is-return-pending");
            task.element.classList.remove("is-returning");
            task.state.returnTimerId = null;
            task.state.returnCleanupTimerId = null;
            isReturnWorkerActive = false;

            if (
                task.state.pointerId === null &&
                isPhotoAwayFromHome(task.state)
            ) {
                queuePhotoReturn({
                    element: task.element,
                    state: task.state,
                    applyOffset: task.applyOffset,
                    offsetX: task.state.offsetX,
                    offsetY: task.state.offsetY,
                });
                return;
            }

            processReturnQueue();
        });

        task.state.returnTimerId = window.setTimeout(() => {
            task.element.classList.remove("is-return-pending");
            task.element.classList.add("is-returning");
            task.state.offsetX = 0;
            task.state.offsetY = 0;
            task.applyOffset();
            task.state.returnTimerId = null;
        }, 1230);

        task.state.returnCleanupTimerId = window.setTimeout(() => {
            task.element.classList.remove("is-return-pending");
            task.element.classList.remove("is-returning");
            task.state.returnCleanupTimerId = null;
        }, 1980);
    }

    function queuePhotoReturn(task) {
        removeQueuedReturn(task.element);
        task.element.classList.add("is-return-pending");
        returnQueue.push(task);
        processReturnQueue();
    }

    aboutPagePhotos.forEach((element) => {
        const state = {
            pointerId: null,
            offsetX: 0,
            offsetY: 0,
            startX: 0,
            startY: 0,
            initialOffsetX: 0,
            initialOffsetY: 0,
            minX: Number.NEGATIVE_INFINITY,
            maxX: Number.POSITIVE_INFINITY,
            minY: Number.NEGATIVE_INFINITY,
            maxY: Number.POSITIVE_INFINITY,
            moved: false,
            returnTimerId: null,
            returnCleanupTimerId: null,
        };

        function applyOffset() {
            element.style.setProperty(
                "--about-photo-drag-x",
                `${state.offsetX}px`,
            );
            element.style.setProperty(
                "--about-photo-drag-y",
                `${state.offsetY}px`,
            );
        }

        function getViewportDragLimits() {
            const rect = element.getBoundingClientRect();
            const padding = 8;

            return {
                minX: state.offsetX + (padding - rect.left),
                maxX:
                    state.offsetX + (window.innerWidth - padding - rect.right),
                minY: state.offsetY + (padding - rect.top),
                maxY:
                    state.offsetY +
                    (window.innerHeight - padding - rect.bottom),
            };
        }

        function constrainToViewport() {
            const limits = getViewportDragLimits();

            state.offsetX = clamp(state.offsetX, limits.minX, limits.maxX);
            state.offsetY = clamp(state.offsetY, limits.minY, limits.maxY);
            applyOffset();
        }

        function endDrag(event) {
            if (event.pointerId !== state.pointerId) {
                return;
            }

            const releasedPointerId = state.pointerId;
            const shouldReturn = state.moved || isPhotoAwayFromHome(state);
            const returnOffsetX = state.offsetX;
            const returnOffsetY = state.offsetY;

            state.pointerId = null;

            if (element.hasPointerCapture(releasedPointerId)) {
                element.releasePointerCapture(releasedPointerId);
            }

            element.classList.remove("is-dragging");

            if (shouldReturn) {
                queuePhotoReturn({
                    element,
                    state,
                    applyOffset,
                    offsetX: returnOffsetX,
                    offsetY: returnOffsetY,
                });
            }
        }

        applyOffset();
        photoStates.push({ constrainToViewport });

        element.addEventListener("dragstart", (event) => {
            event.preventDefault();
        });

        element.addEventListener("pointerenter", () => {
            bringToFront(element);
        });

        element.addEventListener("pointerdown", (event) => {
            if (state.pointerId !== null) {
                return;
            }

            if (event.button !== undefined && event.button !== 0) {
                return;
            }

            if (state.returnTimerId !== null) {
                window.clearTimeout(state.returnTimerId);
                state.returnTimerId = null;
            }

            if (state.returnCleanupTimerId !== null) {
                window.clearTimeout(state.returnCleanupTimerId);
                state.returnCleanupTimerId = null;
            }

            removeQueuedReturn(element);
            element.classList.remove("is-return-pending");
            element.classList.remove("is-returning");

            const limits = getViewportDragLimits();

            state.pointerId = event.pointerId;
            state.startX = event.clientX;
            state.startY = event.clientY;
            state.initialOffsetX = state.offsetX;
            state.initialOffsetY = state.offsetY;
            state.moved = false;
            state.minX = limits.minX;
            state.maxX = limits.maxX;
            state.minY = limits.minY;
            state.maxY = limits.maxY;

            bringToFront(element);
            element.setPointerCapture(state.pointerId);
        });

        element.addEventListener("pointermove", (event) => {
            if (event.pointerId !== state.pointerId) {
                return;
            }

            const rawX = state.initialOffsetX + (event.clientX - state.startX);
            const rawY = state.initialOffsetY + (event.clientY - state.startY);

            state.offsetX = clamp(rawX, state.minX, state.maxX);
            state.offsetY = clamp(rawY, state.minY, state.maxY);

            if (
                !state.moved &&
                Math.hypot(
                    state.offsetX - state.initialOffsetX,
                    state.offsetY - state.initialOffsetY,
                ) > 3
            ) {
                state.moved = true;
                element.classList.add("is-dragging");
            }

            applyOffset();

            if (state.moved) {
                event.preventDefault();
            }
        });

        element.addEventListener("pointerup", endDrag);
        element.addEventListener("pointercancel", endDrag);
        element.addEventListener("lostpointercapture", () => {
            if (state.pointerId === null) {
                return;
            }

            state.pointerId = null;
            element.classList.remove("is-dragging");
        });
    });

    window.addEventListener("resize", () => {
        photoStates.forEach((photoState) => {
            photoState.constrainToViewport();
        });
    });
}

function setupAboutPageMobilePhotoReveal() {
    if (!aboutPagePhotos.length) {
        return;
    }

    const supportsMobilePointer = window.matchMedia(
        "(hover: none), (pointer: coarse), (max-width: 768px)",
    ).matches;

    if (!supportsMobilePointer) {
        return;
    }

    aboutPagePhotos.forEach((element) => {
        element.addEventListener("click", () => {
            element.classList.toggle("is-mobile-revealed");
        });
    });
}

function setupEducationBadgesModal() {
    const educationBadges = Array.from(
        document.querySelectorAll("[data-education-badge]"),
    );

    if (!educationBadges.length) {
        return;
    }

    let activeEducationBadge = null;
    const modal = document.createElement("div");
    const modalLogo = document.createElement("img");
    const modalKicker = document.createElement("p");
    const modalTitle = document.createElement("h2");
    const modalStory = document.createElement("p");
    const modalClose = document.createElement("button");

    modal.className = "education-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
        <div
            class="education-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="educationModalTitle"
        >
            <div class="education-modal-crest"></div>
            <div class="education-modal-content"></div>
        </div>
    `;

    modalLogo.className = "education-modal-logo";
    modalLogo.decoding = "async";
    modalKicker.className = "education-modal-kicker";
    modalTitle.className = "education-modal-title";
    modalTitle.id = "educationModalTitle";
    modalStory.className = "education-modal-story";
    modalClose.className = "education-modal-close";
    modalClose.type = "button";
    modalClose.setAttribute("aria-label", "Close school story");
    modalClose.innerHTML = '<span aria-hidden="true"></span>';

    modal.querySelector(".education-modal-crest")?.append(modalLogo);
    modal
        .querySelector(".education-modal-content")
        ?.append(modalKicker, modalTitle, modalStory);
    modal.querySelector(".education-modal-card")?.append(modalClose);
    document.body.append(modal);

    function hideEducationModal() {
        modal.classList.remove("is-open");
        modal.classList.remove("is-logo-ready");
        modal.setAttribute("aria-hidden", "true");

        if (activeEducationBadge) {
            activeEducationBadge.focus();
            activeEducationBadge = null;
        }
    }

    function closeEducationModal() {
        if (!modal.classList.contains("is-open")) {
            return;
        }

        animateEducationLogoToBadge();
    }

    function openEducationModal(badge) {
        const logo = badge.querySelector("img");
        const schoolName = badge.dataset.schoolName || badge.textContent.trim();
        const schoolKicker = badge.dataset.schoolKicker || "School Days";
        const story =
            badge.dataset.schoolStory ||
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

        activeEducationBadge = badge;
        modal.classList.remove("is-logo-ready");
        modalLogo.src = logo?.currentSrc || logo?.src || "";
        modalLogo.alt = logo?.alt || `${schoolName} logo`;
        modalKicker.textContent = schoolKicker;
        modalTitle.textContent = schoolName;
        modalStory.textContent = story;
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        modalClose.focus();

        animateEducationLogoFromBadge(logo);
    }

    function animateEducationLogoFromBadge(sourceLogo) {
        if (!sourceLogo) {
            modal.classList.add("is-logo-ready");
            return;
        }

        const startRect = sourceLogo.getBoundingClientRect();

        window.requestAnimationFrame(() => {
            const endRect = modalLogo.getBoundingClientRect();

            if (!endRect.width || !endRect.height) {
                modal.classList.add("is-logo-ready");
                return;
            }

            const animatedLogo = sourceLogo.cloneNode();
            animatedLogo.className = "education-modal-logo-flight";
            animatedLogo.setAttribute("aria-hidden", "true");
            animatedLogo.style.left = `${startRect.left}px`;
            animatedLogo.style.top = `${startRect.top}px`;
            animatedLogo.style.width = `${startRect.width}px`;
            animatedLogo.style.height = `${startRect.height}px`;
            document.body.append(animatedLogo);

            const animation = animatedLogo.animate(
                [
                    {
                        transform: "translate3d(0, 0, 0) scale(1)",
                        borderRadius: getComputedStyle(sourceLogo).borderRadius,
                    },
                    {
                        transform: `translate3d(${endRect.left - startRect.left}px, ${endRect.top - startRect.top}px, 0) scale(${endRect.width / startRect.width})`,
                        borderRadius: getComputedStyle(modalLogo).borderRadius,
                    },
                ],
                {
                    duration: 620,
                    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                    fill: "forwards",
                },
            );

            animation.onfinish = () => {
                modal.classList.add("is-logo-ready");
                window.setTimeout(() => {
                    animatedLogo.remove();
                }, 180);
            };

            animation.oncancel = () => {
                modal.classList.add("is-logo-ready");
                window.setTimeout(() => {
                    animatedLogo.remove();
                }, 180);
            };
        });
    }

    function animateEducationLogoToBadge() {
        const targetLogo = activeEducationBadge?.querySelector("img");

        if (!targetLogo || !modalLogo.src) {
            hideEducationModal();
            return;
        }

        const startRect = modalLogo.getBoundingClientRect();
        const endRect = targetLogo.getBoundingClientRect();
        const returnFocusTarget = activeEducationBadge;

        if (!startRect.width || !endRect.width) {
            hideEducationModal();
            return;
        }

        const animatedLogo = modalLogo.cloneNode();
        animatedLogo.className = "education-modal-logo-flight";
        animatedLogo.setAttribute("aria-hidden", "true");
        animatedLogo.style.left = `${startRect.left}px`;
        animatedLogo.style.top = `${startRect.top}px`;
        animatedLogo.style.width = `${startRect.width}px`;
        animatedLogo.style.height = `${startRect.height}px`;
        document.body.append(animatedLogo);
        targetLogo.classList.add("is-logo-flight-target");
        modal.classList.remove("is-open");
        modal.classList.remove("is-logo-ready");
        modal.setAttribute("aria-hidden", "true");
        activeEducationBadge = null;

        const animation = animatedLogo.animate(
            [
                {
                    transform: "translate3d(0, 0, 0) scale(1)",
                    borderRadius: getComputedStyle(modalLogo).borderRadius,
                },
                {
                    transform: `translate3d(${endRect.left - startRect.left}px, ${endRect.top - startRect.top}px, 0) scale(${endRect.width / startRect.width})`,
                    borderRadius: getComputedStyle(targetLogo).borderRadius,
                },
            ],
            {
                duration: 520,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "forwards",
            },
        );

        animation.onfinish = () => {
            animatedLogo.remove();
            targetLogo.classList.remove("is-logo-flight-target");
            returnFocusTarget?.focus();
        };

        animation.oncancel = () => {
            animatedLogo.remove();
            targetLogo.classList.remove("is-logo-flight-target");
            returnFocusTarget?.focus();
        };
    }

    educationBadges.forEach((badge) => {
        badge.addEventListener("click", () => {
            openEducationModal(badge);
        });
    });

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeEducationModal();
        }
    });

    modalClose.addEventListener("click", closeEducationModal);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("is-open")) {
            closeEducationModal();
        }
    });
}

function setupGalleryPagination() {
    const gallery = document.querySelector(
        ".case-study-theme-wildclash .case-study-gallery-stack",
    );
    const dots = Array.from(
        document.querySelectorAll(
            ".case-study-theme-wildclash .case-study-gallery-pagination-dot",
        ),
    );

    if (!gallery || !dots.length) {
        return;
    }

    const slides = Array.from(
        gallery.querySelectorAll(".case-study-gallery-card"),
    );

    if (!slides.length) {
        return;
    }

    let ticking = false;

    function setActiveDot(activeIndex) {
        dots.forEach((dot, index) => {
            dot.classList.toggle("is-active", index === activeIndex);
        });
    }

    function getActiveIndex() {
        const galleryRect = gallery.getBoundingClientRect();
        const galleryCenter = galleryRect.left + galleryRect.width / 2;
        let activeIndex = 0;
        let closestDistance = Number.POSITIVE_INFINITY;

        slides.forEach((slide, index) => {
            const slideRect = slide.getBoundingClientRect();
            const slideCenter = slideRect.left + slideRect.width / 2;
            const distance = Math.abs(galleryCenter - slideCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                activeIndex = index;
            }
        });

        return activeIndex;
    }

    function updatePagination() {
        ticking = false;
        setActiveDot(getActiveIndex());
    }

    function requestUpdate() {
        if (ticking) {
            return;
        }

        ticking = true;
        window.requestAnimationFrame(updatePagination);
    }

    setActiveDot(0);
    gallery.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
}

updateClock();
setupThemedImages();
setupThemeToggle();
setupThemeToggleGuide();
setupPageTransitions();
setupSiteCursor();
setupMobileMenu();
setupPortfolioAssistant();
setupAutoHidingHeader();
setupDraggableWordmarks();
setupHeroSpotlight();
setupHeroAtmosphereTrail();
setupStackTransition();
setupFeaturedCardStack();
setupFeaturedMediaParallax();
setupWorkProjectImageScroll();
setupFooterPhotoGallery();
setupAboutPagePhotoDrag();
setupAboutPageMobilePhotoReveal();
setupEducationBadgesModal();
setupGalleryPagination();
setupIntroLoader().finally(() => {
    setupHeroDescriptionTypewriter();
});
setInterval(updateClock, 1000);
