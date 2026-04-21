const clockElement = document.getElementById("clock");
const heroSection = document.getElementById("hero-scroll");
const heroStage = document.querySelector(".hero-stage");
const mainCard = document.getElementById("mainCard");
const rearCard = document.getElementById("rearCard");
const mainCardContent = document.getElementById("mainCardContent");

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

    clockElement.textContent = `Manila, PH - ${formatter.format(new Date())} PHT`;
}

function getSceneConfig() {
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const isTablet = window.matchMedia("(max-width: 900px)").matches;

    if (isMobile) {
        return {
            scrollLength: 5200, // Tweak marker: overall scroll duration
            frontTilt: {
                rotate: -8,
                rotateX: 14,
                rotateY: -7,
            },
            rearTilt: {
                rotate: -6,
                rotateX: 11,
                rotateY: -5,
            },
            frontY: {
                initial: 250, // Tweak marker: state 1 hidden offset
                reveal: 40,
                lifted: -36,
                exit: -210,
                partial: -105,
                final: 0,
            },
            rearY: {
                initial: 150,
                reveal: 118,
                dominant: 98,
                lowered: 172,
            },
            scale: {
                frontInitial: 1.14, // Tweak marker: card scale values
                frontVisible: 1,
                frontMid: 0.92,
                frontFar: 0.82,
                rearInitial: 0.94,
                rearVisible: 0.99,
                rearLow: 0.91,
            },
        };
    }

    if (isTablet) {
        return {
            scrollLength: 5500,
            frontTilt: {
                rotate: -9,
                rotateX: 15,
                rotateY: -8,
            },
            rearTilt: {
                rotate: -8,
                rotateX: 13,
                rotateY: -6,
            },
            frontY: {
                initial: 260,
                reveal: 26,
                lifted: -48,
                exit: -245,
                partial: -118,
                final: -2,
            },
            rearY: {
                initial: 160,
                reveal: 126,
                dominant: 104,
                lowered: 184,
            },
            scale: {
                frontInitial: 1.1,
                frontVisible: 1,
                frontMid: 0.9,
                frontFar: 0.8,
                rearInitial: 0.95,
                rearVisible: 1,
                rearLow: 0.9,
            },
        };
    }

    return {
        scrollLength: 5800,
        frontTilt: {
            rotate: -10, // Tweak marker: main card tilt
            rotateX: 16,
            rotateY: -10,
        },
        rearTilt: {
            rotate: -8, // Tweak marker: rear card tilt
            rotateX: 13,
            rotateY: -7,
        },
        frontY: {
            initial: 280, // Tweak marker: animation distances
            reveal: 18,
            lifted: -56,
            exit: -265,
            partial: -126,
            final: -4,
        },
        rearY: {
            initial: 172,
            reveal: 138,
            dominant: 112,
            lowered: 196,
        },
        scale: {
            frontInitial: 1.08,
            frontVisible: 1,
            frontMid: 0.9,
            frontFar: 0.79,
            rearInitial: 0.94,
            rearVisible: 1,
            rearLow: 0.9,
        },
    };
}

function applyReducedMotionState() {
    if (!mainCard || !rearCard || !mainCardContent) {
        return;
    }

    gsap.set(heroStage, { clearProps: "all" });
    gsap.set(rearCard, {
        xPercent: -50,
        yPercent: -50,
        y: 170,
        scale: 0.9,
        rotation: -8,
        rotationX: 12,
        rotationY: -7,
        autoAlpha: 0.9,
        filter: "brightness(0.34)",
    });
    gsap.set(mainCard, {
        xPercent: -50,
        yPercent: -50,
        y: 0,
        scale: 1,
        rotation: -7,
        rotationX: 12,
        rotationY: -6,
        autoAlpha: 1,
        filter: "brightness(1)",
    });
    gsap.set(mainCardContent, {
        autoAlpha: 1,
        y: 0,
        filter: "brightness(1)",
    });
}

