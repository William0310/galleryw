document.addEventListener("DOMContentLoaded", () => {
    const steps = Array.from(document.querySelectorAll("[data-viewfinder-step]"));
    const routeLinks = Array.from(document.querySelectorAll("[data-viewfinder-jump]"));
    const frame = document.querySelector("[data-viewfinder-frame]");
    const source = document.querySelector("[data-vf-source]");
    const image = document.querySelector("[data-vf-image]");
    const activeLink = document.querySelector("[data-vf-link]");
    const activeFields = {
        title: document.querySelector("[data-vf-title]"),
        kicker: document.querySelector("[data-vf-kicker]"),
        description: document.querySelector("[data-vf-description]"),
        count: document.querySelector("[data-vf-count]"),
        countText: document.querySelector("[data-vf-count-text]"),
        date: document.querySelector("[data-vf-date]"),
        dateText: document.querySelector("[data-vf-date-text]"),
        camera: document.querySelector("[data-vf-camera]"),
        tags: document.querySelector("[data-vf-tags]")
    };

    if (!steps.length || !frame || !source || !image) {
        return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileMedia = window.matchMedia("(max-width: 820px)");
    let activeIndex = 0;
    let ticking = false;
    let swapTimer = null;

    const selectedImageFor = (step) => {
        if (!step) {
            return "";
        }

        return mobileMedia.matches
            ? step.dataset.mobileSrc || step.dataset.desktopSrc || ""
            : step.dataset.desktopSrc || step.dataset.mobileSrc || "";
    };

    const preloadNearby = (index) => {
        [index + 1, index - 1].forEach((nearbyIndex) => {
            const step = steps[nearbyIndex];
            const src = selectedImageFor(step);

            if (!src) {
                return;
            }

            const preloadImage = new Image();
            preloadImage.decoding = "async";
            preloadImage.src = src;
        });
    };

    const renderTags = (tagsValue = "") => {
        if (!activeFields.tags) {
            return;
        }

        activeFields.tags.textContent = "";

        tagsValue.split("|").filter(Boolean).forEach((tag) => {
            const tagNode = document.createElement("span");
            tagNode.textContent = tag;
            activeFields.tags.append(tagNode);
        });
    };

    const setText = (node, value) => {
        if (node && typeof value === "string") {
            node.textContent = value;
        }
    };

    const setActive = (index) => {
        const step = steps[index];

        if (!step || index === activeIndex) {
            return;
        }

        activeIndex = index;
        const desktopSrc = step.dataset.desktopSrc || "";
        const mobileSrc = step.dataset.mobileSrc || desktopSrc;
        const objectPosition = mobileMedia.matches
            ? step.dataset.mobilePosition || step.dataset.desktopPosition || "center"
            : step.dataset.desktopPosition || step.dataset.mobilePosition || "center";

        frame.classList.add("is-swapping");
        window.clearTimeout(swapTimer);
        swapTimer = window.setTimeout(() => {
            frame.classList.remove("is-swapping");
        }, reducedMotion ? 0 : 260);

        source.srcset = mobileSrc;
        image.src = desktopSrc;
        image.alt = step.dataset.alt || `${step.dataset.title || "Collection"} cover image`;
        image.style.setProperty("--vf-object-position", objectPosition);

        setText(activeFields.title, step.dataset.title || "");
        setText(activeFields.kicker, step.dataset.kicker || "");
        setText(activeFields.description, step.dataset.description || "");
        setText(activeFields.count, step.dataset.count || "");
        setText(activeFields.countText, step.dataset.count || "");
        setText(activeFields.date, step.dataset.date || "");
        setText(activeFields.dateText, step.dataset.date || "");
        setText(activeFields.camera, step.dataset.camera || "");
        renderTags(step.dataset.tags || "");

        if (activeLink) {
            activeLink.href = step.dataset.link || "#";
            activeLink.textContent = step.dataset.action || "Explore";
        }

        routeLinks.forEach((link) => {
            link.classList.toggle("is-active", Number(link.dataset.viewfinderJump) === index);
        });

        preloadNearby(index);
    };

    const syncActiveStep = () => {
        ticking = false;

        const viewportCenter = window.innerHeight / 2;
        let nextIndex = activeIndex;
        let closestDistance = Number.POSITIVE_INFINITY;

        steps.forEach((step, index) => {
            const rect = step.getBoundingClientRect();
            const isNearViewport = rect.bottom > -window.innerHeight && rect.top < window.innerHeight * 2;

            if (!isNearViewport) {
                return;
            }

            const stepCenter = rect.top + rect.height / 2;
            const distance = Math.abs(stepCenter - viewportCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                nextIndex = index;
            }
        });

        setActive(nextIndex);
    };

    const requestSync = () => {
        if (ticking) {
            return;
        }

        ticking = true;
        window.requestAnimationFrame(syncActiveStep);
    };

    routeLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();

            const index = Number(link.dataset.viewfinderJump);
            const step = steps[index];

            if (!step) {
                return;
            }

            const stepRect = step.getBoundingClientRect();
            const targetY = window.scrollY + stepRect.top + (stepRect.height / 2) - (window.innerHeight / 2);

            setActive(index);
            window.scrollTo({
                top: targetY,
                behavior: reducedMotion ? "auto" : "smooth"
            });
        });
    });

    activeIndex = -1;
    setActive(0);
    syncActiveStep();
    preloadNearby(0);

    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);
    mobileMedia.addEventListener?.("change", () => {
        const visibleIndex = routeLinks.findIndex((link) => link.classList.contains("is-active"));
        activeIndex = -1;
        setActive(visibleIndex >= 0 ? visibleIndex : 0);
        requestSync();
    });
});
