const toast = document.querySelector(".toast");
const navLinks = [...document.querySelectorAll(".nav-links a")];
const sections = [...document.querySelectorAll("section[id]")];
const nameWarp = document.querySelector(".name-warp");
const textureBrush = document.querySelector(".texture-brush");
const logoTrigger = document.querySelector("[data-logo-trigger]");

let textureTimeout;
let logoClicks = 0;
let logoClickTimeout;

if (logoTrigger) {
    logoTrigger.addEventListener("click", (event) => {
        logoClicks += 1;
        window.clearTimeout(logoClickTimeout);

        if (logoClicks >= 3) {
            event.preventDefault();
            window.location.href = "logo.html";
            return;
        }

        logoClickTimeout = window.setTimeout(() => {
            logoClicks = 0;
        }, 520);
    });
}

window.addEventListener("pointermove", (event) => {
    if (!textureBrush) return;
    textureBrush.style.left = `${event.clientX}px`;
    textureBrush.style.top = `${event.clientY}px`;
    textureBrush.classList.add("is-moving");
    window.clearTimeout(textureTimeout);
    textureTimeout = window.setTimeout(() => {
        textureBrush.classList.remove("is-moving");
    }, 180);
});

if (nameWarp) {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const lines = [...nameWarp.querySelectorAll('.name-line')];
    lines.forEach(line => {
        const text = line.dataset.text || line.textContent.trim();
        line.textContent = '';
        [...text].forEach(character => {
            const span = document.createElement('span');
            span.className = 'name-char';
            span.textContent = character === ' ' ? '\u00A0' : character;
            span.dataset.glyph = span.textContent;
            span.setAttribute('aria-hidden', 'true');
            line.appendChild(span);
        });
    });
    const letters = [...nameWarp.querySelectorAll('.name-char')].map(el => ({el, x:0, y:0, z:0, rx:0, ry:0}));
    // Mask the backdrop blur to each real glyph, including its counters (holes).
    function updateGlassMasks() {
        const masks = new Map();
        letters.forEach(({el}) => {
            const style = getComputedStyle(el);
            const width = el.offsetWidth, height = el.offsetHeight;
            if (!width || !height) return;
            const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            const key = `${el.dataset.glyph}/${font}/${width}/${height}`;
            if (!masks.has(key)) {
                const scale = Math.min(devicePixelRatio || 1, 2);
                const canvas = document.createElement('canvas');
                canvas.width = Math.ceil(width * scale);
                canvas.height = Math.ceil(height * scale);
                const ctx = canvas.getContext('2d');
                ctx.scale(scale, scale);
                ctx.font = font;
                const metrics = ctx.measureText(el.dataset.glyph);
                const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * .8;
                const descent = metrics.fontBoundingBoxDescent ?? parseFloat(style.fontSize) * .2;
                ctx.fillStyle = '#fff';
                ctx.fillText(el.dataset.glyph, 0, (height - ascent - descent) / 2 + ascent);
                masks.set(key, `url("${canvas.toDataURL()}")`);
            }
            el.style.setProperty('--glyph-mask', masks.get(key));
        });
    }
    new ResizeObserver(updateGlassMasks).observe(nameWarp);
    document.fonts.ready.then(updateGlassMasks);
    updateGlassMasks();
    let pointer = null, frameId = 0, previousTime = 0;
    function animate(now) {
        const dt = Math.min((now - previousTime) / 1000 || 1/60, .05);
        previousTime = now;
        const ease = 1 - Math.exp(-12 * dt);
        const rect = nameWarp.getBoundingClientRect();
        // Read stable layout positions first; transformed glyph bounds cause jitter.
        const targets = letters.map(({el}) => {
            if (!pointer || reducedMotion.matches) return {x:0,y:0,z:0,rx:0,ry:0};
            const line = el.parentElement;
            const dx = pointer.x - rect.left - line.offsetLeft - el.offsetLeft - el.offsetWidth/2;
            const dy = pointer.y - rect.top - line.offsetTop - el.offsetTop - el.offsetHeight/2;
            const strength = Math.exp(-(dx*dx+dy*dy)/(2*115*115));
            return {x:-dx*.07*strength,y:-10*strength,z:48*strength,rx:-dy*.12*strength,ry:dx*.12*strength};
        });
        let moving = false;
        letters.forEach((letter, i) => {
            for (const axis of ['x','y','z','rx','ry']) {
                letter[axis] += (targets[i][axis] - letter[axis]) * ease;
                if (Math.abs(targets[i][axis] - letter[axis]) > .025) moving = true;
            }
            const st = letter.el.style;
            st.setProperty('--tx',`${letter.x.toFixed(3)}px`);
            st.setProperty('--ty',`${letter.y.toFixed(3)}px`);
            st.setProperty('--tz',`${letter.z.toFixed(3)}px`);
            st.setProperty('--rx',`${letter.rx.toFixed(3)}deg`);
            st.setProperty('--ry',`${letter.ry.toFixed(3)}deg`);
            st.setProperty('--shine',`${45+letter.ry*2}%`);
            st.setProperty('--glass-light', `${(.15+letter.z/160).toFixed(3)}`);
            st.setProperty('--glass-blur', `${(2.5+letter.z/32).toFixed(2)}px`);
        });
        frameId = moving ? requestAnimationFrame(animate) : 0;
    }
    function schedule() { if (!frameId) { previousTime = performance.now(); frameId = requestAnimationFrame(animate); } }
    function settle() { pointer = null; schedule(); }
    nameWarp.addEventListener('pointermove', event => {
        if (reducedMotion.matches) return;
        pointer = {x:event.clientX,y:event.clientY}; schedule();
    });
    nameWarp.addEventListener('pointerleave', settle);
    nameWarp.addEventListener('pointercancel', settle);
    nameWarp.addEventListener('pointerup', event => { if (event.pointerType !== 'mouse') settle(); });
    window.addEventListener('blur', settle);
    window.addEventListener('scroll', settle, {passive:true});
    reducedMotion.addEventListener('change', settle);
}

