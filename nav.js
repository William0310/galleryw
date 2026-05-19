document.addEventListener("DOMContentLoaded", () => {
    const latestNewsVersion = "2026-05-19-v1";
    const storageKey = "galleryw.news.seenVersion";
    const themeStorageKey = "galleryw.theme";
    const topbar = document.querySelector(".page-topbar");
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("site-nav");
    const newsLinks = Array.from(document.querySelectorAll("[data-news-link]"));
    const themeToggles = Array.from(document.querySelectorAll("[data-theme-toggle]"));
    const themeChoices = Array.from(document.querySelectorAll("[data-theme-choice]"));
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
        const nextLabel = isLight ? "Dark mode" : "Light mode";
        const nextAria = isLight ? "Switch to dark mode" : "Switch to light mode";
        const translate = (value) => window.gallerywI18n ? window.gallerywI18n.t(value) : value;

        themeToggles.forEach((button) => {
            const label = button.querySelector("[data-theme-toggle-label]");

            button.setAttribute("data-i18n-dynamic", "");
            button.setAttribute("aria-pressed", String(isLight));
            button.setAttribute("aria-label", translate(nextAria));

            if (label) {
                label.setAttribute("data-i18n-dynamic", "");
                label.textContent = translate(nextLabel);
            }
        });

        themeChoices.forEach((button) => {
            const isActive = button.dataset.themeChoice === getTheme();

            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
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

    themeChoices.forEach((button) => {
        button.addEventListener("click", () => {
            setTheme(button.dataset.themeChoice === "light" ? "light" : "dark");
        });
    });

    syncThemeToggles();

    window.addEventListener("storage", (event) => {
        if (event.key === themeStorageKey) {
            const storedTheme = event.newValue === "light" ? "light" : "dark";

            if (storedTheme === "light") {
                document.documentElement.dataset.theme = "light";
            } else {
                document.documentElement.removeAttribute("data-theme");
            }

            syncThemeToggles();
        }
    });

    window.addEventListener("galleryw:languagechange", syncThemeToggles);

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
