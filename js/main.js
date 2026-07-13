/* Shared Interactive Logic for Lumina Digital Agency Website */

document.addEventListener("DOMContentLoaded", () => {
    initHeaderScroll();
    initActiveNavLinks();
    initMoreDropdown();
    initMobileMenu();
    initScrollReveal();
    initSmoothAnchors();
    initSettingsSync();
    initContentSync();
});

/* ── 1. Header scroll effect ─────────────────────────────────────────── */
function initHeaderScroll() {
    const nav = document.querySelector("nav");
    if (!nav) return;
    window.addEventListener("scroll", () => {
        if (window.scrollY > 20) {
            nav.classList.add("shadow-2xl", "bg-slate-950/80");
        } else {
            nav.classList.remove("shadow-2xl", "bg-slate-950/80");
        }
    });
}

/* ── 2. Active page link highlight ───────────────────────────────────── */
function initActiveNavLinks() {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("nav a").forEach(link => {
        const href = link.getAttribute("href");
        if (href === currentPath || (currentPath === "index.html" && href === "#")) {
            link.classList.remove("text-slate-300", "text-slate-400");
            link.classList.add("text-sky-300", "font-bold", "!border-b-2", "!border-sky-300");
        }
    });
}

/* ── 3. "More" dropdown (desktop) ────────────────────────────────────── */
function initMoreDropdown() {
    const btn   = document.getElementById("more-dropdown-btn");
    const panel = document.getElementById("more-dropdown-panel");
    const icon  = document.getElementById("more-dropdown-icon");
    if (!btn || !panel) return;

    let open = false;

    const show = () => {
        open = true;
        panel.classList.remove("hidden");
        // tiny rAF so transition fires
        requestAnimationFrame(() => {
            panel.classList.remove("opacity-0", "translate-y-2", "pointer-events-none");
            panel.classList.add("opacity-100", "translate-y-0");
        });
        if (icon) icon.style.transform = "rotate(180deg)";
    };

    const hide = () => {
        open = false;
        panel.classList.add("opacity-0", "translate-y-2", "pointer-events-none");
        panel.classList.remove("opacity-100", "translate-y-0");
        if (icon) icon.style.transform = "rotate(0deg)";
        setTimeout(() => { if (!open) panel.classList.add("hidden"); }, 220);
    };

    btn.addEventListener("click", e => { e.stopPropagation(); open ? hide() : show(); });
    document.addEventListener("click", e => { if (!btn.contains(e.target) && !panel.contains(e.target) && open) hide(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && open) hide(); });
    panel.querySelectorAll("a").forEach(a => a.addEventListener("click", hide));
}

/* ── 4. Mobile hamburger drawer ──────────────────────────────────────── */
function initMobileMenu() {
    const menuBtn = document.getElementById("mobile-menu-btn");
    if (!menuBtn) return;

    let drawer = document.getElementById("mobile-menu-drawer");
    if (!drawer) {
        drawer = document.createElement("div");
        drawer.id = "mobile-menu-drawer";
        drawer.className = [
            "fixed inset-0 z-40 flex flex-col justify-start items-center pt-24 pb-10 gap-0",
            "bg-slate-950/97 backdrop-blur-xl",
            "translate-x-full transition-transform duration-300 ease-out md:hidden overflow-y-auto"
        ].join(" ");

        drawer.innerHTML = `
            <div class="mb-6 text-center px-6">
                <div class="text-2xl font-bold text-white tracking-tight">Lumina Digital</div>
                <div class="text-[11px] text-slate-500 uppercase tracking-[0.2em] mt-1">Premium Digital Agency</div>
            </div>

            <nav class="w-full max-w-sm px-6 flex flex-col divide-y divide-white/5">
                <a href="index.html"            class="nav-drawer-link"><span class="material-symbols-outlined text-[18px]">home</span>Home</a>
                <a href="services.html"         class="nav-drawer-link"><span class="material-symbols-outlined text-[18px]">design_services</span>Services</a>
                <a href="portfolio.html"        class="nav-drawer-link"><span class="material-symbols-outlined text-[18px]">grid_view</span>Portfolio</a>
                <a href="case-studies.html"     class="nav-drawer-link"><span class="material-symbols-outlined text-[18px]">analytics</span>Case Studies</a>
                <a href="team.html"             class="nav-drawer-link"><span class="material-symbols-outlined text-[18px]">group</span>Team</a>
                <a href="process.html"          class="nav-drawer-link"><span class="material-symbols-outlined text-[18px]">alt_route</span>Process</a>
                <a href="pricing.html"          class="nav-drawer-link"><span class="material-symbols-outlined text-[18px]">payments</span>Pricing</a>
                <a href="blog.html"             class="nav-drawer-link"><span class="material-symbols-outlined text-[18px]">article</span>Blog</a>
                <a href="faq.html"              class="nav-drawer-link"><span class="material-symbols-outlined text-[18px]">help_outline</span>FAQ</a>
                <a href="careers.html"          class="nav-drawer-link"><span class="material-symbols-outlined text-[18px]">work</span>Careers</a>
                <a href="contact.html"          class="nav-drawer-link"><span class="material-symbols-outlined text-[18px]">mail</span>Contact</a>
                <a id="mobile-portal-entry-btn" href="portal/index.html" class="nav-drawer-link text-sky-300 font-semibold"><span class="material-symbols-outlined text-[18px] text-sky-400">login</span>Login</a>
            </nav>

            <a href="book-consultation.html"
               class="mt-8 mx-6 w-[calc(100%-3rem)] max-w-sm text-center bg-sky-400 text-slate-950 py-4 rounded-2xl font-bold text-base shadow-[0_0_30px_rgba(125,211,252,0.4)] hover:bg-sky-300 transition-all">
                Book Consultation
            </a>
        `;
        document.body.appendChild(drawer);
    }

    // Inject style once
    if (!document.getElementById("drawer-link-style")) {
        const s = document.createElement("style");
        s.id = "drawer-link-style";
        s.textContent = `.nav-drawer-link{display:flex;align-items:center;gap:12px;padding:14px 0;font-size:1.1rem;font-weight:600;color:#cbd5e1;transition:color .15s}.nav-drawer-link:hover,.nav-drawer-link:active{color:#7dd3fc}`;
        document.head.appendChild(s);
    }

    let menuOpen = false;

    const openMenu = () => {
        menuOpen = true;
        drawer.classList.remove("translate-x-full");
        menuBtn.querySelector("span").textContent = "close";
        document.body.classList.add("overflow-hidden");
    };

    const closeMenu = () => {
        menuOpen = false;
        drawer.classList.add("translate-x-full");
        menuBtn.querySelector("span").textContent = "menu";
        document.body.classList.remove("overflow-hidden");
    };

    menuBtn.addEventListener("click", () => menuOpen ? closeMenu() : openMenu());
    drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));
}

