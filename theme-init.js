(() => {
    try {
        const storedTheme = window.localStorage.getItem("galleryw.theme");

        if (storedTheme === "light") {
            document.documentElement.dataset.theme = "light";
        }
    } catch {
        return;
    }
})();
