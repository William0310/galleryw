document.addEventListener("DOMContentLoaded", () => {
    const scrollTrigger = document.querySelector("[data-scroll-step]");
    const homeStory = document.getElementById("home-story");
    const collections = document.getElementById("collections");

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

        if (isMobile && homeStory) {
            targetY = Math.max(targetY, currentY + homeStory.getBoundingClientRect().top - topbarOffset);
        }

        if (!isMobile && collections) {
            targetY = Math.min(targetY, currentY + collections.getBoundingClientRect().top - topbarOffset);
        }

        const maxY = document.documentElement.scrollHeight - window.innerHeight;

        window.scrollTo({
            top: Math.max(0, Math.min(targetY, maxY)),
            behavior: reducedMotion ? "auto" : "smooth"
        });
    });
});
