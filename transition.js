document.addEventListener("DOMContentLoaded", () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
        return;
    }

    const duration = 520;
    const overlay = document.createElement("div");
    overlay.className = "page-transition-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
    document.body.classList.add("is-transitioning");

    const revealPage = () => {
        overlay.classList.add("is-ready");
        overlay.classList.remove("is-leaving");
        window.setTimeout(() => {
            document.body.classList.remove("is-transitioning");
        }, 680);
    };

    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(revealPage);
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

        if (url.href === window.location.href) {
            return false;
        }

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
            document.body.classList.add("is-transitioning");
            overlay.classList.remove("is-ready");
            overlay.classList.add("is-leaving");

            const destination = link.href;
            window.setTimeout(() => {
                window.location.href = destination;
            }, duration);
        });
    });

    window.addEventListener("pageshow", () => {
        revealPage();
    });
});
