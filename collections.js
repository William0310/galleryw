(() => {
    const collections = [
        {
            id: "qinghai",
            number: "01",
            href: "qinghai.html",
            title: "Qinghai",
            cardMeta: "EOS R5 + Dji Mini 3Pro",
            previewMeta: "EOS R5 + Dji Mini 3Pro",
            homeKicker: "Plateau",
            homeSummary: "Temple red, road light, and salt-lake white.",
            previewText: "A first full travel edit: temple red, salt-lake white, plateau wind, and long highway moments where the landscape sets the pace.",
            year: "2024",
            frames: "10",
            ratio: "5 / 7",
            accent: "#88b96f",
            surface: "rgba(10, 18, 15, 0.88)",
            gradient: [
                "radial-gradient(circle at 18% 16%, rgba(133, 196, 125, 0.34), transparent 34%)",
                "radial-gradient(circle at 84% 84%, rgba(117, 198, 224, 0.28), transparent 34%)",
                "linear-gradient(180deg, rgba(6, 9, 8, 0.08) 0%, rgba(6, 9, 8, 0.4) 45%, rgba(6, 9, 8, 0.9) 100%)"
            ].join(", "),
            image: {
                src: "images/chaka1.webp",
                alt: "Reflective water at Chaka Salt Lake",
                width: 3000,
                height: 2000,
                position: "center 52%"
            },
            linkText: "Open preview",
            chapters: [
                {
                    id: "taer-temple",
                    kicker: "Monastery red",
                    title: "Ta'er Temple",
                    description: "Prayer-wheel corridors, carved detail, and a slower opening frame.",
                    figures: [0]
                },
                {
                    id: "road-grassland",
                    kicker: "Plateau geometry",
                    title: "Road & Grassland",
                    description: "Highway light, alpine forest, and the open stretch between stops.",
                    figures: [1, 2, 3, 8]
                },
                {
                    id: "lakes-salt",
                    kicker: "Blue and white",
                    title: "Lake & Salt",
                    description: "Qinghai Lake, Chaka Salt Lake, and the brightest ending in the set.",
                    figures: [4, 5, 6, 7, 9]
                }
            ]
        },
        {
            id: "japan",
            number: "02",
            href: "japan.html",
            title: "Japan",
            cardMeta: "Nikon Z9",
            previewMeta: "Nikon Z9",
            homeKicker: "Island",
            homeSummary: "Kyoto repetition, Tokyo neon, and Fuji air.",
            previewText: "Tokyo, Kyoto, Fujikawaguchiko, and the in-between moments where structure, weather, and quiet repetition begin to line up.",
            year: "2025",
            frames: "16",
            ratio: "5 / 7",
            accent: "#e8a08d",
            surface: "rgba(20, 14, 12, 0.88)",
            gradient: [
                "radial-gradient(circle at 14% 14%, rgba(235, 140, 108, 0.3), transparent 34%)",
                "radial-gradient(circle at 82% 82%, rgba(210, 177, 104, 0.24), transparent 34%)",
                "linear-gradient(180deg, rgba(9, 7, 6, 0.08) 0%, rgba(9, 7, 6, 0.42) 45%, rgba(9, 7, 6, 0.9) 100%)"
            ].join(", "),
            image: {
                src: "images/kyoto1.webp",
                alt: "Rows of red torii gates in Kyoto",
                width: 2850,
                height: 1695,
                position: "center 46%"
            },
            linkText: "Open preview",
            chapters: [
                {
                    id: "fuji-shrine",
                    kicker: "Kawaguchiko",
                    title: "Fuji & Shrine Air",
                    description: "Torii framing, mountain shrine silence, and the lake at the edge of the route.",
                    figures: [0, 2, 15]
                },
                {
                    id: "kyoto-sequence",
                    kicker: "Kyoto",
                    title: "Temple Sequence",
                    description: "Torii, reflections, temple roofs, and the quieter rhythm of Kyoto interiors.",
                    figures: [1, 3, 5, 7, 8, 9, 10, 11, 12]
                },
                {
                    id: "city-nights",
                    kicker: "Tokyo / Osaka",
                    title: "City Nights",
                    description: "Compression, skyline glow, and the lantern-lit hours after sunset.",
                    figures: [4, 6, 13, 14]
                }
            ]
        },
        {
            id: "yiheyuan",
            number: "03",
            href: "yiheyuan.html",
            title: "Yiheyuan",
            cardMeta: "Nikon Z9",
            previewMeta: "Nikon Z9",
            homeKicker: "Garden",
            homeSummary: "Stone, water, lake haze, and imperial symmetry.",
            previewText: "A Beijing edit from the Summer Palace: water, stone, garden structure, and the slower pace of an old imperial landscape inside a modern city.",
            year: "2025",
            frames: "06",
            ratio: "5 / 7",
            accent: "#d4ae68",
            surface: "rgba(21, 16, 10, 0.86)",
            gradient: [
                "radial-gradient(circle at 18% 18%, rgba(225, 189, 108, 0.28), transparent 34%)",
                "radial-gradient(circle at 82% 80%, rgba(162, 199, 211, 0.24), transparent 34%)",
                "linear-gradient(180deg, rgba(10, 8, 6, 0.08) 0%, rgba(10, 8, 6, 0.42) 46%, rgba(10, 8, 6, 0.9) 100%)"
            ].join(", "),
            image: {
                src: "images/yih3.webp",
                alt: "Yiheyuan landscape scene in Beijing",
                width: 2750,
                height: 1833,
                position: "center 42%"
            },
            linkText: "Open preview",
            chapters: [
                {
                    id: "longevity-hill",
                    kicker: "Hill axis",
                    title: "Longevity Hill",
                    description: "Tower views, the glazed entrance arch, and the climb into the palace core.",
                    figures: [0, 1, 2]
                },
                {
                    id: "kunming-lake",
                    kicker: "Lake edge",
                    title: "Kunming Lake",
                    description: "Open water, late silhouettes, and the softer light that closes the garden.",
                    figures: [3, 4, 5]
                }
            ]
        },
        {
            id: "chongqing",
            number: "04",
            href: "chongqing.html",
            title: "Chongqing",
            cardMeta: "Nikon Z9",
            previewMeta: "Nikon Z9",
            homeKicker: "City",
            homeSummary: "Stacked roads, river light, and neon compression.",
            previewText: "A city of vertical turns, stacked roads, river reflections, and night light dense enough to confuse the map.",
            year: "2025",
            frames: "05",
            ratio: "5 / 7",
            accent: "#78d8ef",
            surface: "rgba(8, 15, 20, 0.88)",
            gradient: [
                "radial-gradient(circle at 18% 14%, rgba(39, 149, 193, 0.34), transparent 34%)",
                "radial-gradient(circle at 82% 84%, rgba(197, 64, 49, 0.22), transparent 34%)",
                "linear-gradient(180deg, rgba(5, 8, 11, 0.08) 0%, rgba(5, 8, 11, 0.42) 45%, rgba(5, 8, 11, 0.9) 100%)"
            ].join(", "),
            image: {
                src: "images/cq5.webp",
                alt: "Night bridge and skyline in Chongqing",
                width: 3200,
                height: 1506,
                position: "center 54%"
            },
            linkText: "Open preview",
            chapters: [
                {
                    id: "street-entry",
                    kicker: "Threshold",
                    title: "Street Entry",
                    description: "A tighter way into the city before the river and towers fully open up.",
                    figures: [0, 1]
                },
                {
                    id: "skyline-core",
                    kicker: "River skyline",
                    title: "Skyline Core",
                    description: "CBD glass, Raffles City, and the bridge line that anchors the last frame.",
                    figures: [2, 3, 4]
                }
            ]
        },
        {
            id: "yulong",
            number: "05",
            href: "yulong.html",
            title: "Lijiang",
            cardMeta: "Nikon Z9",
            previewMeta: "Nikon Z9",
            homeKicker: "Mountain",
            homeSummary: "Bright glacial water, altitude air, and yak meadow quiet.",
            previewText: "Cold air, bright water, mountain shadow, and a short winter edit around Jade Dragon Snow Mountain.",
            year: "2025",
            frames: "07",
            ratio: "5 / 7",
            accent: "#9fc8d8",
            surface: "rgba(10, 16, 20, 0.88)",
            gradient: [
                "radial-gradient(circle at 18% 14%, rgba(104, 176, 207, 0.32), transparent 34%)",
                "radial-gradient(circle at 82% 84%, rgba(198, 221, 241, 0.18), transparent 34%)",
                "linear-gradient(180deg, rgba(6, 9, 11, 0.08) 0%, rgba(6, 9, 11, 0.42) 45%, rgba(6, 9, 11, 0.9) 100%)"
            ].join(", "),
            image: {
                src: "images/mainli.webp",
                alt: "Blue water and mountains near Lijiang",
                width: 2650,
                height: 1555,
                position: "center 52%"
            },
            linkText: "Open preview",
            chapters: [
                {
                    id: "blue-moon-valley",
                    kicker: "Waterline",
                    title: "Blue Moon Valley",
                    description: "Turquoise water, prayer flags, and the cleaner opening notes of the mountain route.",
                    figures: [0, 1]
                },
                {
                    id: "high-altitude",
                    kicker: "4680M",
                    title: "High Altitude",
                    description: "Thin air, exposed stone, and the late light that turns the ridge warm.",
                    figures: [2, 5]
                },
                {
                    id: "yak-meadow",
                    kicker: "Meadow quiet",
                    title: "Yak Meadow",
                    description: "Cloud layers, open pasture, and the last calm resident in the frame.",
                    figures: [3, 4, 6]
                }
            ]
        },
        {
            id: "more",
            number: "06",
            href: "archive.html",
            title: "More Works",
            cardMeta: "More",
            previewMeta: "More",
            homeKicker: "♾️",
            homeSummary: "iPhone frames, smaller studies, and what is still forming.",
            previewText: "Smaller edits, camera studies, and future fieldwork live here before they become full chapters.",
            year: "2026",
            frames: "03",
            ratio: "5 / 7",
            accent: "#e2c8a6",
            surface: "rgba(20, 16, 13, 0.86)",
            gradient: [
                "radial-gradient(circle at 18% 18%, rgba(255, 211, 145, 0.28), transparent 34%)",
                "radial-gradient(circle at 82% 82%, rgba(120, 152, 205, 0.18), transparent 34%)",
                "linear-gradient(180deg, rgba(9, 7, 6, 0.08) 0%, rgba(9, 7, 6, 0.42) 45%, rgba(9, 7, 6, 0.9) 100%)"
            ].join(", "),
            image: {
                src: "images/iphone1.webp",
                alt: "Ocean sunset photographed on iPhone",
                width: 3000,
                height: 2250,
                position: "center 52%"
            },
            linkText: "Open preview",
            chapters: [
                { id: "iphone", title: "Shot on iPhone" },
                { id: "myth", title: "World Myth Project" },
                { id: "future", title: "Future Plans" }
            ]
        }
    ];

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

    const clampColor = (value) => Math.max(0, Math.min(255, Math.round(value)));

    const hexToRgb = (hex) => {
        const normalized = hex.replace("#", "");
        const parsed = normalized.length === 3
            ? normalized.split("").map((char) => Number.parseInt(char + char, 16))
            : [
                Number.parseInt(normalized.slice(0, 2), 16),
                Number.parseInt(normalized.slice(2, 4), 16),
                Number.parseInt(normalized.slice(4, 6), 16)
            ];

        return parsed.map((channel) => clampColor(channel));
    };

    const mixRgb = (from, to, ratio) => from.map((channel, index) => {
        const target = to[index];
        return clampColor(channel + ((target - channel) * ratio));
    });

    const rgba = (rgb, alpha) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

    const createLightSurface = (accentHex) => {
        const accentRgb = hexToRgb(accentHex);
        return rgba(mixRgb(accentRgb, [255, 255, 255], 0.9), 0.94);
    };

    const createLightGradient = (accentHex) => {
        const accentRgb = hexToRgb(accentHex);
        const complementRgb = accentRgb.map((channel) => 255 - channel);
        const liftedAccent = mixRgb(accentRgb, [255, 255, 255], 0.52);
        const liftedComplement = mixRgb(complementRgb, [255, 255, 255], 0.7);

        return [
            `radial-gradient(circle at 18% 16%, ${rgba(liftedAccent, 0.26)}, transparent 34%)`,
            `radial-gradient(circle at 84% 84%, ${rgba(liftedComplement, 0.18)}, transparent 36%)`
        ].join(", ");
    };

    collections.forEach((collection) => {
        collection.lightSurface = createLightSurface(collection.accent);
        collection.lightGradient = createLightGradient(collection.accent);
    });

    const createStat = (label, value) => {
        const wrapper = document.createElement("div");
        const term = document.createElement("dt");
        const description = document.createElement("dd");

        term.textContent = label;
        description.textContent = value;
        wrapper.append(term, description);

        return wrapper;
    };

    const createTicketHole = (side) => {
        const hole = createElement("span", `ticket-hole ticket-hole--${side}`);
        hole.setAttribute("aria-hidden", "true");
        return hole;
    };

    const createTicketCutline = () => {
        const line = createElement("span", "ticket-cutline");
        line.setAttribute("aria-hidden", "true");
        return line;
    };

    const renderCollectionCard = (collection) => {
        const article = createElement("article", "collection-entry");
        const shell = createElement("button", "collection-entry__shell");
        const visual = createElement("div", "collection-entry__visual");
        const image = document.createElement("img");
        const top = createElement("div", "collection-entry__top");
        const copy = createElement("div", "collection-entry__copy");
        const stats = createElement("dl", "collection-entry__stats");
        const chapterCount = String(collection.chapters.length).padStart(2, "0");

        article.style.setProperty("--card-ratio", collection.ratio);
        shell.style.setProperty("--card-accent", collection.accent);
        shell.style.setProperty("--card-surface", collection.surface);
        shell.style.setProperty("--card-gradient", collection.gradient);
        shell.style.setProperty("--card-light-surface", collection.lightSurface);
        shell.style.setProperty("--card-light-gradient", collection.lightGradient);

        shell.type = "button";
        shell.dataset.collectionTrigger = collection.id;
        shell.setAttribute("aria-controls", "collection-preview");
        shell.setAttribute("aria-haspopup", "dialog");
        shell.setAttribute("aria-label", `Preview ${collection.title} collection`);

        image.src = collection.image.src;
        image.alt = collection.image.alt;
        image.width = collection.image.width;
        image.height = collection.image.height;
        image.loading = "lazy";
        image.decoding = "async";
        image.style.objectPosition = collection.image.position || "center";

        visual.appendChild(image);

        top.append(
            createElement("span", "collection-entry__number", collection.number),
            createElement("span", "collection-entry__tag", collection.homeKicker)
        );

        copy.append(
            createElement("p", "collection-entry__eyebrow", collection.cardMeta || "[Add card meta]"),
            createElement("h3", "", collection.title),
            createElement("p", "collection-entry__description", collection.homeSummary)
        );

        stats.append(
            createStat("year", collection.year),
            createStat("cuts", chapterCount),
            createStat("frames", collection.frames)
        );

        copy.append(stats);
        shell.append(
            createTicketHole("left"),
            createTicketHole("right"),
            createTicketCutline(),
            visual,
            top,
            copy
        );
        article.appendChild(shell);

        return article;
    };

    const renderCollections = () => {
        const board = document.querySelector("[data-collection-board]");

        if (!board) {
            return;
        }

        board.replaceChildren(...collections.map(renderCollectionCard));

        const collectionCount = document.querySelector("[data-home-collection-count]");
        const cutCount = document.querySelector("[data-home-cut-count]");

        if (collectionCount) {
            collectionCount.textContent = String(collections.length).padStart(2, "0");
        }

        if (cutCount) {
            const totalChapters = collections.reduce((sum, collection) => sum + collection.chapters.length, 0);
            cutCount.textContent = String(totalChapters).padStart(2, "0");
        }
    };

    window.gallerywCollections = collections;
    window.gallerywCollectionsById = Object.fromEntries(
        collections.map((collection) => [collection.id, collection])
    );

    document.addEventListener("DOMContentLoaded", renderCollections);
})();
