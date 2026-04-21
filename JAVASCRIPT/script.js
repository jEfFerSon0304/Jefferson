const clockElement = document.getElementById("clock");
const dragChip = document.getElementById("dragChip");
const dragTetherLayer = document.getElementById("dragTetherLayer");
const dragTetherLine = document.getElementById("dragTetherLine");
const dragIndicator = document.getElementById("dragIndicator");
const dragIndicatorReadout = document.getElementById("dragIndicatorReadout");
const heroDescription = document.getElementById("heroDescription");
const siteHeader = document.querySelector(".site-header");
const draggableWordmarks = Array.from(
    document.querySelectorAll("[data-draggable-wordmark]")
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
        "(prefers-reduced-motion: reduce)"
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
            `0 0 ${window.innerWidth} ${window.innerHeight}`
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
            currentCenterY - state.homeCenterY
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
            state
        );
    }

    function getHoveredWordmark() {
        return draggableWordmarks.find((element) => element.matches(":hover")) ?? null;
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
                (Math.abs(state.offsetX) > 0.5 || Math.abs(state.offsetY) > 0.5);

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
        "(prefers-reduced-motion: reduce)"
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
        { passive: true }
    );
}

function setupHeroDescriptionTypewriter() {
    if (!heroDescription) {
        return;
    }

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
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
                "Restart description animation"
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
            heroDescription.textContent = currentPhrase.slice(0, characterIndex);

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

updateClock();
setupAutoHidingHeader();
setupDraggableWordmarks();
setupHeroDescriptionTypewriter();
setInterval(updateClock, 1000);
