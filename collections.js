(() => {
    // Add, remove, or reorder homepage collection cards here.
    const collections = [
        {
            id: "qinghai",
            number: "01",
            href: "qinghai.html",
            preview: "qinghai",
            image: {
                src: "images/qinghai1.webp",
                alt: "Grassland and mountains in Qinghai",
                width: 2850,
                height: 1695
            },
            ariaLabel: "Open Qinghai collection",
            meta: "July 2024 / Canon R5 + DJI Mini 3 Pro",
            title: "Qinghai",
            description: "Temple red, salt-lake white, alpine water, and the slow geometry of roads crossing a high landscape.",
            linkText: "Open series"
        },
        {
            id: "japan",
            number: "02",
            href: "japan.html",
            preview: "japan",
            image: {
                src: "images/kyoto1.webp",
                alt: "Rows of red torii gates in Kyoto",
                width: 2850,
                height: 1695
            },
            ariaLabel: "Open Japan collection",
            meta: "July 2025 / Nikon Z9",
            title: "Japan",
            description: "Tokyo, Kyoto, Fuji, and Osaka edited as a sequence of repetition, contrast, and quiet intervals.",
            linkText: "Open series"
        },
        {
            id: "yiheyuan",
            number: "03",
            href: "yiheyuan.html",
            preview: "yiheyuan",
            image: {
                src: "images/yih3.webp",
                alt: "Yiheyuan landscape scene in Beijing",
                width: 2750,
                height: 1833
            },
            ariaLabel: "Open Yiheyuan collection",
            meta: "Nikon Z9 / Summer Palace",
            title: "Yiheyuan",
            description: "Stone, lake, timber, and soft afternoon haze around one of Beijing's most composed landscapes.",
            linkText: "Open series"
        },
        {
            id: "chongqing",
            number: "04",
            href: "chongqing.html",
            preview: "chongqing",
            image: {
                src: "images/cq5.webp",
                alt: "Night city view in Chongqing",
                width: 3200,
                height: 1506
            },
            ariaLabel: "Open Chongqing collection",
            meta: "August 2025 / Nikon Z9",
            title: "Chongqing",
            description: "A dense urban chapter where bridges, towers, traffic, and river reflections compete for the frame.",
            linkText: "Open series"
        },
        {
            id: "lijiang",
            number: "05",
            href: "yulong.html",
            preview: "lijiang",
            image: {
                src: "images/mainli.webp",
                alt: "Blue water and mountains near Lijiang",
                width: 2650,
                height: 1555
            },
            ariaLabel: "Open Lijiang collection",
            meta: "December 2025 / Nikon Z9",
            title: "Lijiang",
            description: "Blue Moon Valley and Jade Dragon Snow Mountain shaped into a short, spare winter sequence.",
            linkText: "Open series"
        },
        {
            id: "more",
            number: "06",
            href: "archive.html",
            className: "collection-entry--more",
            image: {
                src: "images/iphone1.webp",
                alt: "Ocean sunset photographed on iPhone",
                width: 3000,
                height: 2250
            },
            ariaLabel: "Open More Photos",
            meta: "More Photos / Future edits",
            title: "More work and future plans.",
            description: "Shot on iPhone, future fieldwork, and smaller experiments live here without interrupting the main travel sequence.",
            linkText: "Browse more"
        }
    ];

    const createElement = (tag, className, text) => {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text) {
            element.textContent = text;
        }

        return element;
    };

    const renderCollectionCard = (collection) => {
        const article = createElement("article", `collection-entry ${collection.className || ""}`.trim());
        article.dataset.collectionEntry = "";

        if (collection.preview) {
            article.dataset.preview = collection.preview;
        }

        article.appendChild(createElement("div", "collection-entry__number", collection.number));

        const visual = createElement("a", "collection-entry__visual");
        visual.href = collection.href;
        visual.setAttribute("aria-label", collection.ariaLabel);

        const image = document.createElement("img");
        image.src = collection.image.src;
        image.alt = collection.image.alt;
        image.width = collection.image.width;
        image.height = collection.image.height;
        image.loading = "lazy";
        image.decoding = "async";
        visual.appendChild(image);
        article.appendChild(visual);

        const copy = createElement("div", "collection-entry__copy");
        copy.appendChild(createElement("p", "collection-entry__meta", collection.meta));
        copy.appendChild(createElement("h3", "", collection.title));
        copy.appendChild(createElement("p", "", collection.description));

        const link = createElement("a", "collection-entry__link", collection.linkText);
        link.href = collection.href;
        copy.appendChild(link);
        article.appendChild(copy);

        return article;
    };

    const renderCollections = () => {
        const board = document.querySelector("[data-collection-board]");

        if (!board) {
            return;
        }

        board.replaceChildren(...collections.map(renderCollectionCard));

        const count = document.querySelector("[data-collection-count]");

        if (count) {
            count.textContent = String(collections.length).padStart(2, "0");
        }
    };

    window.gallerywCollections = collections;
    document.addEventListener("DOMContentLoaded", renderCollections);
})();
