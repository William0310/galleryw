document.addEventListener("DOMContentLoaded", () => {
    const scrollTrigger = document.querySelector("[data-scroll-step]");
    const homeStory = document.getElementById("home-story");
    const collections = document.getElementById("collections");
    const firstShowcase = document.querySelector(".showcase-panel");
    const collectionCards = Array.from(document.querySelectorAll(".collection-card"));
    const canSpotlightCards = window.matchMedia("(hover: none), (pointer: coarse)").matches;

    if (canSpotlightCards && collectionCards.length > 0) {
        let ticking = false;

        const syncSpotlight = () => {
            ticking = false;

            const viewportCenter = window.innerHeight / 2;
            let activeCard = null;
            let activeDistance = Number.POSITIVE_INFINITY;

            collectionCards.forEach((card) => {
                const rect = card.getBoundingClientRect();
                const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;

                if (!isVisible) {
                    card.classList.remove("is-spotlit");
                    return;
                }

                const cardCenter = rect.top + rect.height / 2;
                const distance = Math.abs(cardCenter - viewportCenter);

                if (distance < activeDistance) {
                    activeDistance = distance;
                    activeCard = card;
                }
            });

            collectionCards.forEach((card) => {
                card.classList.toggle("is-spotlit", card === activeCard);
            });
        };

        const requestSpotlightSync = () => {
            if (ticking) {
                return;
            }

            ticking = true;
            window.requestAnimationFrame(syncSpotlight);
        };

        syncSpotlight();
        window.addEventListener("scroll", requestSpotlightSync, { passive: true });
        window.addEventListener("resize", requestSpotlightSync);
    }

    if (!scrollTrigger) {
        return;
    }

    scrollTrigger.addEventListener("click", (event) => {
        event.preventDefault();

        const topbar = document.querySelector(".page-topbar");
        const topbarOffset = (topbar?.getBoundingClientRect().height || 0) + 18;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const isMobile = window.matchMedia("(max-width: 720px)").matches;
        const currentY = window.scrollY || window.pageYOffset;
        const stepDistance = window.innerHeight * (isMobile ? 0.82 : 0.62);

        let targetY = currentY + stepDistance;

        if (collections) {
            const targetNode = firstShowcase || collections;
            const collectionsY = currentY + targetNode.getBoundingClientRect().top;
            targetY = isMobile ? collectionsY : Math.min(targetY, collectionsY);
        } else if (isMobile && homeStory) {
            targetY = Math.max(targetY, currentY + homeStory.getBoundingClientRect().top - topbarOffset);
        }

        const maxY = document.documentElement.scrollHeight - window.innerHeight;

        window.scrollTo({
            top: Math.max(0, Math.min(targetY, maxY)),
            behavior: reducedMotion ? "auto" : "smooth"
        });
    });
});
