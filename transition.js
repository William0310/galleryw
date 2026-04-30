document.addEventListener("DOMContentLoaded", () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 0 : 420;

    const style = document.createElement("style");
    style.textContent = `
        .page-transition-overlay {
            position: fixed;
            inset: 0;
            background: #091017;
            z-index: 9990;
            pointer-events: none;
            opacity: 1;
            transition: opacity ${duration}ms ease;
        }

        .page-transition-overlay.is-ready {
            opacity: 0;
        }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement("div");
    overlay.className = "page-transition-overlay";
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.classList.add("is-ready");
    });

    const isInternalLink = (link) => {
        const href = link.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
            return false;
        }

        if (link.target === "_blank" || link.hasAttribute("download")) {
            return false;
        }

        const url = new URL(link.href, window.location.href);
        return url.origin === window.location.origin || url.protocol === "file:";
    };

    document.querySelectorAll("a[href]").forEach((link) => {
        link.addEventListener("click", (event) => {
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey ||
                !isInternalLink(link)
            ) {
                return;
            }

            event.preventDefault();
            overlay.classList.remove("is-ready");

            const destination = link.href;
            window.setTimeout(() => {
                window.location.href = destination;
            }, duration);
        });
    });

    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            overlay.classList.add("is-ready");
        }
    });
});
