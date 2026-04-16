(function () {
    const qs = (s, el = document) => el.querySelector(s);
    const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

    const yearEl = qs("[data-year]");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    const header = qs("[data-header]");
    const onScroll = () => {
        if (!header) return;
        header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const toggle = qs("[data-nav-toggle]");
    const navList = qs("[data-nav-list]");
    if (toggle && navList) {
        const closeNav = () => {
            navList.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Open menu");
        };
        const openNav = () => {
            navList.classList.add("is-open");
            toggle.setAttribute("aria-expanded", "true");
            toggle.setAttribute("aria-label", "Sluit menu");
        };

        toggle.addEventListener("click", () => {
            const isOpen = navList.classList.contains("is-open");
            if (isOpen) closeNav();
            else openNav();
        });

        document.addEventListener("click", (e) => {
            const t = e.target;
            if (!(t instanceof Element)) return;
            const inside = navList.contains(t) || toggle.contains(t);
            if (!inside && navList.classList.contains("is-open")) closeNav();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && navList.classList.contains("is-open")) closeNav();
        });
    }

    const chips = qsa("[data-filter]");
    const grid = qs("[data-case-grid]");
    if (chips.length && grid) {
        const cards = qsa(".case-card", grid);

        const setActive = (btn) => {
            chips.forEach((b) => {
                const active = b === btn;
                b.classList.toggle("is-active", active);
                b.setAttribute("aria-pressed", active ? "true" : "false");
            });
        };

        const apply = (filter) => {
            cards.forEach((card) => {
                const tags = (card.getAttribute("data-tags") || "").toLowerCase().trim().split(/\s+/);
                const show = filter === "all" ? true : tags.includes(filter);
                card.style.display = show ? "" : "none";
            });
        };

        chips.forEach((btn) => {
            btn.addEventListener("click", () => {
                const filter = btn.getAttribute("data-filter") || "all";
                setActive(btn);
                apply(filter);
            });
        });
    }

    const form = qs("[data-contact-form]");
    const status = qs("[data-form-status]");
    if (form && status) {
        const show = (type, msg) => {
            status.className = "form-status is-visible " + (type === "success" ? "is-success" : "is-error");
            status.textContent = msg;
        };

        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const required = qsa("[required]", form);
            const invalid = required.some((el) => !el.checkValidity());

            if (invalid) {
                show("error", "Vul de verplichte velden in. Dan kunnen we direct gericht reageren.");
                const firstInvalid = required.find((el) => !el.checkValidity());
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            form.reset();
            show("success", "Dank je. Ontvangen. We reageren binnen 1–2 werkdagen met gerichte vragen of een voorstel voor de volgende stap.");
        });
    }
})();

