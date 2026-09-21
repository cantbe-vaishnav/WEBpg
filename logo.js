const orbit = document.querySelector(".logo-orbit");
const grain = document.querySelector(".grain-cursor");

window.addEventListener("pointermove", (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;

    if (grain) {
        grain.style.left = `${event.clientX}px`;
        grain.style.top = `${event.clientY}px`;
    }

    if (!orbit) return;
    orbit.style.setProperty("--logo-rx", `${y * -28}deg`);
    orbit.style.setProperty("--logo-ry", `${x * 34}deg`);
    orbit.style.setProperty("--logo-tx", `${x * 28}px`);
    orbit.style.setProperty("--logo-ty", `${y * 24}px`);
});

window.addEventListener("pointerleave", () => {
    if (!orbit) return;
    orbit.style.setProperty("--logo-rx", "0deg");
    orbit.style.setProperty("--logo-ry", "0deg");
    orbit.style.setProperty("--logo-tx", "0px");
    orbit.style.setProperty("--logo-ty", "0px");
});