/* ── 5. Scroll-reveal animations ─────────────────────────────────────── */
function initScrollReveal() {
    // 1. Existing cards/elements fade-up (excluding ones that have explicit directional reveal classes)
    const els = document.querySelectorAll(".glass-card:not(div.fixed *), .liquid-glass:not(div.fixed *), article:not(div.fixed *), section h2");
    const io  = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) { 
                e.target.classList.add("animate-slide-up"); 
                io.unobserve(e.target); 
            }
        });
    }, { threshold: 0.05, rootMargin: "0px 0px -50px 0px" });

    els.forEach(el => { 
        if (el.classList.contains("reveal-left") || 
            el.classList.contains("reveal-right") || 
            el.classList.contains("reveal-up") || 
            el.classList.contains("reveal-down")) {
            return;
        }
        el.style.opacity = "0"; 
        io.observe(el); 
    });

    // 2. Directional Reveals (.reveal-left, .reveal-right, .reveal-up, .reveal-down)
    const directionalEls = document.querySelectorAll(".reveal-left, .reveal-right, .reveal-up, .reveal-down");
    const directionalIo = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) { 
                e.target.classList.add("reveal-active"); 
                directionalIo.unobserve(e.target); 
            }
        });
    }, { threshold: 0.05, rootMargin: "0px 0px -50px 0px" });

    directionalEls.forEach(el => {
        directionalIo.observe(el);
    });
}

/* ── 6. Toast notifications ─────────────────────────────────────────── */
window.showToast = function(title, message, type = "success") {
    let box = document.getElementById("toast-container");
    if (!box) {
        box = document.createElement("div");
        box.id = "toast-container";
        box.className = "fixed bottom-5 right-5 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none";
        document.body.appendChild(box);
    }

    const isSuccess = type === "success";
    const t = document.createElement("div");
    t.className = `p-4 rounded-xl shadow-2xl border backdrop-blur-md pointer-events-auto transform translate-y-5 opacity-0 transition-all duration-300 flex items-start gap-3 ${isSuccess ? "bg-slate-900/90 border-emerald-500/30" : "bg-slate-900/90 border-rose-500/30"} text-slate-100`;
    t.innerHTML = `
        <span class="material-symbols-outlined ${isSuccess ? "text-emerald-400" : "text-rose-400"}">${isSuccess ? "check_circle" : "error"}</span>
        <div class="flex-grow"><div class="font-semibold text-sm">${title}</div><div class="text-xs text-slate-400 mt-0.5">${message}</div></div>
        <button class="text-slate-500 hover:text-slate-300" onclick="this.parentElement.remove()"><span class="material-symbols-outlined text-[18px]">close</span></button>
    `;
    box.appendChild(t);
    setTimeout(() => t.classList.remove("translate-y-5", "opacity-0"), 10);
    setTimeout(() => { t.classList.add("translate-y-5", "opacity-0"); setTimeout(() => t.remove(), 300); }, 4000);
};

/* ── 7. Smooth-scroll anchor links ───────────────────────────────────── */
function initSmoothAnchors() {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const isHome = ["index.html", "", "/"].includes(currentPath);

    const sectionMap = {
        "services.html":      "services-sec",
        "portfolio.html":     "portfolio-sec",
        "case-studies.html":  "case-studies-sec",
        "team.html":          "team-sec",
        "process.html":       "process-sec",
        "pricing.html":       "pricing-sec",
        "faq.html":           "faq-sec"
    };

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: "smooth" });
    };

    // Run after drawer is created (slight delay)
    setTimeout(() => {
        // Handle nav links + footer process link
        document.querySelectorAll("nav a, #more-dropdown-panel a, #mobile-menu-drawer a, .footer-process-link").forEach(link => {
            const href = link.getAttribute("href");
            if (!sectionMap[href]) return;

            if (isHome) {
                link.addEventListener("click", e => {
                    e.preventDefault();
                    scrollTo(sectionMap[href]);
                    // close drawers
                    const drawer  = document.getElementById("mobile-menu-drawer");
                    const menuBtn = document.getElementById("mobile-menu-btn");
                    if (drawer && !drawer.classList.contains("translate-x-full")) {
                        drawer.classList.add("translate-x-full");
                        if (menuBtn) menuBtn.querySelector("span").textContent = "menu";
                        document.body.classList.remove("overflow-hidden");
                    }
                });
            } else {
                link.setAttribute("href", `index.html#${sectionMap[href]}`);
            }
        });

        // Also update ALL footer links that point to section pages (not just process)
        document.querySelectorAll("#site-footer a").forEach(link => {
            const href = link.getAttribute("href");
            if (!href || !sectionMap[href]) return;
            if (isHome) {
                link.addEventListener("click", e => {
                    e.preventDefault();
                    scrollTo(sectionMap[href]);
                });
            } else {
                link.setAttribute("href", `index.html#${sectionMap[href]}`);
            }
        });
    }, 50);


    // Handle hash on load
    if (isHome && window.location.hash) {
        setTimeout(() => scrollTo(window.location.hash.slice(1)), 350);
    }
}