(function () {
    const qs = (s, el = document) => el.querySelector(s);
    const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

    const modal = qs("[data-modal]");
    if (!modal) return;

    const dialog = qs(".modal-dialog", modal);
    const imgEl = qs("[data-modal-image]", modal);
    const titleEl = qs("[data-modal-title]", modal);
    const locEl = qs("[data-modal-location]", modal);
    const typeEl = qs("[data-modal-type]", modal);
    const idxEl = qs("[data-index]", modal);
    const totalEl = qs("[data-total]", modal);
    const thumbsWrap = qs("[data-thumbs]", modal);
    const thumbsViewport = qs(".thumbs-viewport", modal);

    const btnPrev = qs("[data-prev]", modal);
    const btnNext = qs("[data-next]", modal);
    const btnClose = qsa("[data-close-modal]", modal);
    const btnFs = qs("[data-fullscreen]", modal);

    const thumbsPrev = qs("[data-thumbs-prev]", modal);
    const thumbsNext = qs("[data-thumbs-next]", modal);

    let images = [];
    let index = 0;
    let lastFocus = null;

    const lockScroll = (lock) => {
        document.documentElement.style.overflow = lock ? "hidden" : "";
        document.body.style.overflow = lock ? "hidden" : "";
    };

    const parseImages = (str) =>
        (str || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

    const setActiveThumb = () => {
        const thumbs = qsa(".thumb", thumbsWrap);
        thumbs.forEach((t, i) => t.classList.toggle("is-active", i === index));

        const active = thumbs[index];
        if (active) {
            active.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center"
            });
        }
    };

    const updateThumbButtons = () => {
        if (!thumbsViewport) return;

        const maxScroll = thumbsViewport.scrollWidth - thumbsViewport.clientWidth;
        const atStart = thumbsViewport.scrollLeft <= 4;
        const atEnd = thumbsViewport.scrollLeft >= maxScroll - 4;

        if (thumbsPrev) thumbsPrev.disabled = atStart;
        if (thumbsNext) thumbsNext.disabled = atEnd || maxScroll <= 0;
    };

    const scrollThumbsByPage = (direction) => {
        if (!thumbsViewport) return;

        const amount = thumbsViewport.clientWidth * 0.8;
        thumbsViewport.scrollBy({
            left: direction * amount,
            behavior: "smooth"
        });

        window.setTimeout(updateThumbButtons, 350);
    };

    const renderThumbs = () => {
        thumbsWrap.innerHTML = "";

        images.forEach((src, i) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "thumb" + (i === index ? " is-active" : "");
            b.setAttribute("aria-label", `Ga naar foto ${i + 1}`);
            b.innerHTML = `<img src="${src}" alt="" loading="lazy" decoding="async">`;

            b.addEventListener("click", () => {
                index = i;
                render();
            });

            thumbsWrap.appendChild(b);
        });

        window.requestAnimationFrame(() => {
            if (thumbsViewport) thumbsViewport.scrollLeft = 0;
            updateThumbButtons();
        });
    };

    const updateNavState = () => {
        btnPrev.disabled = images.length <= 1;
        btnNext.disabled = images.length <= 1;
    };

    const render = () => {
        if (!images.length) return;

        imgEl.style.animation = "none";
        imgEl.getBoundingClientRect();
        imgEl.style.animation = "";

        imgEl.src = images[index];
        imgEl.alt = `${titleEl.textContent || "Case"}, foto ${index + 1} van ${images.length}`;
        idxEl.textContent = String(index + 1);
        totalEl.textContent = String(images.length);

        setActiveThumb();
        updateNavState();
    };

    const openModal = (card) => {
        lastFocus = document.activeElement;

        const title = card.getAttribute("data-title") || "Case";
        const loc = card.getAttribute("data-location") || "";
        const type = card.getAttribute("data-type") || "";
        images = parseImages(card.getAttribute("data-images"));
        index = 0;

        titleEl.textContent = title;
        locEl.textContent = loc;
        typeEl.textContent = type || "•";

        renderThumbs();
        render();

        modal.hidden = false;
        lockScroll(true);

        dialog.setAttribute("tabindex", "-1");
        window.setTimeout(() => dialog.focus?.(), 0);
    };

    const closeModal = async () => {
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (_) {
            }
        }

        modal.hidden = true;
        lockScroll(false);

        if (lastFocus && typeof lastFocus.focus === "function") {
            lastFocus.focus();
        }
    };

    const next = () => {
        if (!images.length) return;
        index = (index + 1) % images.length;
        render();
    };

    const prev = () => {
        if (!images.length) return;
        index = (index - 1 + images.length) % images.length;
        render();
    };

    qsa("[data-open-gallery]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const card = btn.closest("[data-gallery]");
            if (card) openModal(card);
        });
    });

    btnClose.forEach((b) => b.addEventListener("click", closeModal));
    qs(".modal-backdrop", modal)?.addEventListener("click", closeModal);

    btnNext.addEventListener("click", next);
    btnPrev.addEventListener("click", prev);

    thumbsPrev?.addEventListener("click", () => {
        scrollThumbsByPage(-1);
    });

    thumbsNext?.addEventListener("click", () => {
        scrollThumbsByPage(1);
    });

    thumbsViewport?.addEventListener("scroll", updateThumbButtons, { passive: true });

    document.addEventListener("keydown", (e) => {
        if (modal.hidden) return;

        if (e.key === "Escape") closeModal();
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
    });

    btnFs?.addEventListener("click", async () => {
        try {
            if (!document.fullscreenElement) await dialog.requestFullscreen();
            else await document.exitFullscreen();
        } catch (_) {
        }
    });

    let startX = 0;
    let startY = 0;
    let active = false;

    const onStart = (x, y) => {
        startX = x;
        startY = y;
        active = true;
    };

    const onEnd = (x, y) => {
        if (!active) return;
        active = false;

        const dx = x - startX;
        const dy = y - startY;

        if (Math.abs(dx) > 40 && Math.abs(dy) < 40) {
            if (dx < 0) next();
            else prev();
        }
    };

    dialog.addEventListener("touchstart", (e) => {
        if (modal.hidden) return;
        const t = e.touches[0];
        if (t) onStart(t.clientX, t.clientY);
    }, { passive: true });

    dialog.addEventListener("touchend", (e) => {
        if (modal.hidden) return;
        const t = e.changedTouches[0];
        if (t) onEnd(t.clientX, t.clientY);
    }, { passive: true });

    window.addEventListener("resize", () => {
        if (modal.hidden) return;
        updateThumbButtons();
    });
})();

(function () {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const qs  = (s, el = document) => el.querySelector(s);
    const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

    const mark = (el, delay) => {
        if (!el || el.hasAttribute("data-anim")) return;
        el.setAttribute("data-anim", "");
        if (delay) el.style.transitionDelay = delay + "s";
    };

    const stagger = (parentSel, childSel, step) => {
        qsa(parentSel).forEach(parent => {
            qsa(":scope > " + childSel, parent).forEach((el, i) => mark(el, i * step));
        });
    };

    stagger(".grid",      ".card",      0.09);
    stagger(".grid",      ".case",      0.09);
    stagger(".case-grid", ".case-card", 0.09);
    stagger(".faq",       ".faq-item",  0.07);
    stagger(".steps",     "li",         0.08);

    [".section-head", ".cta-row", ".form-wrap"].forEach(sel => {
        qsa(sel).forEach(el => mark(el, 0));
    });

    [
        [".hero-topline",        0.00],
        [".hero-editorial-copy", 0.13],
        [".hero-rail-card",      0.22],
    ].forEach(([sel, delay]) => qsa(sel).forEach(el => mark(el, delay)));

    [
        [".page-hero .kicker",  0.00],
        [".page-hero h1",       0.10],
        [".page-hero .lead",    0.20],
        [".page-hero .filters", 0.30],
        [".page-hero .mt",      0.30],
    ].forEach(([sel, delay]) => qsa(sel).forEach(el => mark(el, delay)));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.07, rootMargin: "0px 0px -40px 0px" });

    qsa("[data-anim]").forEach(el => {
        if (el.closest(".hero-editorial, .page-hero")) {
            requestAnimationFrame(() => setTimeout(() => el.classList.add("is-visible"), 60));
        } else {
            observer.observe(el);
        }
    });
})();