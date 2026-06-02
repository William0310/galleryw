document.addEventListener("DOMContentLoaded", () => {
    const scrollKey = "galleryw.home.scrollY";
    const board = document.querySelector("[data-collection-board]");
    const collectionsById = window.gallerywCollectionsById || {};
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scrollTicking = false;
    let activeSource = null;
    let previewState = "closed";
    let previewMotionToken = 0;

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

    const createElement = (tag, className, text) => {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (typeof text === "string") {
            element.textContent = text;
        }

        return element;
    };

    const createTicketHole = (side) => {
        const hole = createElement("span", `ticket-hole ticket-hole--${side}`);
        hole.setAttribute("aria-hidden", "true");
        return hole;
    };

    const preview = (() => {
        if (!board || Object.keys(collectionsById).length === 0) {
            return null;
        }

        const root = createElement("section", "collection-preview");
        const backdrop = createElement("button", "collection-preview__backdrop");
        const viewport = createElement("div", "collection-preview__viewport");
        const card = createElement("article", "collection-preview__card");
        const handle = createElement("span", "collection-preview__handle");
        const media = createElement("div", "collection-preview__media");
        const image = document.createElement("img");
        const body = createElement("div", "collection-preview__body");
        const eyebrow = createElement("p", "collection-preview__eyebrow");
        const title = createElement("h2", "collection-preview__title");
        const description = createElement("p", "collection-preview__description");
        const chapters = createElement("div", "collection-preview__chapters");
        const footer = createElement("div", "collection-preview__footer");
        const stats = createElement("dl", "collection-preview__stats");
        const yearStat = createElement("div", "collection-preview__stat");
        const cutsStat = createElement("div", "collection-preview__stat");
        const framesStat = createElement("div", "collection-preview__stat");
        const open = createElement("a", "cta-link collection-preview__open", "Open full collection");

        root.id = "collection-preview";
        root.hidden = true;
        root.setAttribute("aria-hidden", "true");
        backdrop.type = "button";
        backdrop.setAttribute("aria-label", "Close preview");
        backdrop.dataset.previewClose = "true";

        handle.setAttribute("aria-hidden", "true");

        card.setAttribute("role", "dialog");
        card.setAttribute("aria-modal", "true");
        card.setAttribute("aria-labelledby", "collection-preview-title");
        card.tabIndex = -1;

        image.decoding = "async";
        image.loading = "eager";

        yearStat.append(createElement("dt", "", "year"), createElement("dd"));
        cutsStat.append(createElement("dt", "", "cuts"), createElement("dd"));
        framesStat.append(createElement("dt", "", "frames"), createElement("dd"));
        stats.append(yearStat, cutsStat, framesStat);

        footer.append(stats, open);
        body.append(eyebrow, title, description, chapters, footer);
        media.appendChild(image);
        card.append(
            createTicketHole("left"),
            createTicketHole("right"),
            handle,
            media,
            body
        );
        viewport.appendChild(card);
        root.append(backdrop, viewport);
        document.body.appendChild(root);

        return {
            root,
            backdrop,
            viewport,
            card,
            image,
            body,
            eyebrow,
            title,
            description,
            chapters,
            open,
            yearValue: yearStat.querySelector("dd"),
            cutsValue: cutsStat.querySelector("dd"),
            framesValue: framesStat.querySelector("dd")
        };
    })();

    const populatePreview = (collection) => {
        if (!preview) {
            return;
        }

        preview.root.dataset.collectionId = collection.id;
        preview.card.style.setProperty("--preview-accent", collection.accent);
        preview.card.style.setProperty("--preview-surface", collection.surface);
        preview.card.style.setProperty("--preview-gradient", collection.gradient);
        preview.card.style.setProperty("--preview-light-surface", collection.lightSurface || collection.surface);
        preview.card.style.setProperty("--preview-light-gradient", collection.lightGradient || collection.gradient);
        preview.image.src = collection.image.src;
        preview.image.alt = collection.image.alt;
        preview.image.style.objectPosition = collection.image.position || "center";
        preview.eyebrow.textContent = collection.previewMeta || "[Add preview meta]";
        preview.title.textContent = collection.title;
        preview.title.id = "collection-preview-title";
        preview.description.textContent = collection.previewText || collection.homeSummary;
        preview.yearValue.textContent = collection.year;
        preview.cutsValue.textContent = String(collection.chapters.length).padStart(2, "0");
        preview.framesValue.textContent = collection.frames;
        preview.open.href = collection.href;
        preview.open.textContent = collection.id === "more" ? "Open more photos" : "Open full collection";
        preview.chapters.replaceChildren(
            ...collection.chapters.map((chapter) => createElement("span", "collection-preview__chapter", chapter.title))
        );
    };

    const clearActiveSource = () => {
        activeSource = null;
    };

    const waitForMotion = (element, propertyName, fallbackMs) => {
        if (reducedMotion || fallbackMs <= 0) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            let done = false;

            const finish = () => {
                if (done) {
                    return;
                }

                done = true;
                element.removeEventListener("transitionend", onTransitionEnd);
                window.clearTimeout(fallbackId);
                resolve();
            };

            const onTransitionEnd = (event) => {
                if (event.target === element && event.propertyName === propertyName) {
                    finish();
                }
            };

            const fallbackId = window.setTimeout(finish, fallbackMs);
            element.addEventListener("transitionend", onTransitionEnd);
        });
    };

    const finalizePreviewClose = (restoreFocus = true) => {
        if (!preview) {
            return;
        }

        preview.root.classList.remove("is-open");
        preview.root.hidden = true;
        preview.root.setAttribute("aria-hidden", "true");
        document.body.classList.remove("preview-open");

        if (restoreFocus) {
            activeSource?.focus();
        }

        clearActiveSource();
        previewState = "closed";
    };

    const openPreview = async (collectionId, source) => {
        if (!preview) {
            return;
        }

        const collection = collectionsById[collectionId];

        if (!collection) {
            return;
        }

        activeSource = source;
        populatePreview(collection);

        if (previewState === "open") {
            preview.card.focus();
            return;
        }

        previewMotionToken += 1;
        const motionToken = previewMotionToken;

        previewState = "opening";
        preview.root.hidden = false;
        preview.root.setAttribute("aria-hidden", "false");
        document.body.classList.add("preview-open");
        preview.root.classList.remove("is-open");
        preview.root.getBoundingClientRect();
        preview.root.classList.add("is-open");

        await waitForMotion(preview.card, "transform", 460);

        if (previewMotionToken !== motionToken) {
            return;
        }

        preview.card.focus();
        previewState = "open";
    };

    const closePreview = async () => {
        if (!preview || previewState === "closed" || previewState === "closing") {
            return;
        }

        previewMotionToken += 1;
        const motionToken = previewMotionToken;

        previewState = "closing";
        preview.root.classList.remove("is-open");

        await waitForMotion(preview.card, "transform", 360);

        if (previewMotionToken !== motionToken) {
            return;
        }

        finalizePreviewClose();
    };

    if (preview) {
        board.addEventListener("click", (event) => {
            const trigger = event.target.closest("[data-collection-trigger]");

            if (!trigger) {
                return;
            }

            const collectionId = trigger.dataset.collectionTrigger || "";
            openPreview(collectionId, trigger);
        });

        preview.card.addEventListener("click", (event) => {
            event.stopPropagation();
        });

        preview.backdrop.addEventListener("click", () => {
            closePreview();
        });

        preview.root.addEventListener("click", () => {
            closePreview();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && previewState !== "closed") {
                closePreview();
            }
        });
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            saveScrollPosition();
        }
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
    window.requestAnimationFrame(restoreScrollPosition);
    window.addEventListener("load", restoreScrollPosition, { once: true });
});

