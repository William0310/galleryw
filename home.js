document.addEventListener("DOMContentLoaded", () => {
    const cards = Array.from(document.querySelectorAll("[data-deck-card]"));
    const items = cards.map((card) => card.closest(".deck-item")).filter(Boolean);
    const scrollStart = document.querySelector("[data-scroll-start]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!cards.length || !items.length) {
        return;
    }

    let ticking = false;

    const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

    const ease = (value) => value * value * (3 - 2 * value);

    const setDeckVars = (card, covered, entry) => {
        const coveredEase = ease(covered);
        const entryEase = ease(entry);
        const scale = 0.966 + entryEase * 0.034 - coveredEase * 0.072;
        const y = (1 - entryEase) * 96 - coveredEase * 34;
        const z = coveredEase * -150;
        const rotate = (1 - entryEase) * 2.8 - coveredEase * 4.2;
        const brightness = 0.92 + entryEase * 0.08 - coveredEase * 0.18;
        const saturation = 0.94 + entryEase * 0.06 - coveredEase * 0.12;
        const blur = coveredEase * 0.48;

        card.style.setProperty("--deck-scale", scale.toFixed(3));
        card.style.setProperty("--deck-y", `${y.toFixed(1)}px`);
        card.style.setProperty("--deck-z", `${z.toFixed(1)}px`);
        card.style.setProperty("--deck-rotate", `${rotate.toFixed(2)}deg`);
        card.style.setProperty("--deck-brightness", brightness.toFixed(3));
        card.style.setProperty("--deck-saturation", saturation.toFixed(3));
        card.style.setProperty("--deck-blur", `${blur.toFixed(2)}px`);
        card.classList.toggle("is-covered", covered > 0.48);
    };

    const syncDeck = () => {
        ticking = false;

        if (reducedMotion) {
            return;
        }

        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

        cards.forEach((card, index) => {
            const nextItem = items[index + 1];
            const itemRect = items[index].getBoundingClientRect();
            let covered = 0;

            if (nextItem) {
                const nextRect = nextItem.getBoundingClientRect();
                const coverStart = viewportHeight * 0.92;
                const coverEnd = viewportHeight * 0.22;
                covered = clamp((coverStart - nextRect.top) / (coverStart - coverEnd));
            }

            const entryStart = viewportHeight * 1.08;
            const entryEnd = viewportHeight * 0.36;
            const entry = clamp((entryStart - itemRect.top) / (entryStart - entryEnd));

            setDeckVars(card, covered, entry);
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
