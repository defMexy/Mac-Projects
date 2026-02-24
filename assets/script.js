/* MAC Projects — minimal JS
   - Mobile nav toggle
   - Header elevate on scroll
   - Portfolio filter
   - Contact form success state (front-end only)
   - Footer year
*/

(function () {
    const qs = (s, el = document) => el.querySelector(s);
    const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

    // Footer year
    const yearEl = qs("[data-year]");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // Header elevate
    const header = qs("[data-header]");
    const onScroll = () => {
        if (!header) return;
        header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Mobile nav
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

    // Portfolio filtering
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

    // Contact form (front-end success only)
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