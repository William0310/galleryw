document.addEventListener("DOMContentLoaded", () => {
    const latestNewsVersion = "2026-05-10-v1";
    const storageKey = "galleryw.news.seenVersion";
    const topbar = document.querySelector(".page-topbar");
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("site-nav");
    const newsLinks = Array.from(document.querySelectorAll("[data-news-link]"));
    const isNewsPage = document.body.classList.contains("news-page");

    const getSeenVersion = () => {
        try {
            return window.localStorage.getItem(storageKey);
        } catch {
            return latestNewsVersion;
        }
    };

    const setSeenVersion = () => {
        try {
            window.localStorage.setItem(storageKey, latestNewsVersion);
        } catch {
            return;
        }
    };

    const syncUnreadState = () => {
        const isUnread = getSeenVersion() !== latestNewsVersion;

        newsLinks.forEach((link) => {
            link.classList.toggle("has-unread", isUnread);
            link.setAttribute("aria-label", isUnread ? "News, unread updates" : "News");
        });

        if (toggle) {
            toggle.classList.toggle("has-unread", isUnread);
        }
    };

    if (isNewsPage) {
        setSeenVersion();
    }

    syncUnreadState();

    if (!topbar || !toggle || !nav) {
        return;
    }

    const closeMenu = () => {
        topbar.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
    };

    const openMenu = () => {
        topbar.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
    };

    toggle.addEventListener("click", () => {
        if (topbar.classList.contains("is-open")) {
            closeMenu();
            return;
        }

        openMenu();
    });

    nav.addEventListener("click", (event) => {
        if (event.target instanceof HTMLAnchorElement) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });
});
