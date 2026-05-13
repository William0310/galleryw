document.addEventListener("DOMContentLoaded", () => {
    const latestNewsVersion = "2026-05-13-v1";
    const storageKey = "galleryw.news.seenVersion";
    const themeStorageKey = "galleryw.theme";
    const topbar = document.querySelector(".page-topbar");
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("site-nav");
    const newsLinks = Array.from(document.querySelectorAll("[data-news-link]"));
    const themeToggles = Array.from(document.querySelectorAll("[data-theme-toggle]"));
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

    const getTheme = () => document.documentElement.dataset.theme === "light" ? "light" : "dark";

    const persistTheme = (theme) => {
        try {
            window.localStorage.setItem(themeStorageKey, theme);
        } catch {
            return;
        }
    };

    const syncThemeToggles = () => {
        const isLight = getTheme() === "light";

        themeToggles.forEach((button) => {
            const label = button.querySelector("[data-theme-toggle-label]");

            button.setAttribute("aria-pressed", String(isLight));
            button.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");

            if (label) {
                label.textContent = isLight ? "Dark mode" : "Light mode";
            }
        });
    };

    const setTheme = (theme) => {
        if (theme === "light") {
            document.documentElement.dataset.theme = "light";
        } else {
            document.documentElement.removeAttribute("data-theme");
        }

        persistTheme(theme);
        syncThemeToggles();
    };

    themeToggles.forEach((button) => {
        button.addEventListener("click", () => {
            setTheme(getTheme() === "light" ? "dark" : "light");
        });
    });

    syncThemeToggles();

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
