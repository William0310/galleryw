document.addEventListener("DOMContentLoaded", () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileMedia = window.matchMedia("(max-width: 980px)");

    const desktopItems = Array.from(document.querySelectorAll("[data-desktop-item]"));
    const desktopVisuals = Array.from(document.querySelectorAll("[data-desktop-visual]"));
    const mobileTrack = document.querySelector("[data-mobile-track]");
    const mobileSlides = Array.from(document.querySelectorAll("[data-mobile-slide]"));
    const mobileHud = {
        index: document.querySelector("[data-mobile-hud-index]"),
        meta: document.querySelector("[data-mobile-hud-meta]"),
        title: document.querySelector("[data-mobile-hud-title]"),
        description: document.querySelector("[data-mobile-hud-description]"),
        link: document.querySelector("[data-mobile-hud-link]")
    };

    const isMobileLayout = () => mobileMedia.matches;

    if (desktopItems.length && desktopItems.length === desktopVisuals.length) {
        let desktopActiveIndex = 0;
        let desktopTicking = false;

        const syncDesktopState = (index) => {
            desktopActiveIndex = index;

            desktopItems.forEach((item, itemIndex) => {
                item.classList.toggle("is-active", itemIndex === desktopActiveIndex);
            });

            desktopVisuals.forEach((visual, visualIndex) => {
                visual.classList.toggle("is-active", visualIndex === desktopActiveIndex);
            });
        };

        const updateDesktopActive = () => {
            desktopTicking = false;

            if (isMobileLayout()) {
                return;
            }

            let nextIndex = desktopActiveIndex;
            let nearestDistance = Number.POSITIVE_INFINITY;
            const viewportTarget = window.innerHeight * 0.48;

            desktopVisuals.forEach((visual, index) => {
                const rect = visual.getBoundingClientRect();
                const center = rect.top + (rect.height / 2);
                const distance = Math.abs(center - viewportTarget);

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nextIndex = index;
                }
            });

            if (nextIndex !== desktopActiveIndex) {
                syncDesktopState(nextIndex);
            }
        };

        const requestDesktopUpdate = () => {
            if (desktopTicking) {
                return;
            }

            desktopTicking = true;
            window.requestAnimationFrame(updateDesktopActive);
        };

        window.addEventListener("scroll", requestDesktopUpdate, { passive: true });
        window.addEventListener("resize", requestDesktopUpdate);
        mobileMedia.addEventListener("change", requestDesktopUpdate);
        syncDesktopState(0);
        requestDesktopUpdate();
    }

    if (!mobileTrack || !mobileSlides.length) {
        return;
    }

    let mobileActiveIndex = 0;
    let autoAdvanceTimer = 0;
    let scrollDebounce = 0;
    let resizeDebounce = 0;
    let userInteracting = false;

    const normalizeMobileIndex = (index) => {
        const total = mobileSlides.length;
        return ((index % total) + total) % total;
    };

    const clearAutoAdvance = () => {
        window.clearTimeout(autoAdvanceTimer);
        autoAdvanceTimer = 0;
    };

    const getCenteredMobileIndex = () => {
        const viewportCenter = mobileTrack.scrollLeft + (mobileTrack.clientWidth / 2);
        let nearestIndex = mobileActiveIndex;
        let nearestDistance = Number.POSITIVE_INFINITY;

        mobileSlides.forEach((slide, index) => {
            const slideCenter = slide.offsetLeft + (slide.clientWidth / 2);
            const distance = Math.abs(slideCenter - viewportCenter);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = index;
            }
        });

        return nearestIndex;
    };

    const syncMobileHud = (slide) => {
        if (!slide || !mobileHud.index || !mobileHud.meta || !mobileHud.title || !mobileHud.description || !mobileHud.link) {
            return;
        }

        mobileHud.index.textContent = slide.dataset.hudIndex || "";
        mobileHud.meta.textContent = slide.dataset.hudMeta || "";
        mobileHud.title.textContent = slide.dataset.hudTitle || "";
        mobileHud.description.textContent = slide.dataset.hudDescription || "";
        mobileHud.link.href = slide.getAttribute("href") || "#";
    };

    const syncMobileState = (index) => {
        mobileActiveIndex = normalizeMobileIndex(index);

        mobileSlides.forEach((slide, slideIndex) => {
            slide.classList.toggle("is-active", slideIndex === mobileActiveIndex);
        });

        syncMobileHud(mobileSlides[mobileActiveIndex]);
    };

    const scrollMobileToIndex = (index, behavior = reducedMotion ? "auto" : "smooth") => {
        const slide = mobileSlides[normalizeMobileIndex(index)];
        const left = slide.offsetLeft - ((mobileTrack.clientWidth - slide.clientWidth) / 2);

        mobileTrack.scrollTo({
            left,
            behavior
        });
    };

    const goToMobileIndex = (index, behavior = reducedMotion ? "auto" : "smooth") => {
        const nextIndex = normalizeMobileIndex(index);
        syncMobileState(nextIndex);
        scrollMobileToIndex(nextIndex, behavior);
    };

    const scheduleAutoAdvance = () => {
        clearAutoAdvance();

        if (reducedMotion || document.hidden || !isMobileLayout()) {
            return;
        }

        autoAdvanceTimer = window.setTimeout(() => {
            goToMobileIndex(mobileActiveIndex + 1);
            scheduleAutoAdvance();
        }, 10000);
    };

    const finishInteraction = () => {
        if (!userInteracting) {
            return;
        }

        userInteracting = false;
        syncMobileState(getCenteredMobileIndex());
        scheduleAutoAdvance();
    };

    mobileTrack.addEventListener("scroll", () => {
        const centeredIndex = getCenteredMobileIndex();

        if (centeredIndex !== mobileActiveIndex) {
            syncMobileState(centeredIndex);
        }

        window.clearTimeout(scrollDebounce);
        scrollDebounce = window.setTimeout(() => {
            if (!userInteracting) {
                scheduleAutoAdvance();
            }
        }, 160);
    }, { passive: true });

    mobileTrack.addEventListener("pointerdown", () => {
        userInteracting = true;
        clearAutoAdvance();
    });

    window.addEventListener("pointerup", finishInteraction);
    window.addEventListener("pointercancel", finishInteraction);

    mobileTrack.addEventListener("mouseenter", clearAutoAdvance);
    mobileTrack.addEventListener("mouseleave", () => {
        if (!userInteracting) {
            scheduleAutoAdvance();
        }
    });

    mobileTrack.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
            return;
        }

        event.preventDefault();
        clearAutoAdvance();
        goToMobileIndex(mobileActiveIndex + (event.key === "ArrowRight" ? 1 : -1));
        scheduleAutoAdvance();
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            clearAutoAdvance();
            return;
        }

        scheduleAutoAdvance();
    });

    window.addEventListener("resize", () => {
        window.clearTimeout(resizeDebounce);
        resizeDebounce = window.setTimeout(() => {
            syncMobileState(mobileActiveIndex);

            if (isMobileLayout()) {
                scrollMobileToIndex(mobileActiveIndex, "auto");
            } else {
                clearAutoAdvance();
            }
        }, 140);
    });

    mobileMedia.addEventListener("change", () => {
        if (isMobileLayout()) {
            syncMobileState(mobileActiveIndex);
            scrollMobileToIndex(mobileActiveIndex, "auto");
            scheduleAutoAdvance();
            return;
        }

        clearAutoAdvance();
    });

    window.requestAnimationFrame(() => {
        syncMobileState(0);

        if (isMobileLayout()) {
            scrollMobileToIndex(0, "auto");
            scheduleAutoAdvance();
        }
    });
});