/* ─────────────────────────────────────────────────────────────
   Home page interactions
   · Scroll progress bar
   · Hero parallax
   · Scroll reveal (static + dynamically generated cards)
   · 3D card tilt (desktop pointer devices only)
───────────────────────────────────────────────────────────── */
(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Scroll progress bar ──────────────────────────────────
    const bar = document.getElementById("home-progress");
    const updateProgress = () => {
        if (!bar) return;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = total > 0 ? (window.scrollY / total * 100) + "%" : "0%";
    };

    // ── Hero parallax ────────────────────────────────────────
    const hero = document.querySelector(".home-hero");
    const updateParallax = () => {
        if (!hero || reducedMotion) return;
        const rect = hero.getBoundingClientRect();
        if (rect.bottom < 0) return;
        // shift background subtly as hero scrolls away
        const progress = Math.max(0, -rect.top / Math.max(rect.height, 1));
        const shift = progress * 36; // max 36 px
        document.documentElement.style.setProperty("--hero-parallax-y", shift + "px");
    };

    // ── Combined scroll handler ──────────────────────────────
    let scrollTicking2 = false;
    const onScroll = () => {
        if (scrollTicking2) return;
        scrollTicking2 = true;
        window.requestAnimationFrame(() => {
            scrollTicking2 = false;
            updateProgress();
            updateParallax();
        });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    updateProgress();
    updateParallax();

    // ── Scroll reveal ────────────────────────────────────────
    const revealIO = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add("is-visible");
                revealIO.unobserve(e.target);
            }
        });
    }, { threshold: 0.07 });

    // Observe static reveal targets immediately
    document.querySelectorAll(".home-reveal").forEach(el => revealIO.observe(el));

    // Observe collection cards as they are injected by collections.js
    const boardEl = document.querySelector("[data-collection-board]");
    if (boardEl) {
        const mutObs = new MutationObserver((mutations) => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType !== 1) return;
                    // The entry itself
                    if (node.classList && node.classList.contains("collection-entry")) {
                        node.classList.add("home-reveal");
                        revealIO.observe(node);
                        // Attach tilt to the shell inside
                        const shell = node.querySelector(".collection-entry__shell");
                        if (shell) attachTilt(shell);
                    }
                    // Nested entries (shouldn't happen but be safe)
                    node.querySelectorAll && node.querySelectorAll(".collection-entry").forEach(entry => {
                        if (!entry.classList.contains("home-reveal")) {
                            entry.classList.add("home-reveal");
                            revealIO.observe(entry);
                        }
                        const shell = entry.querySelector(".collection-entry__shell");
                        if (shell && !shell.dataset.tilt) attachTilt(shell);
                    });
                });
            });
        });
        mutObs.observe(boardEl, { childList: true });
    }

    // ── 3D card tilt ─────────────────────────────────────────
    const isFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const attachTilt = (card) => {
        if (!isFine || reducedMotion || card.dataset.tilt) return;
        card.dataset.tilt = "1";
        const MAX = 5; // max degrees

        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
            const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
            card.style.transform = `perspective(900px) rotateX(${-dy * MAX}deg) rotateY(${dx * MAX}deg) translateY(-4px)`;
            card.style.transition = "transform 0.08s linear, border-color 0.32s ease, box-shadow 0.32s ease, opacity 0.28s ease";
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "";
            card.style.transition = "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.32s ease, box-shadow 0.32s ease, opacity 0.28s ease";
        });
    };

    // Also attach tilt to the about portrait card
    const aboutPortrait = document.querySelector(".home-about-band__portrait");
    if (aboutPortrait) attachTilt(aboutPortrait);
    const aboutCard = document.querySelector(".home-about-band__card");
    if (aboutCard) attachTilt(aboutCard);
})();