/* ── 8. Settings Synchronization ─────────────────────────────────────── */
function initSettingsSync() {
    if (typeof LuminaAPI === 'undefined') return;
    
    LuminaAPI.getSettings().then(settings => {
        if (!settings) return;
        
        // 1. Sync Agency Brand Name
        if (settings.agencyName) {
            document.querySelectorAll("nav a").forEach(el => {
                if (el.textContent.trim() === "Lumina Digital") {
                    el.textContent = settings.agencyName;
                }
            });
            document.querySelectorAll("#site-footer a").forEach(el => {
                const brandSpan = el.querySelector("span");
                if (brandSpan && brandSpan.textContent.startsWith("Lumina")) {
                    const shortName = settings.shortName || settings.agencyName.split(" ")[0];
                    brandSpan.innerHTML = `${shortName}<span class="text-sky-400">.</span>`;
                }
            });
            document.querySelectorAll("#site-footer p").forEach(el => {
                if (el.textContent.includes("Lumina Digital Agency")) {
                    el.textContent = `© 2026 ${settings.agencyName}. All rights reserved.`;
                }
            });
            // Update page titles if they have "Lumina Digital"
            if (document.title.includes("Lumina Digital")) {
                document.title = document.title.replace("Lumina Digital", settings.agencyName);
            }
        }

        // 2. Sync Support Email
        if (settings.supportEmail) {
            document.querySelectorAll("a[href^='mailto:']").forEach(el => {
                if (el.href.includes("hello@luminadigital.com") || el.textContent.includes("hello@luminadigital.com") || el.href.includes("hello@luminadigital.com")) {
                    el.href = `mailto:${settings.supportEmail}`;
                    el.textContent = settings.supportEmail;
                }
            });
        }

        // 3. Sync Phone Number
        if (settings.phone) {
            document.querySelectorAll("a[href^='tel:']").forEach(el => {
                if (el.href.includes("+18005550199") || el.textContent.includes("+1 (800) 555-0199") || el.href.includes("+18005550199")) {
                    const cleanPhone = settings.phone.replace(/[^+\d]/g, "");
                    el.href = `tel:${cleanPhone}`;
                    el.textContent = settings.phone;
                }
            });
        }

        // 4. Sync Social Links in Footer
        const socialMapping = {
            socialLinkedin: { url: settings.socialLinkedin, active: settings.socialLinkedinActive, selector: "a[title='LinkedIn']" },
            socialTwitter: { url: settings.socialTwitter, active: settings.socialTwitterActive, selector: "a[title='Twitter / X']" },
            socialDribbble: { url: settings.socialDribbble, active: settings.socialDribbbleActive, selector: "a[title='Dribbble']" },
            socialFacebook: { url: settings.socialFacebook, active: settings.socialFacebookActive, selector: "a[title='Facebook']" },
            socialInstagram: { url: settings.socialInstagram, active: settings.socialInstagramActive, selector: "a[title='Instagram']" }
        };

        Object.keys(socialMapping).forEach(key => {
            const config = socialMapping[key];
            const linkEl = document.querySelector(`#site-footer ${config.selector}`);
            if (linkEl) {
                if (config.url) linkEl.href = config.url;
                if (config.active === false) {
                    linkEl.classList.add("hidden");
                } else {
                    linkEl.classList.remove("hidden");
                }
            }
        });
    }).catch(err => {
        console.warn("Could not sync dynamic backend settings to frontend:", err);
    });
}

