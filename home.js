document.addEventListener("DOMContentLoaded", () => {
    const scrollKey = "galleryw.home.scrollY";
    const stage = document.querySelector("[data-hero-stage]");
    const frames = Array.from(document.querySelectorAll("[data-hero-frame]"));
    const dotsContainer = document.querySelector("[data-hero-dots]");
    const progress = document.querySelector("[data-hero-progress]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!stage || !frames.length || !dotsContainer || !progress) {
        return;
    }

    const autoDelay = 2200;
    let activeIndex = Math.max(0, frames.findIndex((frame) => frame.classList.contains("is-active")));
    let timer = 0;
    let userPaused = false;
    let stageVisible = true;
    let scrollTicking = false;

    const saveScrollPosition = () => {
        try {
            window.sessionStorage.setItem(scrollKey, String(Math.max(0, Math.round(window.scrollY))));
        } catch {
            return;
        }
    };

    const restoreScrollPosition = () => {
        if (window.location.hash) {
            return;
        }

        let storedPosition = 0;

        try {
            storedPosition = Number.parseInt(window.sessionStorage.getItem(scrollKey) || "0", 10);
        } catch {
            return;
        }

        if (!Number.isFinite(storedPosition) || storedPosition <= 0) {
            return;
        }

        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        window.scrollTo(0, Math.min(storedPosition, maxScroll));
    };

    const stopAuto = () => {
        window.clearTimeout(timer);
        timer = 0;
        progress.style.transitionDuration = "0ms";
        progress.style.width = "0%";
    };

    const animateProgress = () => {
        progress.style.transitionDuration = "0ms";
        progress.style.width = "0%";

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                progress.style.transitionDuration = `${autoDelay}ms`;
                progress.style.width = "100%";
            });
        });
    };

    const sync = () => {
        frames.forEach((frame, index) => {
            frame.classList.toggle("is-active", index === activeIndex);
        });

        dotsContainer.querySelectorAll("button").forEach((dot, index) => {
            dot.classList.toggle("is-active", index === activeIndex);
            dot.setAttribute("aria-pressed", index === activeIndex ? "true" : "false");
        });
    };

    const startAuto = () => {
        stopAuto();

        if (reducedMotion || userPaused || document.hidden || !stageVisible) {
            return;
        }

        animateProgress();
        timer = window.setTimeout(() => {
            activeIndex = (activeIndex + 1) % frames.length;
            sync();
            startAuto();
        }, autoDelay);
    };

    const goTo = (index) => {
        activeIndex = (index + frames.length) % frames.length;
        sync();
        startAuto();
    };

    frames.forEach((frame, index) => {
        const label = frame.querySelector("figcaption")?.textContent?.trim() || `Highlight ${index + 1}`;
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", `Show ${label}`);
        dot.setAttribute("aria-pressed", "false");
        dot.addEventListener("click", () => goTo(index));
        dotsContainer.appendChild(dot);
    });

    stage.addEventListener("pointerenter", () => {
        userPaused = true;
        stopAuto();
    });

    stage.addEventListener("pointerleave", () => {
        userPaused = false;
        startAuto();
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            saveScrollPosition();
            stopAuto();
            return;
        }

        startAuto();
    });

    window.addEventListener("scroll", () => {
        if (scrollTicking) {
            return;
        }

        scrollTicking = true;
        window.requestAnimationFrame(() => {
            scrollTicking = false;
            saveScrollPosition();
        });
    }, { passive: true });

    window.addEventListener("pagehide", saveScrollPosition);

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((items) => {
            stageVisible = items.some((item) => item.isIntersecting);
            startAuto();
        }, { threshold: 0.2 });

        observer.observe(stage);
    }

    sync();
    startAuto();
    window.requestAnimationFrame(restoreScrollPosition);
    window.addEventListener("load", restoreScrollPosition, { once: true });
});
