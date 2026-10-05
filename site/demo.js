// The hero switch (flips once on its own the first time it's seen) and the corner-size picker.
const demo = document.querySelector("[data-demo]");
const toggle = demo.querySelector('[role="switch"]');
const set = (on) => {
  demo.dataset.on = on;
  toggle.setAttribute("aria-checked", on);
};
toggle.addEventListener("click", () => set(demo.dataset.on !== "true"));

if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  set(true); // show the result without animating it
} else {
  const seen = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    seen.disconnect();
    setTimeout(() => set(true), 900);
  }, { threshold: 0.6 });
  seen.observe(demo.querySelector(".laptop"));
}

for (const button of document.querySelectorAll("[data-radius]")) {
  button.addEventListener("click", () => {
    const cell = button.closest("[data-corners]");
    cell.style.setProperty("--r", button.dataset.radius);
    for (const other of cell.querySelectorAll("[data-radius]")) other.setAttribute("aria-pressed", other === button);
  });
}