/* ── 9. Website Content Synchronization ──────────────────────────────── */
function initContentSync() {
    if (typeof LuminaAPI === 'undefined') return;
    
    LuminaAPI.getContent().then(content => {
        if (!content) return;
        
        const path = window.location.pathname.split("/").pop() || "index.html";
        
        const setHtml = (selector, html) => {
            const el = document.querySelector(selector);
            if (el && html) el.innerHTML = html;
        };
        const setText = (selector, txt) => {
            const el = document.querySelector(selector);
            if (el && txt) el.textContent = txt;
        };
        
        if (path === "index.html" || path === "") {
            const home = content["Homepage"];
            if (home) {
                if (home.hero) {
                    setHtml('#hero-section h1', home.hero.title);
                    setText('#hero-section p', home.hero.subtitle);
                    const heroCtaBtn = document.querySelector('#hero-section a[href="contact.html"]');
                    if (heroCtaBtn && home.hero.ctaText) {
                        heroCtaBtn.textContent = home.hero.ctaText;
                    }
                    const heroSec = document.getElementById('hero-section');
                    if (heroSec) {
                        if (home.hero.active === false) heroSec.classList.add('hidden');
                        else heroSec.classList.remove('hidden');
                    }
                }
                if (home.services) {
                    setHtml('#services-sec h2', home.services.title);
                    setHtml('#services-sec p', home.services.subtitle);
                    const servicesSec = document.getElementById('services-sec');
                    if (servicesSec) {
                        if (home.services.active === false) servicesSec.classList.add('hidden');
                        else servicesSec.classList.remove('hidden');
                    }
                }
                
                // Render Homepage Services Grid dynamically
                const servicesData = content["Services"];
                if (servicesData && servicesData.features && servicesData.features.active !== false && servicesData.features.items) {
                    const hGrid = document.getElementById('homepage-services-grid');
                    if (hGrid) {
                        hGrid.innerHTML = servicesData.features.items.slice(0, 4).map(item => {
                            const lines = (item.desc || '').split('\n').map(l => l.trim()).filter(Boolean);
                            const mainDesc = lines[0] || '';
                            const bulletPoints = lines.slice(1).map(line => line.replace(/^[-*+]\s*/, ''));
                            
                            const t = (item.title || '').toLowerCase();
                            let icon = 'design_services';
                            let borderHoverClass = 'hover:border-sky-400/30 hover:shadow-[0_0_40px_-10px_rgba(125,211,252,0.2)]';
                            let gradientClass = 'from-sky-500/5';
                            let iconBgClass = 'bg-sky-500/10 border-sky-500/20 text-sky-400 shadow-[0_0_20px_rgba(125,211,252,0.1)]';
                            let checkColor = 'text-sky-400';
                            let btnClass = 'bg-white text-slate-900 hover:bg-sky-50 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]';
                            let btnText = 'Get a Design Quote';
                            
                            if (t.includes('engineer') || t.includes('code') || t.includes('dev') || t.includes('web')) {
                                icon = 'code';
                                borderHoverClass = 'hover:border-blue-400/30 hover:shadow-[0_0_40px_-10px_rgba(96,165,250,0.2)]';
                                gradientClass = 'from-blue-500/5';
                                iconBgClass = 'bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.1)]';
                                checkColor = 'text-blue-400';
                                btnClass = 'bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600 hover:text-white hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]';
                                btnText = 'Start a Project';
                            } else if (t.includes('seo') || t.includes('search') || t.includes('analytics') || t.includes('growth')) {
                                icon = 'query_stats';
                                borderHoverClass = 'hover:border-teal-400/30 hover:shadow-[0_0_40px_-10px_rgba(45,212,191,0.2)]';
                                gradientClass = 'from-teal-500/5';
                                iconBgClass = 'bg-teal-500/10 border-teal-500/20 text-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.1)]';
                                checkColor = 'text-teal-400';
                                btnClass = 'bg-teal-600/20 border border-teal-500/30 text-teal-300 hover:bg-teal-600 hover:text-white hover:shadow-[0_0_25px_rgba(20,184,166,0.4)]';
                                btnText = 'Request an SEO Audit';
                            } else if (t.includes('market') || t.includes('campaign') || t.includes('social')) {
                                icon = 'campaign';
                                borderHoverClass = 'hover:border-indigo-400/30 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.2)]';
                                gradientClass = 'from-indigo-500/5';
                                iconBgClass = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]';
                                checkColor = 'text-indigo-400';
                                btnClass = 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white hover:shadow-[0_0_25px_rgba(79,70,229,0.4)]';
                                btnText = 'Boost Your Conversions';
                            }
                            
                            const keyFeaturesHtml = bulletPoints.length > 0 ? `
                                <div class="mb-lg">
                                    <h3 class="font-subheading-sm text-subheading-sm text-slate-200 mb-sm">Key Features</h3>
                                    <ul class="space-y-3">
                                        ${bulletPoints.map(pt => `
                                            <li class="flex items-center gap-sm font-body-md text-body-md text-slate-300">
                                                <span class="material-symbols-outlined ${checkColor} text-[20px]">check_circle</span>
                                                ${pt}
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : '';
                            
                            return `
                                <article class="glass-card rounded-[32px] p-lg border border-white/10 ${borderHoverClass} transition-all duration-500 relative group text-left">
                                    <div class="absolute inset-0 bg-gradient-to-br ${gradientClass} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[32px]"></div>
                                    <div class="relative z-10 flex flex-col h-full justify-between">
                                        <div>
                                            <div class="flex items-center gap-sm mb-md">
                                                <div class="w-14 h-14 rounded-2xl ${iconBgClass} flex items-center justify-center">
                                                    <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">${icon}</span>
                                                </div>
                                                <h2 class="font-headline-lg text-headline-lg text-white tracking-tight">${item.title || ''}</h2>
                                            </div>
                                            <p class="font-body-md text-body-md text-slate-400 mb-lg">${mainDesc}</p>
                                            ${keyFeaturesHtml}
                                        </div>
                                        <a href="book-consultation.html" class="w-full text-center ${btnClass} font-label-md text-[16px] px-md py-4 rounded-[24px] transition-all duration-300 font-semibold block">${btnText}</a>
                                    </div>
                                </article>
                            `;
                        }).join('');
                    }
                }

                // Render Homepage Stats Section dynamically
                const statsSec = document.getElementById('stats-sec');
                if (statsSec) {
                    if (home.stats && home.stats.active !== false && home.stats.items && home.stats.items.length > 0) {
                        statsSec.classList.remove('hidden');
                        const sGrid = document.getElementById('stats-grid');
                        if (sGrid) {
                            sGrid.innerHTML = home.stats.items.map(item => `
                                <div class="liquid-glass rounded-2xl p-md border border-white/10 backdrop-blur-md relative overflow-hidden group hover:border-sky-400/30 transition-all duration-300">
                                    <div class="text-4xl md:text-5xl font-display-lg font-bold text-sky-300 mb-xs drop-shadow-[0_0_10px_rgba(125,211,252,0.2)]">${item.value || ''}</div>
                                    <div class="text-xs font-label-sm text-slate-400 uppercase tracking-widest">${item.label || ''}</div>
                                </div>
                            `).join('');
                        }
                    } else {
                        statsSec.classList.add('hidden');
                    }
                }

                // Render Testimonials Active check
                const slider = document.getElementById('testimonial-slider');
                const testimonialParentSec = slider ? slider.closest('section') || slider.parentElement : null;
                if (home.testimonials) {
                    const testActive = home.testimonials.active !== false && home.testimonials.reviews && home.testimonials.reviews.length > 0;
                    if (!testActive && testimonialParentSec) {
                        const testimonialWrapper = slider ? slider.parentElement : null;
                        if (testimonialWrapper) testimonialWrapper.classList.add('hidden');
                    } else if (testActive && testimonialParentSec) {
                        const testimonialWrapper = slider ? slider.parentElement : null;
                        if (testimonialWrapper) testimonialWrapper.classList.remove('hidden');
                    }
                }

                if (home.testimonials && home.testimonials.active !== false && home.testimonials.reviews && home.testimonials.reviews.length > 0) {
                    const dotContainer = slider ? slider.parentElement.querySelector('.flex.justify-center.gap-2.mt-md') || slider.parentElement.querySelector('.flex.justify-center.gap-2') : null;
                    if (slider && dotContainer) {
                        slider.innerHTML = home.testimonials.reviews.map((r, idx) => `
                            <div class="testimonial-slide ${idx === 0 ? 'opacity-100' : 'hidden opacity-0'} transition-opacity duration-500 flex flex-col items-center text-center gap-md">
                                <span class="material-symbols-outlined text-4xl text-sky-300 drop-shadow-[0_0_8px_rgba(125,211,252,0.4)]">format_quote</span>
                                <p class="font-body-lg text-body-lg text-slate-200 italic max-w-2xl">
                                    "${r.text || ''}"
                                </p>
                                <div>
                                    <h4 class="font-subheading-sm text-subheading-sm text-white">${r.author || ''}</h4>
                                    <p class="text-xs text-slate-500 font-label-sm uppercase tracking-wider mt-0.5">${r.company || ''}</p>
                                </div>
                            </div>
                        `).join('');
                        
                        dotContainer.innerHTML = home.testimonials.reviews.map((_, idx) => `
                            <span class="dot w-2 h-2 rounded-full ${idx === 0 ? 'bg-sky-300 active-dot' : 'bg-slate-700'} cursor-pointer" data-slide="${idx}"></span>
                        `).join('');
                        
                        if (window.initTestimonialCarousel) {
                            window.initTestimonialCarousel();
                        }
                    }
                }

                if (home.ctaBanner) {
                    const ctaSec = document.querySelector('main > section:last-of-type');
                    if (ctaSec) {
                        setHtml(ctaSec.querySelector('h2'), home.ctaBanner.title);
                        setHtml(ctaSec.querySelector('p'), home.ctaBanner.subtitle);
                        const ctaBtn = ctaSec.querySelector('a');
                        if (ctaBtn && home.ctaBanner.ctaText) {
                            ctaBtn.innerHTML = `${home.ctaBanner.ctaText} <span class="material-symbols-outlined text-sm font-bold">arrow_forward</span>`;
                        }
                        if (home.ctaBanner.active === false) {
                            ctaSec.classList.add('hidden');
                        } else {
                            ctaSec.classList.remove('hidden');
                        }
                    }
                }

                // Render Homepage Pricing Section dynamically
                const pricingData = content["Pricing"];
                if (pricingData) {
                    const hPricingSec = document.getElementById('pricing-sec');
                    if (hPricingSec) {
                        if (pricingData.packages && pricingData.packages.active !== false) {
                            hPricingSec.classList.remove('hidden');
                        } else {
                            hPricingSec.classList.add('hidden');
                        }
                    }
                    if (pricingData.packages && pricingData.packages.active !== false && pricingData.packages.items) {
                        const hPricingGrid = document.getElementById('homepage-pricing-grid');
                        if (hPricingGrid) {
                            hPricingGrid.innerHTML = pricingData.packages.items.slice(0, 3).map((item, idx) => {
                                const lines = (item.desc || '').split('\n').map(l => l.trim()).filter(Boolean);
                                const mainDesc = lines[0] || '';
                                const bulletPoints = lines.slice(1).map(line => line.replace(/^[-*+]\s*/, ''));
                                
                                const isFeatured = idx === 1 || (item.name || '').toLowerCase().includes('elite');
                                
                                const cardStyle = isFeatured 
                                    ? 'glass-card rounded-xl p-8 flex flex-col transition-all duration-300 transform md:-translate-y-4 relative overflow-hidden ring-1 ring-sky-400/30 shadow-[0_0_40px_rgba(125,211,252,0.1)] text-left hover:border-sky-400/50'
                                    : 'glass-card rounded-xl p-8 flex flex-col transition-all duration-300 hover:border-sky-400/30 hover:shadow-[0_25px_50px_-12px_rgba(125,211,252,0.15)] group relative overflow-hidden text-left';
                                    
                                const badgeHtml = isFeatured
                                    ? `<div class="absolute top-0 right-0 bg-sky-400/20 text-sky-300 text-xs font-bold px-4 py-1 rounded-bl-lg border-b border-l border-white/10">MOST POPULAR</div>`
                                    : '';
                                    
                                const glowHtml = isFeatured
                                    ? `<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sky-500/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>`
                                    : `<div class="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-bl-full blur-2xl transition-all duration-500 group-hover:bg-sky-500/10"></div>`;
                                    
                                const btnHtml = isFeatured
                                    ? `<a href="book-consultation.html" class="w-full text-center bg-sky-300 text-slate-950 hover:bg-sky-200 py-3 rounded-lg font-semibold transition-all duration-300 relative z-10 shadow-[0_0_20px_rgba(125,211,252,0.15)] block">Get Started</a>`
                                    : `<a href="book-consultation.html" class="w-full text-center bg-white/5 text-white border border-white/10 hover:border-sky-300/30 py-3 rounded-lg font-semibold transition-all duration-300 block">Select Plan</a>`;
                                    
                                const featuresListHtml = bulletPoints.map(pt => `
                                    <li class="flex items-start">
                                        <span class="material-symbols-outlined text-sky-300 mr-3 text-lg">check_circle</span>
                                        <span class="text-slate-300 text-sm">${pt}</span>
                                    </li>
                                `).join('');
                                
                                return `
                                    <div class="${cardStyle}">
                                        ${badgeHtml}
                                        ${glowHtml}
                                        <h3 class="text-2xl font-headline font-semibold text-white mb-2 relative z-10">${item.name || ''}</h3>
                                        <p class="text-slate-400 text-sm mb-6 relative z-10">${mainDesc}</p>
                                        <div class="mb-8 relative z-10">
                                            <span class="text-4xl font-headline font-bold text-sky-300 package-price-val" data-base-price="${item.price || ''}">${item.price || ''}</span>
                                            <span class="text-slate-400 text-sm">/mo</span>
                                        </div>
                                        <ul class="space-y-4 mb-8 flex-grow relative z-10">
                                            ${featuresListHtml}
                                        </ul>
                                        ${btnHtml}
                                    </div>
                                `;
                            }).join('');
                            
                            window.toggleBillingPeriod = function() {
                                const isAnnualPrev = window.isAnnual || false;
                                window.isAnnual = !isAnnualPrev;
                                const dot = document.getElementById("billing-dot");
                                const labelMonthly = document.getElementById("label-monthly");
                                const labelAnnual = document.getElementById("label-annual");

                                if (window.isAnnual) {
                                    if (dot) {
                                        dot.style.left = "auto";
                                        dot.style.right = "4px";
                                        dot.classList.add("translate-x-full");
                                    }
                                    if (labelMonthly) {
                                        labelMonthly.classList.remove("text-sky-300");
                                        labelMonthly.classList.add("text-slate-400");
                                    }
                                    if (labelAnnual) {
                                        labelAnnual.classList.remove("text-slate-400");
                                        labelAnnual.classList.add("text-sky-300");
                                    }
                                } else {
                                    if (dot) {
                                        dot.style.right = "auto";
                                        dot.style.left = "4px";
                                        dot.classList.remove("translate-x-full");
                                    }
                                    if (labelMonthly) {
                                        labelMonthly.classList.remove("text-slate-400");
                                        labelMonthly.classList.add("text-sky-300");
                                    }
                                    if (labelAnnual) {
                                        labelAnnual.classList.remove("text-sky-300");
                                        labelAnnual.classList.add("text-slate-400");
                                    }
                                }

                                document.querySelectorAll(".package-price-val").forEach(priceEl => {
                                    const basePriceStr = priceEl.getAttribute("data-base-price");
                                    const cleanPrice = parseFloat(basePriceStr.replace(/[^0-9.]/g, ''));
                                    if (!isNaN(cleanPrice)) {
                                        if (window.isAnnual) {
                                            const discounted = Math.round(cleanPrice * 0.8);
                                            priceEl.textContent = "$" + discounted.toLocaleString();
                                        } else {
                                            priceEl.textContent = "$" + cleanPrice.toLocaleString();
                                        }
                                    }
                                });
                            };
                        }
                    }
                }

                // Render Homepage Team Section dynamically from API
                LuminaAPI.getTeam().then(teamMembers => {
                    const hTeamGrid = document.getElementById('homepage-team-grid');
                    if (hTeamGrid && teamMembers && teamMembers.length > 0) {
                        window.activeMembers = window.activeMembers || {};
                        hTeamGrid.innerHTML = teamMembers.slice(0, 3).map((member, index) => {
                            window.activeMembers[member.id] = member;
                            const isMiddleColumn = (index % 3 === 1);
                            const translationClass = isMiddleColumn ? "lg:-translate-y-8" : "";
                            
                            const avatarContent = member.avatar 
                                ? `<img src="${member.avatar}" alt="${member.name}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"/>`
                                : `<div class="w-full h-full bg-gradient-to-br from-sky-900/30 to-indigo-950 flex items-center justify-center text-sky-300 font-semibold group-hover:scale-105 transition-all">${member.name.split(' ').map(n=>n[0]).join('')}</div>`;

                            return `
                                <div class="glass-panel-team rounded-2xl p-6 glow-hover transition-all duration-500 transform hover:-translate-y-2 group cursor-pointer ${translationClass}" onclick="openBioModal('${member.id}')">
                                    <div class="aspect-square rounded-xl overflow-hidden mb-6 border border-sky-400/10 relative overflow-hidden">
                                        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent z-10"></div>
                                        ${avatarContent}
                                    </div>
                                    <div class="flex justify-between items-end text-left">
                                        <div>
                                            <h3 class="text-xl font-semibold text-white mb-1">${member.name}</h3>
                                            <p class="text-sm text-sky-300 font-medium tracking-wide">${member.role}</p>
                                        </div>
                                        <button class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-sky-300 hover:border-sky-300/50 transition-colors">
                                            <span class="material-symbols-outlined" style="font-size: 20px;">info</span>
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('');

                        // Override openBioModal dynamically
                        const originalOpenBioModal = window.openBioModal;
                        window.openBioModal = function(memberId) {
                            const member = (window.activeMembers && window.activeMembers[memberId]) || (typeof bios !== 'undefined' && bios[memberId]);
                            if (!member) {
                                if (originalOpenBioModal) originalOpenBioModal(memberId);
                                return;
                            }
                            document.getElementById("modal-name").textContent = member.name;
                            document.getElementById("modal-role").textContent = member.role;
                            document.getElementById("modal-bio").textContent = member.bio || "No biography available.";
                            document.getElementById("modal-specialty").textContent = member.specialty || member.role;

                            const modal = document.getElementById("bio-modal");
                            modal.classList.remove("hidden");
                            modal.classList.add("flex");
                            setTimeout(() => modal.classList.add("opacity-100"), 10);
                        };
                    }
                }).catch(err => console.warn("Failed to load team on homepage:", err));

                // Render Homepage Portfolio/Featured Work Title & Subtitle from Showcase Section
                const portData = content["Portfolio"];
                if (portData) {
                    if (portData.showcase) {
                        setHtml('#portfolio-sec h2', portData.showcase.title || portData.hero.title);
                        setHtml('#portfolio-sec p', portData.showcase.subtitle || portData.hero.subtitle);
                        const portSec = document.getElementById('portfolio-sec');
                        if (portSec) {
                            if (portData.showcase.active === false) portSec.classList.add('hidden');
                            else portSec.classList.remove('hidden');
                        }
                    }
                }
            }
        }
        
        if (path === "services.html") {
            const serv = content["Services"];
            if (serv) {
                if (serv.hero) {
                    setHtml('header h1', serv.hero.title);
                    setHtml('header p', serv.hero.subtitle);
                }
                if (serv.features && serv.features.active !== false && serv.features.items) {
                    const grid = document.getElementById('services-grid');
                    if (grid) {
                        grid.innerHTML = serv.features.items.map(item => {
                            const lines = (item.desc || '').split('\n').map(l => l.trim()).filter(Boolean);
                            const mainDesc = lines[0] || '';
                            const bulletPoints = lines.slice(1).map(line => line.replace(/^[-*+]\s*/, ''));
                            
                            const t = (item.title || '').toLowerCase();
                            let icon = 'design_services';
                            let borderHoverClass = 'hover:border-sky-400/30 hover:shadow-[0_0_40px_-10px_rgba(125,211,252,0.2)]';
                            let gradientClass = 'from-sky-500/5';
                            let iconBgClass = 'bg-sky-500/10 border-sky-500/20 text-sky-400 shadow-[0_0_20px_rgba(125,211,252,0.1)]';
                            let checkColor = 'text-sky-400';
                            let btnClass = 'bg-white text-slate-900 hover:bg-sky-50 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]';
                            let btnText = 'Get a Design Quote';
                            
                            if (t.includes('engineer') || t.includes('code') || t.includes('dev') || t.includes('web')) {
                                icon = 'code';
                                borderHoverClass = 'hover:border-blue-400/30 hover:shadow-[0_0_40px_-10px_rgba(96,165,250,0.2)]';
                                gradientClass = 'from-blue-500/5';
                                iconBgClass = 'bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.1)]';
                                checkColor = 'text-blue-400';
                                btnClass = 'bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600 hover:text-white hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]';
                                btnText = 'Start a Project';
                            } else if (t.includes('seo') || t.includes('search') || t.includes('analytics') || t.includes('growth')) {
                                icon = 'query_stats';
                                borderHoverClass = 'hover:border-teal-400/30 hover:shadow-[0_0_40px_-10px_rgba(45,212,191,0.2)]';
                                gradientClass = 'from-teal-500/5';
                                iconBgClass = 'bg-teal-500/10 border-teal-500/20 text-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.1)]';
                                checkColor = 'text-teal-400';
                                btnClass = 'bg-teal-600/20 border border-teal-500/30 text-teal-300 hover:bg-teal-600 hover:text-white hover:shadow-[0_0_25px_rgba(20,184,166,0.4)]';
                                btnText = 'Request an SEO Audit';
                            } else if (t.includes('market') || t.includes('campaign') || t.includes('social')) {
                                icon = 'campaign';
                                borderHoverClass = 'hover:border-indigo-400/30 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.2)]';
                                gradientClass = 'from-indigo-500/5';
                                iconBgClass = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]';
                                checkColor = 'text-indigo-400';
                                btnClass = 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white hover:shadow-[0_0_25px_rgba(79,70,229,0.4)]';
                                btnText = 'Boost Your Conversions';
                            }
                            
                            const keyFeaturesHtml = bulletPoints.length > 0 ? `
                                <div class="mb-lg">
                                    <h3 class="font-subheading-sm text-subheading-sm text-slate-200 mb-sm">Key Features</h3>
                                    <ul class="space-y-3">
                                        ${bulletPoints.map(pt => `
                                            <li class="flex items-center gap-sm font-body-md text-body-md text-slate-300">
                                                <span class="material-symbols-outlined ${checkColor} text-[20px]">check_circle</span>
                                                ${pt}
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : '';
                            
                            return `
                                <article class="glass-card rounded-[32px] p-lg border border-white/10 ${borderHoverClass} transition-all duration-500 relative group text-left">
                                    <div class="absolute inset-0 bg-gradient-to-br ${gradientClass} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[32px]"></div>
                                    <div class="relative z-10 flex flex-col h-full justify-between">
                                        <div>
                                            <div class="flex items-center gap-sm mb-md">
                                                <div class="w-14 h-14 rounded-2xl ${iconBgClass} flex items-center justify-center">
                                                    <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">${icon}</span>
                                                </div>
                                                <h2 class="font-headline-lg text-headline-lg text-white tracking-tight">${item.title || ''}</h2>
                                            </div>
                                            <p class="font-body-md text-body-md text-slate-400 mb-lg">${mainDesc}</p>
                                            ${keyFeaturesHtml}
                                        </div>
                                        <a href="book-consultation.html" class="w-full text-center ${btnClass} font-label-md text-[16px] px-md py-4 rounded-[24px] transition-all duration-300 font-semibold block">${btnText}</a>
                                    </div>
                                </article>
                            `;
                        }).join('');
                    }
                }
            }
        }
        
        if (path === "portfolio.html") {
            const port = content["Portfolio"];
            if (port) {
                if (port.hero) {
                    setHtml('header h1', port.hero.title);
                    setHtml('header p', port.hero.subtitle);
                }
                if (port.showcase) {
                    const showcaseSec = document.getElementById('portfolio-grid')?.parentElement;
                    if (showcaseSec) {
                        const h2 = showcaseSec.querySelector('h2');
                        const p = showcaseSec.querySelector('p');
                        if (h2 && port.showcase.title) h2.textContent = port.showcase.title;
                        if (p && port.showcase.subtitle) p.textContent = port.showcase.subtitle;
                        
                        if (port.showcase.active === false) {
                            showcaseSec.classList.add('hidden');
                        } else {
                            showcaseSec.classList.remove('hidden');
                        }
                    }
                }
            }
        }
        
        if (path === "pricing.html") {
            const pr = content["Pricing"];
            if (pr) {
                if (pr.hero) {
                    setHtml('header h1', pr.hero.title);
                    setHtml('header p', pr.hero.subtitle);
                }
                if (pr.packages && pr.packages.active !== false && pr.packages.items) {
                    const grid = document.getElementById('pricing-grid');
                    if (grid) {
                        grid.innerHTML = pr.packages.items.map((item, idx) => {
                            const lines = (item.desc || '').split('\n').map(l => l.trim()).filter(Boolean);
                            const mainDesc = lines[0] || '';
                            const bulletPoints = lines.slice(1).map(line => line.replace(/^[-*+]\s*/, ''));
                            
                            const isFeatured = idx === 1 || (item.name || '').toLowerCase().includes('elite');
                            
                            const cardStyle = isFeatured 
                                ? 'glass-card rounded-xl p-8 flex flex-col transition-all duration-300 transform md:-translate-y-4 relative overflow-hidden ring-1 ring-sky-400/30 shadow-[0_0_40px_rgba(125,211,252,0.1)] text-left hover:border-sky-400/50'
                                : 'glass-card rounded-xl p-8 flex flex-col transition-all duration-300 hover:border-sky-400/30 hover:shadow-[0_25px_50px_-12px_rgba(125,211,252,0.15)] group relative overflow-hidden text-left';
                                
                            const badgeHtml = isFeatured
                                ? `<div class="absolute top-0 right-0 bg-sky-400/20 text-sky-300 text-xs font-bold px-4 py-1 rounded-bl-lg border-b border-l border-white/10">MOST POPULAR</div>`
                                : '';
                                
                            const glowHtml = isFeatured
                                ? `<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sky-500/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>`
                                : `<div class="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-bl-full blur-2xl transition-all duration-500 group-hover:bg-sky-500/10"></div>`;
                                
                            const btnHtml = isFeatured
                                ? `<a href="book-consultation.html" class="w-full text-center bg-sky-300 text-slate-950 hover:bg-sky-200 py-3 rounded-lg font-semibold transition-all duration-300 relative z-10 shadow-[0_0_20px_rgba(125,211,252,0.15)] block">Get Started</a>`
                                : `<a href="book-consultation.html" class="w-full text-center bg-white/5 text-white border border-white/10 hover:border-sky-300/30 py-3 rounded-lg font-semibold transition-all duration-300 block">Select Plan</a>`;
                                
                            const featuresListHtml = bulletPoints.map(pt => `
                                <li class="flex items-start">
                                    <span class="material-symbols-outlined text-sky-300 mr-3 text-lg">check_circle</span>
                                    <span class="text-slate-300 text-sm">${pt}</span>
                                </li>
                            `).join('');
                            
                            return `
                                <div class="${cardStyle}">
                                    ${badgeHtml}
                                    ${glowHtml}
                                    <h3 class="text-2xl font-headline font-semibold text-white mb-2 relative z-10">${item.name || ''}</h3>
                                    <p class="text-slate-400 text-sm mb-6 relative z-10">${mainDesc}</p>
                                    <div class="mb-8 relative z-10">
                                        <span class="text-4xl font-headline font-bold text-sky-300 package-price-val" data-base-price="${item.price || ''}">${item.price || ''}</span>
                                        <span class="text-slate-400 text-sm">/mo</span>
                                    </div>
                                    <ul class="space-y-4 mb-8 flex-grow relative z-10">
                                        ${featuresListHtml}
                                    </ul>
                                    ${btnHtml}
                                </div>
                            `;
                        }).join('');
                        
                        window.toggleBillingPeriod = function() {
                            const isAnnualPrev = window.isAnnual || false;
                            window.isAnnual = !isAnnualPrev;
                            const dot = document.getElementById("billing-dot");
                            const labelMonthly = document.getElementById("label-monthly");
                            const labelAnnual = document.getElementById("label-annual");

                            if (window.isAnnual) {
                                if (dot) {
                                    dot.style.left = "auto";
                                    dot.style.right = "4px";
                                    dot.classList.add("translate-x-full");
                                }
                                if (labelMonthly) {
                                    labelMonthly.classList.remove("text-sky-300");
                                    labelMonthly.classList.add("text-slate-400");
                                }
                                if (labelAnnual) {
                                    labelAnnual.classList.remove("text-slate-400");
                                    labelAnnual.classList.add("text-sky-300");
                                }
                            } else {
                                if (dot) {
                                    dot.style.right = "auto";
                                    dot.style.left = "4px";
                                    dot.classList.remove("translate-x-full");
                                }
                                if (labelMonthly) {
                                    labelMonthly.classList.remove("text-slate-400");
                                    labelMonthly.classList.add("text-sky-300");
                                }
                                if (labelAnnual) {
                                    labelAnnual.classList.remove("text-sky-300");
                                    labelAnnual.classList.add("text-slate-400");
                                }
                            }

                            document.querySelectorAll(".package-price-val").forEach(priceEl => {
                                const basePriceStr = priceEl.getAttribute("data-base-price");
                                const cleanPrice = parseFloat(basePriceStr.replace(/[^0-9.]/g, ''));
                                if (!isNaN(cleanPrice)) {
                                    if (window.isAnnual) {
                                        const discounted = Math.round(cleanPrice * 0.8);
                                        priceEl.textContent = "$" + discounted.toLocaleString();
                                    } else {
                                        priceEl.textContent = "$" + cleanPrice.toLocaleString();
                                    }
                                }
                            });
                        };
                    }
                }
            }
        }
        
        if (path === "team.html") {
            const about = content["About Us"];
            if (about) {
                if (about.hero) {
                    setHtml('header h1', about.hero.title);
                    setHtml('header p', about.hero.subtitle);
                }
                
                // Render Story & Values dynamically
                const teamGrid = document.getElementById('team-grid');
                if (teamGrid) {
                    let detailsSec = document.getElementById('about-us-details');
                    if (!detailsSec) {
                        detailsSec = document.createElement('section');
                        detailsSec.id = 'about-us-details';
                        detailsSec.className = 'mt-24 border-t border-white/5 pt-20';
                        teamGrid.parentNode.appendChild(detailsSec);
                    }
                    
                    const storyActive = about.story && about.story.active !== false;
                    const valuesActive = about.values && about.values.active !== false && about.values.items && about.values.items.length > 0;
                    
                    if (!storyActive && !valuesActive) {
                        detailsSec.classList.add('hidden');
                    } else {
                        detailsSec.classList.remove('hidden');
                        
                        let storyHtml = '';
                        if (storyActive) {
                            storyHtml = `
                                <div class="lg:col-span-5 text-left">
                                    <h2 class="text-3xl md:text-4xl font-semibold text-white mb-6">${about.story.title || 'Our Story'}</h2>
                                    <p class="text-slate-400 leading-relaxed text-base md:text-lg mb-8 whitespace-pre-line">${about.story.text || ''}</p>
                                </div>
                            `;
                        }
                        
                        let valuesHtml = '';
                        if (valuesActive) {
                            const gridCols = storyActive ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1 md:grid-cols-3 gap-8';
                            valuesHtml = `
                                <div class="${storyActive ? 'lg:col-span-7' : 'col-span-12'} text-left">
                                    <h2 class="text-3xl md:text-4xl font-semibold text-white mb-6 text-center md:text-left">${about.values.title || 'Core Values'}</h2>
                                    <div class="grid ${gridCols}">
                                        ${about.values.items.map(val => `
                                            <div class="liquid-glass rounded-2xl p-6 border border-white/10 relative overflow-hidden group hover:border-sky-400/30 transition-all duration-300">
                                                <div class="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-bl-full blur-xl transition-all duration-500 group-hover:bg-sky-500/10"></div>
                                                <h3 class="text-xl font-semibold text-white mb-2 relative z-10">${val.title || ''}</h3>
                                                <p class="text-slate-400 text-sm leading-relaxed relative z-10">${val.desc || ''}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        }
                        
                        detailsSec.innerHTML = `
                            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                                ${storyHtml}
                                ${valuesHtml}
                            </div>
                        `;
                    }
                }
            }
        }
        
        if (path === "contact.html") {
            const con = content["Contact"];
            if (con) {
                if (con.hero) {
                    setHtml('header h1', con.hero.title);
                    setHtml('header p', con.hero.subtitle);
                }
                if (con.form) {
                    const formContainer = document.getElementById('contact-inquiry-form')?.parentElement;
                    if (formContainer) {
                        const formTitle = formContainer.querySelector('h2');
                        const formDesc = formContainer.querySelector('p');
                        if (formTitle && con.form.title) formTitle.textContent = con.form.title;
                        if (formDesc && con.form.subtitle) formDesc.textContent = con.form.subtitle;
                        
                        if (con.form.active === false) {
                            formContainer.classList.add('hidden');
                        } else {
                            formContainer.classList.remove('hidden');
                        }
                    }
                }
            }
        }
        
        if (path === "blog.html") {
            const bl = content["Blog"];
            if (bl) {
                if (bl.hero) {
                    setHtml('header h1', bl.hero.title);
                    setHtml('header p', bl.hero.subtitle);
                }
            }
        }
    }).catch(err => {
        console.warn("Could not sync dynamic page content:", err);
    });
}

window.initTestimonialCarousel = function() {
    const slides = document.querySelectorAll(".testimonial-slide");
    const dots = document.querySelectorAll(".dot");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    if (!slides.length || !prevBtn || !nextBtn) return;
    
    let activeIndex = 0;

    function updateCarousel(newIndex) {
        slides[activeIndex].classList.add("opacity-0");
        slides[activeIndex].classList.remove("opacity-100");
        setTimeout(() => {
            slides[activeIndex].classList.add("hidden");
            slides[newIndex].classList.remove("hidden");
            setTimeout(() => {
                slides[newIndex].classList.remove("opacity-0");
                slides[newIndex].classList.add("opacity-100");
            }, 50);
        }, 300);

        dots[activeIndex].classList.remove("bg-sky-300", "active-dot");
        dots[activeIndex].classList.add("bg-slate-700");
        dots[newIndex].classList.remove("bg-slate-700");
        dots[newIndex].classList.add("bg-sky-300", "active-dot");
        activeIndex = newIndex;
    }

    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

    newPrevBtn.addEventListener("click", () => {
        updateCarousel((activeIndex - 1 + slides.length) % slides.length);
    });
    newNextBtn.addEventListener("click", () => {
        updateCarousel((activeIndex + 1) % slides.length);
    });
    dots.forEach(dot => {
        const newDot = dot.cloneNode(true);
        dot.parentNode.replaceChild(newDot, dot);
        newDot.addEventListener("click", () => {
            const idx = parseInt(newDot.getAttribute("data-slide"));
            if (idx !== activeIndex) updateCarousel(idx);
        });
    });
};