const contactDotPositions = [[17,22],[28,15],[79,25],[86,61],[69,82],[20,75],[13,48]];

document.querySelectorAll('.signal-action').forEach(card => {
    const cluster = document.createElement('span');
    cluster.className = 'signal-dots';
    cluster.setAttribute('aria-hidden', 'true');
    contactDotPositions.forEach(([x,y]) => {
        const dot = document.createElement('i');
        dot.className = 'signal-dot';
        dot.style.setProperty('--dot-left', `${x}%`);
        dot.style.setProperty('--dot-top', `${y}%`);
        dot.dataset.x = x;
        dot.dataset.y = y;
        cluster.appendChild(dot);
    });
    card.appendChild(cluster);
});

document.querySelectorAll('.stack-items span, .signal-action').forEach(card => {
    function moveGlass(event) {
        const rect = card.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
        card.style.setProperty('--rx', `${((.5 - y) * 8).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${((x - .5) * 10).toFixed(2)}deg`);
        card.classList.add('is-hovered');

        card.querySelectorAll('.signal-dot').forEach(dot => {
            const dotX = Number(dot.dataset.x) / 100 * rect.width;
            const dotY = Number(dot.dataset.y) / 100 * rect.height;
            const dx = dotX - (event.clientX - rect.left);
            const dy = dotY - (event.clientY - rect.top);
            const distance = Math.max(Math.hypot(dx, dy), 1);
            const force = Math.max(0, 1 - distance / 92) * 15;
            dot.style.setProperty('--dot-x', `${(dx / distance * force).toFixed(2)}px`);
            dot.style.setProperty('--dot-y', `${(dy / distance * force).toFixed(2)}px`);
        });
    }

    function resetGlass() {
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '50%');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
        card.classList.remove('is-hovered');
        card.querySelectorAll('.signal-dot').forEach(dot => {
            dot.style.setProperty('--dot-x', '0px');
            dot.style.setProperty('--dot-y', '0px');
        });
    }

    card.addEventListener('pointermove', moveGlass);
    card.addEventListener('pointerleave', resetGlass);
    card.addEventListener('pointercancel', resetGlass);
    card.addEventListener('blur', resetGlass);
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
            link.classList.toggle("active", link.hash === `#${entry.target.id}`);
        });
    });
}, { rootMargin: "-38% 0px -52% 0px" });

sections.forEach((section) => observer.observe(section));

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
    });
}, { threshold: 0.16 });

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

function flashToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(flashToast.timeout);
    flashToast.timeout = window.setTimeout(() => {
        toast.classList.remove("visible");
    }, 1700);
}

document.querySelectorAll("[data-copy]").forEach((control) => {
    control.addEventListener("click", async () => {
        const value = control.dataset.copy;
        try {
            await navigator.clipboard.writeText(value);
            flashToast("Copied");
        } catch {
            flashToast(value);
        }
    });
});

document.querySelectorAll("[data-project-link]").forEach((link) => {
    const storageKey = `project-link-${link.dataset.projectLink}`;
    let savedUrl = null;

    try {
        savedUrl = localStorage.getItem(storageKey);
    } catch {
        savedUrl = null;
    }

    const applyProjectUrl = (url) => {
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener";
        link.classList.remove("project-link-placeholder");
        link.innerHTML = 'Open live link <span>↗</span>';
    };

    if (savedUrl) applyProjectUrl(savedUrl);

    link.addEventListener("click", (event) => {
        if (!link.classList.contains("project-link-placeholder")) return;
        event.preventDefault();

        const input = window.prompt("Paste the hosted project URL");
        if (!input) return;

        let url;
        try {
            url = new URL(input.startsWith("http") ? input : `https://${input}`);
        } catch {
            flashToast("Enter a valid URL");
            return;
        }

        if (!/^https?:$/.test(url.protocol)) {
            flashToast("Enter a web URL");
            return;
        }

        try {
            localStorage.setItem(storageKey, url.href);
        } catch {
            // The link still works for the current session if storage is unavailable.
        }
        applyProjectUrl(url.href);
        flashToast("Live link added");
    });
});
