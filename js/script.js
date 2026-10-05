document.addEventListener("DOMContentLoaded", function () {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---------- Toast ----------
    const toast = document.createElement("div");
    toast.className = "toast-msg";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
    let toastTimer;

    function showToast(message, type) {
        toast.textContent = message;
        toast.classList.toggle("is-info", type === "info");
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove("is-visible");
        }, 3500);
    }

    // ---------- Header: scrolled state + mobile menu ----------
    const header = document.querySelector(".header");
    const nav = document.getElementById("main-nav");
    const navToggle = document.querySelector(".nav-toggle");

    function setNavOpen(open) {
        if (!nav || !navToggle) return;
        nav.classList.toggle("is-open", open);
        navToggle.setAttribute("aria-expanded", String(open));
        navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        document.body.classList.toggle("nav-open", open);
    }

    if (navToggle) {
        navToggle.addEventListener("click", function () {
            setNavOpen(!nav.classList.contains("is-open"));
        });
        nav.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                setNavOpen(false);
            });
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && nav.classList.contains("is-open")) {
                setNavOpen(false);
                navToggle.focus();
            }
        });
        window.addEventListener("resize", function () {
            if (window.innerWidth >= 992) setNavOpen(false);
        });
    }

    // ---------- Back to top ----------
    const backToTopBtn = document.createElement("button");
    backToTopBtn.innerHTML = "&#8679;";
    backToTopBtn.id = "back-to-top";
    backToTopBtn.setAttribute("aria-label", "Back to top");
    document.body.appendChild(backToTopBtn);

    backToTopBtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

    // On phones, tablets and touch screens the button only appears while scrolling up,
    // so it never sits on top of content buttons
    const isPhone = window.matchMedia("(max-width: 991.98px), (hover: none)");
    let lastY = window.scrollY;

    function onScroll() {
        const y = window.scrollY;
        if (header) header.classList.toggle("is-scrolled", y > 10);
        const scrollingUp = y < lastY - 2;
        const scrollingDown = y > lastY + 2;
        if (y <= 400 || (isPhone.matches && scrollingDown)) {
            backToTopBtn.classList.remove("visible");
        } else if (!isPhone.matches || scrollingUp) {
            backToTopBtn.classList.add("visible");
        }
        lastY = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // ---------- Scroll reveal ----------
    const revealSelectors = [
        ".section-head", ".section-title", ".nft-card", ".step-card", ".value-card",
        ".mission-card", ".team-card", ".stat-card", ".timeline-item", ".progress-card",
        ".about-image", ".about-content", ".contact-form-wrapper", ".contact-info-wrapper",
        ".accordion-item", ".cta-box"
    ].join(",");

    const hasObserver = "IntersectionObserver" in window;

    if (hasObserver && !reduceMotion) {
        const revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

        document.querySelectorAll(revealSelectors).forEach(function (el) {
            // Animate the grid column instead of the card so hover transforms stay untouched
            const parent = el.parentElement;
            const target = parent && /\bcol-/.test(parent.className) ? parent : el;
            if (target.classList.contains("reveal")) return;
            const index = Array.prototype.indexOf.call(target.parentElement.children, target);
            target.style.setProperty("--reveal-delay", (index % 4) * 90 + "ms");
            target.classList.add("reveal");
            revealObserver.observe(target);
        });
    }

    // Run a callback once an element scrolls into view
    function onVisible(elements, callback) {
        if (!hasObserver) {
            elements.forEach(callback);
            return;
        }
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        elements.forEach(function (el) { observer.observe(el); });
    }

    // ---------- Animated counters ----------
    const counters = document.querySelectorAll("[data-count]");
    onVisible(counters, function (el) {
        const target = parseFloat(el.dataset.count);
        const prefix = el.dataset.prefix || "";
        const suffix = el.dataset.suffix || "";
        if (reduceMotion) return;
        const duration = 1600;
        const start = performance.now();
        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = prefix + Math.round(target * eased) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    });

    // ---------- Progress bars ----------
    const progressFills = document.querySelectorAll(".progress-fill");
    if (!reduceMotion && hasObserver) {
        progressFills.forEach(function (fill) {
            fill.dataset.width = fill.style.width;
            fill.style.width = "0";
        });
        onVisible(progressFills, function (fill) {
            fill.style.width = fill.dataset.width;
        });
    }

    // ---------- Auction countdown ----------
    document.querySelectorAll("[data-countdown]").forEach(function (el) {
        const end = Date.now() + parseInt(el.dataset.countdown, 10) * 1000;
        function pad(n) { return String(n).padStart(2, "0"); }
        function update() {
            const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
            const h = Math.floor(left / 3600);
            const m = Math.floor((left % 3600) / 60);
            const s = left % 60;
            el.textContent = pad(h) + "h " + pad(m) + "m " + pad(s) + "s";
            if (left > 0) setTimeout(update, 1000);
        }
        update();
    });

    // ---------- Explore: filter + search ----------
    const grid = document.getElementById("nft-grid");
    if (grid) {
        const cols = grid.querySelectorAll(".nft-col");
        const filterBtns = document.querySelectorAll(".filter-btn");
        const searchInput = document.getElementById("nft-search");
        const countEl = document.getElementById("results-count");
        const emptyState = document.getElementById("empty-state");
        let activeFilter = "all";

        function applyFilters() {
            const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
            let shown = 0;
            cols.forEach(function (col) {
                const matchesCategory = activeFilter === "all" || col.dataset.category === activeFilter;
                const matchesQuery = !query || col.textContent.toLowerCase().includes(query);
                const visible = matchesCategory && matchesQuery;
                col.classList.toggle("is-hidden", !visible);
                if (visible) shown++;
            });
            if (countEl) countEl.textContent = "Showing " + shown + " of " + cols.length + " drops";
            if (emptyState) emptyState.classList.toggle("is-visible", shown === 0);
        }

        filterBtns.forEach(function (btn) {
            btn.addEventListener("click", function () {
                filterBtns.forEach(function (b) {
                    b.classList.remove("active");
                    b.setAttribute("aria-pressed", "false");
                });
                btn.classList.add("active");
                btn.setAttribute("aria-pressed", "true");
                activeFilter = btn.dataset.filter;
                applyFilters();
                // keep the chosen chip in view inside the swipeable chip row on phones
                btn.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
            });
        });

        if (searchInput) searchInput.addEventListener("input", applyFilters);

        const resetBtn = document.getElementById("reset-filters");
        if (resetBtn) {
            resetBtn.addEventListener("click", function () {
                if (searchInput) searchInput.value = "";
                filterBtns[0].click();
            });
        }

        applyFilters();
    }

    // ---------- Like buttons ----------
    document.querySelectorAll(".like-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            const liked = btn.getAttribute("aria-pressed") === "true";
            const countEl = btn.querySelector("span");
            const count = parseInt(countEl.textContent, 10);
            btn.setAttribute("aria-pressed", String(!liked));
            countEl.textContent = liked ? count - 1 : count + 1;
        });
    });

    // ---------- Placeholder actions (wallet-gated) ----------
    document.querySelectorAll("[data-toast]").forEach(function (el) {
        el.addEventListener("click", function (e) {
            e.preventDefault();
            showToast(el.dataset.toast, "info");
        });
    });

    // ---------- Form validation ----------
    function setError(input, message) {
        const error = input.closest(".form-group, .form-check").querySelector(".field-error");
        input.classList.toggle("has-error", Boolean(message));
        input.setAttribute("aria-invalid", message ? "true" : "false");
        if (error) error.textContent = message || "";
    }

    function validateField(input) {
        let message = "";
        const value = input.type === "checkbox" ? input.checked : input.value.trim();
        if (input.required && !value) {
            message = input.type === "checkbox" ? "Please accept to continue." : "This field is required.";
        } else if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            message = "Please enter a valid email address.";
        } else if (input.minLength > 0 && value && value.length < input.minLength) {
            message = "Must be at least " + input.minLength + " characters.";
        } else if (input.dataset.match) {
            const other = document.getElementById(input.dataset.match);
            if (other && value !== other.value) message = "Passwords do not match.";
        }
        setError(input, message);
        return !message;
    }

    document.querySelectorAll("form[data-validate]").forEach(function (form) {
        const fields = form.querySelectorAll("input, textarea, select");

        fields.forEach(function (field) {
            field.addEventListener("blur", function () {
                if (field.value || field.classList.contains("has-error")) validateField(field);
            });
            field.addEventListener("input", function () {
                if (field.classList.contains("has-error")) validateField(field);
            });
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            let firstInvalid = null;
            fields.forEach(function (field) {
                if (!validateField(field) && !firstInvalid) firstInvalid = field;
            });
            if (firstInvalid) {
                firstInvalid.focus();
                return;
            }

            const submitBtn = form.querySelector("[type=submit]");
            const original = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Sending…</span>';

            // Simulated request — swap for a real endpoint when the backend is ready
            setTimeout(function () {
                submitBtn.disabled = false;
                submitBtn.innerHTML = original;
                form.reset();
                const strength = form.querySelector(".password-strength");
                if (strength) strength.dataset.level = "0";
                showToast(form.dataset.success || "Thanks! We'll be in touch soon.");
            }, 1200);
        });
    });

    // ---------- Password helpers ----------
    document.querySelectorAll(".password-toggle").forEach(function (btn) {
        btn.addEventListener("click", function () {
            const input = btn.parentElement.querySelector("input");
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            btn.textContent = show ? "Hide" : "Show";
            btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
        });
    });

    const passwordInput = document.getElementById("password");
    const strengthMeter = document.querySelector(".password-strength");
    if (passwordInput && strengthMeter) {
        passwordInput.addEventListener("input", function () {
            const v = passwordInput.value;
            let level = 0;
            if (v.length >= 8) level++;
            if (/[A-Z]/.test(v) && /[a-z]/.test(v)) level++;
            if (/\d/.test(v)) level++;
            if (/[^A-Za-z0-9]/.test(v)) level++;
            strengthMeter.dataset.level = v ? Math.max(level, 1) : 0;
        });
    }

    // ---------- Newsletter ----------
    document.querySelectorAll(".newsletter").forEach(function (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            const input = form.querySelector("input");
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
                showToast("Please enter a valid email address.", "info");
                input.focus();
                return;
            }
            form.reset();
            showToast("You're subscribed! Watch your inbox every Friday.");
        });
    });

    // ---------- Footer year ----------
    document.querySelectorAll("[data-year]").forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });
});
