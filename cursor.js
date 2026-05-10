document.addEventListener("DOMContentLoaded", () => {
    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-viewfinder");
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!dot || !ring || !finePointer || reducedMotion || window.innerWidth <= 768) {
        return;
    }

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let dotX = pointerX;
    let dotY = pointerY;
    let ringX = pointerX;
    let ringY = pointerY;
    let visible = false;

    const hoverSelector = "a, button, .chip, .cta-link, .collection-entry, .story-card";

    const reveal = () => {
        if (visible) {
            return;
        }

        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
    };

    window.addEventListener("pointermove", (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        reveal();

        const hoverTarget = event.target instanceof Element ? event.target.closest(hoverSelector) : null;
        ring.classList.toggle("is-hovering", Boolean(hoverTarget));
    });

    window.addEventListener("pointerleave", () => {
        visible = false;
        dot.style.opacity = "0";
        ring.style.opacity = "0";
    });

    const render = () => {
        dotX += (pointerX - dotX) * 0.24;
        dotY += (pointerY - dotY) * 0.24;
        ringX += (pointerX - ringX) * 0.14;
        ringY += (pointerY - ringY) * 0.14;

        dot.style.transform = `translate(${dotX}px, ${dotY}px)`;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;

        window.requestAnimationFrame(render);
    };

    render();
});
