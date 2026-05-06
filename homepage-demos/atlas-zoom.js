const nodes = [...document.querySelectorAll(".atlas-zoom-node")];
const steps = [...document.querySelectorAll(".atlas-scroll-step")];
const dots = [...document.querySelectorAll(".atlas-zoom-progress span")];

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function easeInOutSine(value) {
  return -(Math.cos(Math.PI * value) - 1) / 2;
}

function updateAtlasZoom() {
  const viewportCenter = window.innerHeight / 2;
  let activeIndex = 0;
  let bestDistance = Infinity;

  steps.forEach((step, index) => {
    const rect = step.getBoundingClientRect();
    const sectionProgress = clamp((viewportCenter - rect.top) / rect.height);
    const expandThenCollapse = 1 - Math.abs(sectionProgress - 0.5) * 2;
    const progress = easeInOutSine(clamp(expandThenCollapse));
    const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);

    nodes[index].style.setProperty("--progress", progress.toFixed(3));
    nodes[index].classList.toggle("is-active", progress > 0.45);

    if (distance < bestDistance) {
      bestDistance = distance;
      activeIndex = index;
    }
  });

  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === activeIndex);
  });

  requestAnimationFrame(updateAtlasZoom);
}

updateAtlasZoom();
