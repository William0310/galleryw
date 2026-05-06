document.addEventListener("DOMContentLoaded", () => {
    const cards = Array.from(document.querySelectorAll("[data-deck-card]"));
    const items = cards.map((card) => card.closest(".deck-item")).filter(Boolean);
    const deck = document.querySelector(".deck-stack");
    const scrollStart = document.querySelector("[data-scroll-start]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!deck || !cards.length || !items.length) {
        return;
    }

    let ticking = false;
    let stepSize = 1;

    const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

    const ease = (value) => value * value * (3 - 2 * value);

    const setDeckVars = (card, distance, isActive) => {
        const incoming = clamp(distance, 0, 1.35);
        const covered = clamp(-distance, 0, 1);
        const visibleEntry = clamp((1.24 - distance) / 0.29);
        const incomingProgress = clamp(1 - incoming);
        const incomingEase = ease(incomingProgress);
        const coveredEase = ease(covered);
        const y = incoming * 108;
        const scale = 0.972 + incomingEase * 0.028 - coveredEase * 0.07;
        const z = coveredEase * -170;
        const rotate = incoming * 2.4 - coveredEase * 4;
        const brightness = 0.9 + incomingEase * 0.1 - coveredEase * 0.17;
        const saturation = 0.94 + incomingEase * 0.06 - coveredEase * 0.1;
        const blur = coveredEase * 0.35;
        const opacity = distance > 0.95 ? visibleEntry : 1;

        card.style.setProperty("--deck-scale", scale.toFixed(3));
        card.style.setProperty("--deck-y", `${y.toFixed(2)}%`);
        card.style.setProperty("--deck-z", `${z.toFixed(1)}px`);
        card.style.setProperty("--deck-rotate", `${rotate.toFixed(2)}deg`);
        card.style.setProperty("--deck-brightness", brightness.toFixed(3));
        card.style.setProperty("--deck-saturation", saturation.toFixed(3));
        card.style.setProperty("--deck-blur", `${blur.toFixed(2)}px`);
        card.style.setProperty("--deck-opacity", opacity.toFixed(3));
        card.classList.toggle("is-active", isActive && opacity > 0.75);
    };

    const layoutDeck = () => {
        items.forEach((item, index) => {
            item.style.zIndex = index + 1;
        });

        if (reducedMotion) {
            deck.style.height = "";
            return;
        }

        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const cardHeight = items[0].getBoundingClientRect().height || viewportHeight * 0.68;
        const isMobile = window.matchMedia("(max-width: 820px)").matches;
        stepSize = viewportHeight * (isMobile ? 0.88 : 0.92);

        deck.style.height = `${cardHeight + (stepSize * (cards.length - 1)) + (viewportHeight * 0.52)}px`;
    };

    const syncDeck = () => {
        ticking = false;

        layoutDeck();

        if (reducedMotion) {
            return;
        }

        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const stickyTop = parseFloat(window.getComputedStyle(items[0]).top) || viewportHeight * 0.1;
        const deckTop = deck.getBoundingClientRect().top;
        const progress = clamp((stickyTop - deckTop) / stepSize, 0, cards.length - 1);
        const activeIndex = Math.round(progress);

        cards.forEach((card, index) => {
            setDeckVars(card, index - progress, index === activeIndex);
        });
    };

    const requestSync = () => {
        if (ticking) {
            return;
        }

        ticking = true;
        window.requestAnimationFrame(syncDeck);
    };

    if (scrollStart) {
        scrollStart.addEventListener("click", (event) => {
            event.preventDefault();

            const deck = document.getElementById("collections");

            if (!deck) {
                return;
            }

            window.scrollTo({
                top: Math.max(0, window.scrollY + deck.getBoundingClientRect().top),
                behavior: reducedMotion ? "auto" : "smooth"
            });
        });
    }

    syncDeck();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);
});