function initScrollHero() {
    if (
        !heroSection ||
        !heroStage ||
        !mainCard ||
        !rearCard ||
        !mainCardContent ||
        !window.gsap ||
        !window.ScrollTrigger
    ) {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    gsap.killTweensOf([mainCard, rearCard, mainCardContent]);

    if (prefersReducedMotion) {
        applyReducedMotionState();
        return;
    }

    const config = getSceneConfig();

    gsap.set(mainCard, {
        xPercent: -50,
        yPercent: -50,
        y: config.frontY.initial,
        scale: config.scale.frontInitial,
        rotation: config.frontTilt.rotate,
        rotationX: config.frontTilt.rotateX,
        rotationY: config.frontTilt.rotateY,
        transformOrigin: "50% 50%",
        autoAlpha: 0.08,
        filter: "brightness(0.34)",
    });

    gsap.set(rearCard, {
        xPercent: -50,
        yPercent: -50,
        y: config.rearY.initial,
        scale: config.scale.rearInitial,
        rotation: config.rearTilt.rotate,
        rotationX: config.rearTilt.rotateX,
        rotationY: config.rearTilt.rotateY,
        transformOrigin: "50% 50%",
        autoAlpha: 0.98,
        filter: "brightness(0.28)",
    });

    gsap.set(mainCardContent, {
        y: 28,
        autoAlpha: 0.2,
        filter: "brightness(0.75)",
    });

    const timeline = gsap.timeline({
        defaults: {
            duration: 1,
            ease: "none",
        },
        scrollTrigger: {
            trigger: heroSection,
            pin: heroStage,
            scrub: 1.35,
            start: "top top",
            end: `+=${config.scrollLength}`,
            anticipatePin: 1,
            invalidateOnRefresh: true,
        },
    });

    timeline.addLabel("state1");

    // State 2: main hero card rises into clear view.
    timeline.to(
        mainCard,
        {
            y: config.frontY.reveal,
            scale: config.scale.frontVisible,
            rotation: config.frontTilt.rotate + 1.2,
            rotationY: config.frontTilt.rotateY + 1.5,
            autoAlpha: 1,
            filter: "brightness(1)",
        },
        "state1+=0.65",
    );
    timeline.to(
        mainCardContent,
        {
            y: 0,
            autoAlpha: 1,
            filter: "brightness(1)",
        },
        "state1+=0.65",
    );
    timeline.to(
        rearCard,
        {
            y: config.rearY.reveal,
            scale: config.scale.rearVisible,
            filter: "brightness(0.4)",
        },
        "state1+=0.65",
    );

    // State 3: main card shrinks slightly and lifts, exposing the rear layer.
    timeline.addLabel("state3");
    timeline.to(
        mainCard,
        {
            y: config.frontY.lifted,
            scale: config.scale.frontMid,
            rotation: config.frontTilt.rotate - 0.4,
            rotationY: config.frontTilt.rotateY - 1.4,
        },
        "state3",
    );
    timeline.to(
        rearCard,
        {
            y: config.rearY.dominant,
            scale: config.scale.rearVisible + 0.02,
            autoAlpha: 1,
            filter: "brightness(0.52)",
        },
        "state3",
    );
    timeline.to(
        mainCardContent,
        {
            autoAlpha: 0.92,
            filter: "brightness(0.96)",
        },
        "state3",
    );

    // State 4: main card exits upward and the darker rear card dominates.
    timeline.addLabel("state4");
    timeline.to(
        mainCard,
        {
            y: config.frontY.exit,
            scale: config.scale.frontFar,
            rotation: config.frontTilt.rotate - 2,
            rotationY: config.frontTilt.rotateY - 3,
            autoAlpha: 0.1,
            filter: "brightness(0.26)",
        },
        "state4",
    );
    timeline.to(
        mainCardContent,
        {
            autoAlpha: 0,
            y: -28,
            filter: "brightness(0.58)",
        },
        "state4",
    );
    timeline.to(
        rearCard,
        {
            y: config.rearY.dominant + 4,
            scale: config.scale.rearVisible + 0.04,
            filter: "brightness(0.58)",
        },
        "state4",
    );

    // State 5: main card re-enters from above for the second reveal cycle.
    timeline.addLabel("state5");
    timeline.to(
        mainCard,
        {
            y: config.frontY.partial,
            scale: config.scale.frontMid,
            rotation: config.frontTilt.rotate - 1,
            rotationY: config.frontTilt.rotateY - 1.6,
            autoAlpha: 0.68,
            filter: "brightness(0.7)",
        },
        "state5",
    );
    timeline.to(
        mainCardContent,
        {
            autoAlpha: 0.74,
            y: -10,
            filter: "brightness(0.86)",
        },
        "state5",
    );
    timeline.to(
        rearCard,
        {
            y: config.rearY.reveal + 10,
            scale: config.scale.rearVisible,
            filter: "brightness(0.46)",
        },
        "state5",
    );

    // State 6: strongest hero readability in the center of the scene.
    timeline.addLabel("state6");
    timeline.to(
        mainCard,
        {
            y: config.frontY.final,
            scale: 1.01,
            rotation: config.frontTilt.rotate + 0.6,
            rotationY: config.frontTilt.rotateY + 0.7,
            autoAlpha: 1,
            filter: "brightness(1.03)",
        },
        "state6",
    );
    timeline.to(
        mainCardContent,
        {
            autoAlpha: 1,
            y: 0,
            filter: "brightness(1)",
        },
        "state6",
    );
    timeline.to(
        rearCard,
        {
            y: config.rearY.reveal,
            scale: config.scale.rearLow,
            filter: "brightness(0.34)",
        },
        "state6",
    );

    // State 7: main card starts leaving upward again.
    timeline.addLabel("state7");
    timeline.to(
        mainCard,
        {
            y: config.frontY.partial - 18,
            scale: config.scale.frontMid - 0.02,
            rotation: config.frontTilt.rotate - 1.4,
            rotationY: config.frontTilt.rotateY - 1.8,
            autoAlpha: 0.72,
            filter: "brightness(0.74)",
        },
        "state7",
    );
    timeline.to(
        mainCardContent,
        {
            autoAlpha: 0.72,
            y: -12,
        },
        "state7",
    );
    timeline.to(
        rearCard,
        {
            y: config.rearY.dominant,
            scale: config.scale.rearVisible + 0.03,
            filter: "brightness(0.5)",
        },
        "state7",
    );

    // State 8: darker minimal rear-card moment returns.
    timeline.addLabel("state8");
    timeline.to(
        mainCard,
        {
            y: config.frontY.exit - 12,
            scale: config.scale.frontFar,
            rotation: config.frontTilt.rotate - 2.4,
            rotationY: config.frontTilt.rotateY - 3.4,
            autoAlpha: 0.08,
            filter: "brightness(0.24)",
        },
        "state8",
    );
    timeline.to(
        mainCardContent,
        {
            autoAlpha: 0,
            y: -24,
        },
        "state8",
    );
    timeline.to(
        rearCard,
        {
            y: config.rearY.dominant + 2,
            scale: config.scale.rearVisible + 0.05,
            filter: "brightness(0.6)",
        },
        "state8",
    );

    // State 9: main card partially re-enters from the top.
    timeline.addLabel("state9");
    timeline.to(
        mainCard,
        {
            y: config.frontY.partial,
            scale: config.scale.frontMid,
            rotation: config.frontTilt.rotate - 0.8,
            rotationY: config.frontTilt.rotateY - 1.3,
            autoAlpha: 0.7,
            filter: "brightness(0.76)",
        },
        "state9",
    );
    timeline.to(
        mainCardContent,
        {
            autoAlpha: 0.76,
            y: -6,
        },
        "state9",
    );
    timeline.to(
        rearCard,
        {
            y: config.rearY.lowered,
            scale: config.scale.rearLow,
            filter: "brightness(0.34)",
        },
        "state9",
    );

    // State 10: polished final centered composition.
    timeline.addLabel("state10");
    timeline.to(
        mainCard,
        {
            y: config.frontY.final,
            scale: config.scale.frontVisible,
            rotation: config.frontTilt.rotate + 0.8,
            rotationY: config.frontTilt.rotateY + 0.4,
            autoAlpha: 1,
            filter: "brightness(1)",
        },
        "state10",
    );
    timeline.to(
        mainCardContent,
        {
            autoAlpha: 1,
            y: 0,
            filter: "brightness(1)",
        },
        "state10",
    );
    timeline.to(
        rearCard,
        {
            y: config.rearY.lowered + 10,
            scale: config.scale.rearLow,
            filter: "brightness(0.3)",
            autoAlpha: 0.96,
        },
        "state10",
    );

    ScrollTrigger.refresh();
}

updateClock();
initScrollHero();
setInterval(updateClock, 1000);
window.addEventListener("resize", () => {
    initScrollHero();
});
