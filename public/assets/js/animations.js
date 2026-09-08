document.addEventListener("DOMContentLoaded", function () {
    const loadElements = Array.from(document.querySelectorAll(".animate-on-load"));
    loadElements.forEach((el, index) => {
        el.style.transitionDelay = `${index * 120}ms`;
    });

    requestAnimationFrame(() => {
        loadElements.forEach((el) => el.classList.add("visible"));
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
        observer.observe(el);
    });

    if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target) {
            setTimeout(() => {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 80);
        }
    }

    document.querySelectorAll('a[href]').forEach((link) => {
        const href = link.getAttribute("href");
        if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
            return;
        }

        const targetUrl = new URL(href, window.location.href);
        if (targetUrl.origin !== window.location.origin) {
            return;
        }

        if (targetUrl.hash && targetUrl.pathname === window.location.pathname) {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                const target = document.querySelector(targetUrl.hash);
                if (target) {
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                    history.replaceState(null, "", targetUrl.hash);
                }
            });
            return;
        }

        if (targetUrl.pathname !== window.location.pathname || targetUrl.hash) {
            link.addEventListener("click", (event) => {
                if (link.target && link.target !== "_self") {
                    return;
                }
                if (href === "#" || href === "") {
                    return;
                }
                event.preventDefault();
                document.body.classList.add("page-transition-exit");
                setTimeout(() => {
                    window.location.href = link.href;
                }, 220);
            });
        }
    });
});
