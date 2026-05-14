document.addEventListener("DOMContentLoaded", () => {
    const figures = Array.from(document.querySelectorAll(".story-card"));

    if (figures.length === 0) {
        return;
    }

    const seriesTitle = document.querySelector(".headline")?.textContent?.trim() || "Gallery";
    const getSortIndex = (counter, fallback) => {
        const match = counter.match(/\d+/);
        return match ? Number(match[0]) : fallback + 1;
    };

    const items = figures.map((figure, index) => {
        const img = figure.querySelector("img");
        const caption = figure.querySelector("figcaption");
        const title = caption?.querySelector(".caption-title")?.textContent?.trim() || `Frame ${index + 1}`;
        const meta = caption?.querySelector(".caption-meta")?.textContent?.trim() || "";
        const description = caption?.querySelector(".caption-copy")?.textContent?.trim() || "";
        const counter = caption?.querySelector(".caption-index")?.textContent?.trim() || String(index + 1).padStart(2, "0");

        if (!img) {
            return null;
        }

        const button = document.createElement("button");
        button.type = "button";
        button.className = "story-card__open";
        button.setAttribute("aria-label", `Open ${title} full screen`);

        const media = document.createElement("div");
        media.className = "story-card__media";

        const hint = document.createElement("span");
        hint.className = "story-card__hint";
        hint.setAttribute("aria-hidden", "true");

        const displayImage = img.cloneNode(true);
        media.appendChild(displayImage);
        media.appendChild(hint);
        button.appendChild(media);

        img.replaceWith(button);

        return {
            index,
            title,
            meta,
            description,
            counter,
            domIndex: index,
            sortIndex: getSortIndex(counter, index),
            src: displayImage.currentSrc || displayImage.src,
            alt: displayImage.alt || title,
            trigger: button
        };
    }).filter(Boolean)
        .sort((a, b) => a.sortIndex - b.sortIndex || a.domIndex - b.domIndex)
        .map((item, index) => ({ ...item, index }));

    if (items.length === 0) {
        return;
    }

    const overlay = document.createElement("section");
    overlay.className = "series-viewer";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
        <div class="series-viewer__backdrop" data-viewer-close></div>
        <div class="series-viewer__dialog" role="dialog" aria-modal="true" aria-label="${seriesTitle} image viewer" tabindex="-1">
            <button type="button" class="series-viewer__nav series-viewer__nav--prev" data-viewer-prev aria-label="Previous image"></button>
            <figure class="series-viewer__panel">
                <div class="series-viewer__toolbar">
                    <p class="series-viewer__counter" data-viewer-counter></p>
                    <div class="series-viewer__nav-group">
                        <button type="button" class="series-viewer__close" data-viewer-close aria-label="Close viewer"></button>
                    </div>
                </div>
                <div class="series-viewer__frame">
                    <img class="series-viewer__image" alt="">
                </div>
                <figcaption class="series-viewer__meta">
                    <p class="series-viewer__eyebrow" data-viewer-meta></p>
                    <h2 class="series-viewer__title" data-viewer-title></h2>
                    <p class="series-viewer__description" data-viewer-description></p>
                </figcaption>
            </figure>
            <button type="button" class="series-viewer__nav series-viewer__nav--next" data-viewer-next aria-label="Next image"></button>
        </div>
    `;

    document.body.appendChild(overlay);

    const dialog = overlay.querySelector(".series-viewer__dialog");
    const image = overlay.querySelector(".series-viewer__image");
    const titleNode = overlay.querySelector("[data-viewer-title]");
    const metaNode = overlay.querySelector("[data-viewer-meta]");
    const descriptionNode = overlay.querySelector("[data-viewer-description]");
    const counterNode = overlay.querySelector("[data-viewer-counter]");
    const closeControls = overlay.querySelectorAll("[data-viewer-close]");
    const prevButton = overlay.querySelector("[data-viewer-prev]");
    const nextButton = overlay.querySelector("[data-viewer-next]");

    let activeIndex = 0;
    let lastTrigger = null;
    let loadToken = 0;
    const preloadCache = new Map();

    image.loading = "eager";
    image.decoding = "async";
    image.fetchPriority = "high";

    const preloadImage = (item, priority = "low") => {
        if (!item || preloadCache.has(item.src)) {
            return;
        }

        const preload = new Image();
        preload.decoding = "async";
        preload.fetchPriority = priority;
        preload.src = item.src;
        preloadCache.set(item.src, preload);
    };

    const scheduleIdle = (callback) => {
        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(callback, { timeout: 1200 });
            return;
        }

        window.setTimeout(callback, 180);
    };

    const preloadAround = (index) => {
        scheduleIdle(() => {
            preloadImage(items[index - 1]);
            preloadImage(items[index + 1]);
        });
    };

    const syncNav = () => {
        prevButton.disabled = activeIndex === 0;
        nextButton.disabled = activeIndex === items.length - 1;
    };

    const render = (index) => {
        const item = items[index];

        if (!item) {
            return;
        }

        activeIndex = index;
        loadToken += 1;
        const currentToken = loadToken;

        image.classList.add("is-loading");
        image.fetchPriority = "high";
        image.alt = item.alt;

        image.onload = () => {
            if (currentToken === loadToken) {
                image.classList.remove("is-loading");
            }
        };

        image.onerror = () => {
            if (currentToken === loadToken) {
                image.classList.remove("is-loading");
            }
        };

        if (image.src !== item.src) {
            image.src = item.src;
        } else {
            image.classList.remove("is-loading");
        }

        titleNode.textContent = item.title;
        metaNode.textContent = item.meta || `${seriesTitle} / ${item.counter}`;
        descriptionNode.textContent = item.description;
        counterNode.textContent = `${seriesTitle} / ${index + 1} of ${items.length}`;
        syncNav();
        preloadAround(index);
    };

    const open = (index, trigger) => {
        lastTrigger = trigger || null;
        render(index);
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("viewer-open");
        dialog.focus();
    };

    const close = () => {
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("viewer-open");

        if (lastTrigger) {
            lastTrigger.focus();
        }
    };

    const step = (direction) => {
        const nextIndex = activeIndex + direction;

        if (nextIndex < 0 || nextIndex >= items.length) {
            return;
        }

        render(nextIndex);
    };

    items.forEach((item) => {
        item.trigger.addEventListener("click", () => open(item.index, item.trigger));
    });

    closeControls.forEach((control) => {
        control.addEventListener("click", close);
    });

    prevButton.addEventListener("click", () => step(-1));
    nextButton.addEventListener("click", () => step(1));

    document.addEventListener("keydown", (event) => {
        if (!overlay.classList.contains("is-open")) {
            return;
        }

        if (event.key === "Escape") {
            close();
        } else if (event.key === "ArrowLeft") {
            step(-1);
        } else if (event.key === "ArrowRight") {
            step(1);
        }
    });
});
