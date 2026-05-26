document.addEventListener("DOMContentLoaded", () => {
    const pageClass = Array.from(document.body.classList).find(
        (className) => className.startsWith("series-") && className !== "series-page"
    );
    const seriesId = pageClass?.replace("series-", "");
    const collection = window.gallerywCollectionsById?.[seriesId];
    const hero = document.querySelector(".series-hero");
    const storyGrid = document.querySelector(".story-grid");
    const figures = Array.from(storyGrid?.querySelectorAll(".story-card") || []);

    if (!collection || !hero || !storyGrid || figures.length === 0 || !Array.isArray(collection.chapters)) {
        return;
    }

    const createElement = (tag, className, text) => {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (typeof text === "string") {
            element.textContent = text;
        }

        return element;
    };

    const createStat = (label, value) => {
        const wrapper = document.createElement("div");
        const term = document.createElement("dt");
        const description = document.createElement("dd");

        term.textContent = label;
        description.textContent = value;
        wrapper.append(term, description);

        return wrapper;
    };

    const formatCount = (value) => String(value).padStart(2, "0");

    if (!hero.querySelector(".series-ticket-footer")) {
        const footer = createElement("div", "series-ticket-footer");
        const browseLink = createElement("a", "cta-link cta-link--muted series-ticket-link", "Browse chapters");
        const stats = createElement("dl", "series-ticket-stats");

        browseLink.href = "#series-chapters";
        stats.append(
            createStat("year", collection.year),
            createStat("cuts", formatCount(collection.chapters.length)),
            createStat("frames", formatCount(figures.length))
        );
        footer.append(browseLink, stats);
        hero.querySelector(".series-copy")?.appendChild(footer);
    }

    const rail = createElement("section", "series-chapter-rail");
    const railIntro = createElement("div", "series-chapter-intro");
    const railGrid = createElement("div", "series-chapter-grid");
    const sections = createElement("div", "series-chapter-sections");
    const usedFigures = new Set();

    rail.id = "series-chapters";
    rail.setAttribute("aria-labelledby", "series-chapter-heading");

    railIntro.append(
        (() => {
            const block = document.createElement("div");
            block.append(
                createElement("h2", "section-title", "Choose a chapter.")
            );
            return block;
        })(),
        createElement("p", "section-copy", "A short landing view first, then the smaller cuts inside each series.")
    );

    railIntro.querySelector(".section-title")?.setAttribute("id", "series-chapter-heading");

    collection.chapters.forEach((chapter, chapterIndex) => {
        const firstFigure = figures[chapter.figures?.[0]];
        const previewImage = firstFigure?.querySelector("img");
        const frameCount = Array.isArray(chapter.figures) ? chapter.figures.length : 0;
        const card = createElement("a", "series-chapter-card");
        const media = createElement("div", "series-chapter-card__media");
        const copy = createElement("div", "series-chapter-card__copy");
        const meta = createElement("div", "series-chapter-card__meta");
        const section = createElement("section", "series-chapter-section");
        const sectionHead = createElement("div", "series-chapter-head");
        const sectionGrid = createElement("div", "story-grid chapter-grid");

        card.href = `#chapter-${chapter.id}`;
        card.style.setProperty("--chapter-accent", collection.accent);

        if (previewImage) {
            const image = previewImage.cloneNode(true);
            image.loading = "lazy";
            image.decoding = "async";
            media.appendChild(image);
        }

        meta.append(
            createElement("span", "", `${formatCount(frameCount)} frames`),
            createElement("span", "", "Open chapter")
        );

        copy.append(
            createElement("p", "series-chapter-card__eyebrow", `${formatCount(chapterIndex + 1)} / ${chapter.kicker}`),
            createElement("h3", "", chapter.title),
            createElement("p", "series-chapter-card__description", chapter.description),
            meta
        );

        card.append(media, copy);
        railGrid.appendChild(card);

        section.id = `chapter-${chapter.id}`;
        section.append(sectionHead, sectionGrid);
        sectionHead.append(
            (() => {
                const block = document.createElement("div");
                block.append(
                    createElement("p", "section-kicker", `${formatCount(chapterIndex + 1)} / ${chapter.kicker}`),
                    createElement("h2", "section-title", chapter.title)
                );
                return block;
            })(),
            createElement("p", "section-copy", chapter.description)
        );

        (chapter.figures || []).forEach((figureIndex) => {
            const figure = figures[figureIndex];

            if (!figure || usedFigures.has(figureIndex)) {
                return;
            }

            usedFigures.add(figureIndex);
            sectionGrid.appendChild(figure);
        });

        sections.appendChild(section);
    });

    const remainder = figures.filter((_, index) => !usedFigures.has(index));

    if (remainder.length) {
        const lastGrid = sections.querySelector(".series-chapter-section:last-child .chapter-grid");

        if (lastGrid) {
            remainder.forEach((figure) => {
                lastGrid.appendChild(figure);
            });
        }
    }

    rail.append(railIntro, railGrid);
    storyGrid.replaceWith(sections);
    hero.insertAdjacentElement("afterend", rail);
});
