const clockElement = document.getElementById("clock");
const dragChip = document.getElementById("dragChip");
const dragTetherLayer = document.getElementById("dragTetherLayer");
const dragTetherLine = document.getElementById("dragTetherLine");
const dragIndicator = document.getElementById("dragIndicator");
const dragIndicatorReadout = document.getElementById("dragIndicatorReadout");
const heroDescription = document.getElementById("heroDescription");
const siteHeader = document.querySelector(".site-header");
const stackTransition = document.querySelector(".stack-transition");
const stackStage = document.getElementById("stackStage");
const heroPanel = document.querySelector(".hero-panel");
const heroOrbits = Array.from(document.querySelectorAll("[data-hero-orbit]"));
const featuredCards = Array.from(document.querySelectorAll(".featured-card"));
const featuredMediaItems = Array.from(document.querySelectorAll(".featured-media"));
const featuredImages = Array.from(document.querySelectorAll(".featured-image"));
const revealPanels = Array.from(
    document.querySelectorAll("[data-reveal-panel]"),
);
const draggableWordmarks = Array.from(
    document.querySelectorAll("[data-draggable-wordmark]"),
);

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

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
        siteHeader.classList.remove("is-hidden");
        return;
    }

    let lastScrollY = window.scrollY;
    let ticking = false;
    let hidePrimed = false;
    let revealAnchorY = window.scrollY;
    const secondScrollDistance = 96;

    function updateHeaderState() {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastScrollY;

        if (currentScrollY <= 24) {
            siteHeader.classList.remove("is-hidden");
            hidePrimed = false;
            revealAnchorY = currentScrollY;
        } else if (scrollDelta < -4) {
            siteHeader.classList.remove("is-hidden");
            hidePrimed = false;
            revealAnchorY = currentScrollY;
        } else if (scrollDelta > 4) {
            if (!hidePrimed) {
                hidePrimed = true;
                revealAnchorY = currentScrollY;
                siteHeader.classList.remove("is-hidden");
            } else if (currentScrollY - revealAnchorY >= secondScrollDistance) {
                siteHeader.classList.add("is-hidden");
            }
        }

        lastScrollY = currentScrollY;
        ticking = false;
    }

    window.addEventListener(
        "scroll",
        () => {
            if (ticking) {
                return;
            }

            ticking = true;
            window.requestAnimationFrame(updateHeaderState);
        },
        { passive: true },
    );
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
            const shiftRotation = (x * depth * 0.045 - y * depth * 0.02).toFixed(
                2,
            );

            orbit.style.setProperty("--orbit-shift-x", `${shiftX.toFixed(2)}px`);
            orbit.style.setProperty("--orbit-shift-y", `${shiftY.toFixed(2)}px`);
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

    function syncStackHeight() {
        const transitionDistance = Math.max(window.innerHeight * 0.95, 1);
        const typingDistance = Math.max(window.innerHeight * 0.8, 1);
        const holdDistance = Math.max(window.innerHeight * 0.55, 1);
        const totalScrollDistance =
            panelStates.length * (transitionDistance + typingDistance) +
            holdDistance;

        stackTransition.style.minHeight = `${window.innerHeight + totalScrollDistance}px`;
    }

    function renderSegments(panelState, textProgress) {
        const visibleCharacters = Math.floor(
            panelState.totalCharacters * textProgress,
        );
        let remainingCharacters = visibleCharacters;

        panelState.segments.forEach((segment, index) => {
            const fullText = panelState.segmentTexts[index];
            const shownLength = clamp(
                remainingCharacters,
                0,
                fullText.length,
            );

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

        const rect = stackTransition.getBoundingClientRect();
        const scrolledDistance = clamp(-rect.top, 0, Number.MAX_SAFE_INTEGER);
        const transitionDistance = Math.max(window.innerHeight * 0.95, 1);
        const typingDistance = Math.max(window.innerHeight * 0.8, 1);
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

        const pushBack = -150 * panelProgress;
        const scale = 1 - 0.06 * panelProgress;
        const tiltX = 8.5 * panelProgress;
        const tiltZ = -2.6 * panelProgress;

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
            panelState.editor.classList.toggle(
                "is-active",
                textProgress > 0,
            );
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

    syncStackHeight();
    render();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", () => {
        syncStackHeight();
        requestUpdate();
    });
}

function setupFeaturedMediaParallax() {
    if (!featuredMediaItems.length || !featuredImages.length) {
        return;
    }

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

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

    function measureTargetShift(media) {
        const rect = media.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            return 0;
        }

        const viewportHeight = Math.max(window.innerHeight, 1);
        const progress = clamp(
            (viewportHeight - rect.top) / (viewportHeight + rect.height),
            0,
            1,
        );
        const maxTravel = Math.min(144, rect.width * 0.24);
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

            state.currentShift += delta * 0.09;

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
    });
    renderShifts();

    window.addEventListener("scroll", syncTarget, { passive: true });
    window.addEventListener("resize", syncTarget);
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
            Number.parseFloat(window.getComputedStyle(featuredCards[0]).top) || 0;
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

updateClock();
setupAutoHidingHeader();
setupDraggableWordmarks();
setupHeroDescriptionTypewriter();
setupHeroSpotlight();
setupHeroAtmosphereTrail();
setupStackTransition();
setupFeaturedCardStack();
setupFeaturedMediaParallax();
setInterval(updateClock, 1000);
