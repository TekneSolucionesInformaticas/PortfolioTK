/**
 * TEKNÉ Soluciones Tecnológicas — Animation Engine
 * Lenis (smooth scroll) + GSAP/ScrollTrigger (all scroll-tied motion) with a
 * plain-CSS/IntersectionObserver fallback if either CDN fails to load.
 */

document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover)').matches;
    const isWideViewport = window.matchMedia('(min-width: 769px)').matches;

    const hasGSAP = typeof window.gsap !== 'undefined';
    const hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
    const hasLenis = typeof window.Lenis !== 'undefined';

    if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (hasScrollTrigger) document.documentElement.classList.add('gsap-reveals');

    /* =========================================================
       LENIS — smooth scroll with luxury inertia easing
       ========================================================= */
    let lenis = null;
    if (hasLenis && !prefersReducedMotion) {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });

        if (hasGSAP) {
            lenis.on('scroll', () => { if (hasScrollTrigger) ScrollTrigger.update(); });
            gsap.ticker.add((time) => { lenis.raf(time * 1000); });
            gsap.ticker.lagSmoothing(0);
        } else {
            const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
            requestAnimationFrame(raf);
        }
        window.__lenis = lenis;
    }

    const scrollToY = (y) => {
        if (lenis) lenis.scrollTo(y, { duration: 1.2 });
        else window.scrollTo({ top: y, behavior: 'smooth' });
    };

    /* --- Constants --- */
    const topNav = document.querySelector('.hero-top-nav');

    /* =========================================================
       MOBILE HAMBURGER MENU
       ========================================================= */
    if (topNav) {
        const burger = document.createElement('button');
        burger.className = 'nav-burger';
        burger.setAttribute('aria-label', 'Menú');
        burger.innerHTML = '<span></span><span></span><span></span>';
        topNav.appendChild(burger);

        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        topNav.querySelectorAll('a').forEach(link => {
            const clone = link.cloneNode(true);
            clone.removeAttribute('style');
            if (link.classList.contains('hero-nav-item') && link.getAttribute('href') && link.getAttribute('href').includes('contacto')) {
                clone.style.color = 'var(--primary)';
            }
            mobileMenu.appendChild(clone);
        });
        document.body.appendChild(mobileMenu);

        const closeMobileMenu = () => {
            burger.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
            if (lenis) lenis.start();
        };

        burger.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('active');
            burger.classList.toggle('active', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
            if (lenis) { isOpen ? lenis.stop() : lenis.start(); }
        });

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) closeMobileMenu();
        });
    }

    /* --- Navbar scroll state --- */
    const updateNavbar = () => {
        if (!topNav) return;
        if (window.scrollY > 100) topNav.classList.add('scrolled');
        else topNav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', () => requestAnimationFrame(updateNavbar), { passive: true });
    updateNavbar();

    /* =========================================================
       REVEAL ANIMATIONS
       GSAP + ScrollTrigger when available (fixes a real bug: [data-reveal]
       elements previously had no CSS state at all and never visibly
       animated). Falls back to the original IntersectionObserver + CSS
       class approach if the CDN failed to load.
       ========================================================= */
    if (hasScrollTrigger) {
        const bindReveals = (root = document) => {
            root.querySelectorAll('[data-reveal]:not([data-gsap-bound])').forEach(el => {
                el.setAttribute('data-gsap-bound', '1');
                if (prefersReducedMotion) { gsap.set(el, { autoAlpha: 1 }); return; }
                gsap.fromTo(el, { autoAlpha: 0, y: 44 }, {
                    autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out',
                    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
                    onStart: () => { el.style.willChange = 'transform, opacity'; },
                    onComplete: () => { el.style.willChange = 'auto'; },
                });
            });

            root.querySelectorAll('[data-reveal-blur]:not([data-gsap-bound])').forEach(el => {
                el.setAttribute('data-gsap-bound', '1');
                // Same seed-before-branch fix as .reveal-text above: [data-reveal-blur]'s
                // hidden state (opacity/blur/y) comes from a CSS stylesheet rule, so GSAP
                // must be told that's the starting point before it can register the
                // reduced-motion jump to the visible state as a real change.
                gsap.set(el, { autoAlpha: 0, y: 30, filter: 'blur(14px)' });
                if (prefersReducedMotion) { gsap.set(el, { autoAlpha: 1, y: 0, filter: 'blur(0px)' }); return; }
                gsap.fromTo(el, { autoAlpha: 0, y: 30, filter: 'blur(10px)' }, {
                    autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out',
                    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
                    onStart: () => { el.style.willChange = 'transform, opacity, filter'; },
                    onComplete: () => { el.style.willChange = 'auto'; },
                });
            });

            root.querySelectorAll('.reveal-text:not([data-gsap-bound])').forEach(el => {
                el.setAttribute('data-gsap-bound', '1');
                const spans = el.querySelectorAll(':scope > span');
                if (!spans.length) return;
                // The CSS class hides spans via `transform: translateY(110%)` (so text
                // stays hidden even if GSAP fails to load). GSAP tracks yPercent and y
                // as separate, additive components — the first time it touches a span
                // whose only transform came from that CSS rule, it bakes the resolved
                // pixel value in as `y` and then stacks its own yPercent on top instead
                // of replacing it, so the span never reaches a true zero offset. Doing
                // the whole hide/reveal purely in `y` (measured once, in px) sidesteps
                // that: there's only one component, so every set() genuinely overwrites
                // it instead of composing with a leftover from the CSS-authored state.
                spans.forEach(s => { s.style.transform = 'none'; });
                const hiddenY = Array.from(spans).map(s => s.getBoundingClientRect().height * 1.1);
                spans.forEach((s, i) => gsap.set(s, { y: hiddenY[i] }));
                if (prefersReducedMotion) { gsap.set(spans, { y: 0 }); return; }
                // Hero-type headers reveal immediately on load; everything else on scroll-into-view.
                // Everything inside the hero is already in the initial viewport on load —
                // gating it behind ScrollTrigger is unreliable there (trigger geometry can
                // be measured before web fonts/layout settle) and semantically wrong anyway.
                const isImmediate = el.closest('.hero-title, .hero-subtitle, .hero-main-content, .list-hero-wordmark, .list-hero');
                gsap.to(spans, {
                    y: 0, duration: 1.15, ease: 'expo.out', stagger: 0.05,
                    delay: isImmediate ? 0.15 : 0,
                    scrollTrigger: isImmediate ? undefined : { trigger: el, start: 'top 92%', once: true },
                    onStart: () => spans.forEach(s => { s.style.willChange = 'transform'; }),
                    onComplete: () => spans.forEach(s => { s.style.willChange = 'auto'; }),
                });
            });
        };

        bindReveals();
        window.revealOnScroll = () => {
            bindReveals();
            // admin-sync.js just replaced/injected large chunks of DOM (innerHTML swaps
            // for hydrated sections) — trigger positions cached before that are now stale.
            ScrollTrigger.refresh();
        };
    } else {
        // --- Fallback: IntersectionObserver + CSS classes (no GSAP) ---
        const observedReveals = new WeakSet();
        let revealObserver = null;
        if ('IntersectionObserver' in window) {
            revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'none';
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });
        }
        const observeReveals = () => {
            document.querySelectorAll('[data-reveal], [data-reveal-blur], .reveal-text').forEach(el => {
                if (observedReveals.has(el)) return;
                observedReveals.add(el);
                if (revealObserver) revealObserver.observe(el);
                else el.classList.add('revealed');
            });
        };
        window.revealOnScroll = observeReveals;
        observeReveals();
        setTimeout(() => {
            document.querySelectorAll('.hero-title.reveal-text, .hero-subtitle.reveal-text, .hero-main-content .reveal-text, .list-hero-wordmark.reveal-text').forEach(el => {
                el.classList.add('revealed');
            });
        }, 100);
    }

    /* --- Animated stat counters --- */
    const animateCounter = (el) => {
        const raw = el.getAttribute('data-count') || el.textContent;
        const match = raw.match(/(-?\d[\d.,]*)/);
        if (!match) return;
        const prefix = raw.slice(0, match.index);
        const suffix = raw.slice(match.index + match[0].length);
        const target = parseFloat(match[0].replace(/\./g, '').replace(',', '.'));
        if (isNaN(target)) return;

        if (prefersReducedMotion) { el.textContent = prefix + match[0] + suffix; return; }

        const duration = 1200;
        const start = performance.now();
        const step = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = prefix + Math.round(target * eased) + suffix;
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const statEls = document.querySelectorAll('.stat-value[data-count]');
    if (statEls.length && 'IntersectionObserver' in window) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) { animateCounter(entry.target); counterObserver.unobserve(entry.target); }
            });
        }, { threshold: 0.4 });
        statEls.forEach(el => counterObserver.observe(el));
    } else {
        statEls.forEach(animateCounter);
    }

    /* =========================================================
       IMAGE REVEALS — clipped scale-in on scroll (GSAP only)
       Containers: service-image, case-image-large/small, home-service-card,
       home-work-media, logo-tile-media. All already (or now) overflow:hidden.
       ========================================================= */
    if (hasScrollTrigger && !prefersReducedMotion) {
        const imageRevealSelectors = '.service-image img, .case-image-large img, .case-image-small img, .logo-tile-media img';
        document.querySelectorAll(imageRevealSelectors).forEach(img => {
            if (img.hasAttribute('data-img-reveal-bound')) return;
            img.setAttribute('data-img-reveal-bound', '1');
            gsap.fromTo(img, { scale: 1.3, yPercent: 20 }, {
                scale: 1, yPercent: 0, duration: 1.3, ease: 'power4.out',
                scrollTrigger: { trigger: img, start: 'top 90%', once: true },
                onStart: () => { img.style.willChange = 'transform'; },
                onComplete: () => { img.style.willChange = 'auto'; },
            });
        });
    }

    /* =========================================================
       CUSTOM CURSOR — dot + lagging ring, mix-blend-mode: difference
       ========================================================= */
    if (canHover && isWideViewport && !prefersReducedMotion) {
        const cursorDot = document.createElement('div');
        cursorDot.className = 'cursor-dot';
        const cursorRing = document.createElement('div');
        cursorRing.className = 'cursor-ring';
        document.body.appendChild(cursorDot);
        document.body.appendChild(cursorRing);
        document.documentElement.classList.add('has-custom-cursor');

        let mx = window.innerWidth / 2, my = window.innerHeight / 2;
        let rx = mx, ry = my;

        window.addEventListener('mousemove', (e) => {
            mx = e.clientX; my = e.clientY;
            cursorDot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
        }, { passive: true });

        const ringLoop = () => {
            rx += (mx - rx) * 0.16;
            ry += (my - ry) * 0.16;
            cursorRing.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
            requestAnimationFrame(ringLoop);
        };
        requestAnimationFrame(ringLoop);

        const hoverTargets = 'a, button, [data-magnetic], [data-tilt], input, textarea, .list-hero-item';
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(hoverTargets)) cursorRing.classList.add('active');
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest(hoverTargets)) cursorRing.classList.remove('active');
        });
        document.addEventListener('mousedown', () => cursorRing.classList.add('pressed'));
        document.addEventListener('mouseup', () => cursorRing.classList.remove('pressed'));
        document.addEventListener('mouseleave', () => { cursorDot.style.opacity = '0'; cursorRing.style.opacity = '0'; });
        document.addEventListener('mouseenter', () => { cursorDot.style.opacity = '1'; cursorRing.style.opacity = '1'; });
    }

    /* =========================================================
       MAGNETIC BUTTONS — GSAP-powered attraction toward the cursor
       ========================================================= */
    const magneticEls = document.querySelectorAll('[data-magnetic]');
    if (canHover && magneticEls.length && !prefersReducedMotion) {
        magneticEls.forEach(el => {
            const strength = 0.4;
            const moveTo = hasGSAP
                ? gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
                : null;
            const moveToY = hasGSAP
                ? gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
                : null;

            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                const dx = (e.clientX - (r.left + r.width / 2)) * strength;
                const dy = (e.clientY - (r.top + r.height / 2)) * strength;
                if (hasGSAP) { moveTo(dx); moveToY(dy); }
                else { el.style.transform = `translate(${dx}px, ${dy}px)`; }
            });

            el.addEventListener('mouseleave', () => {
                if (hasGSAP) { moveTo(0); moveToY(0); }
                else { el.style.transform = ''; }
            });
        });
    }

    /* =========================================================
       TILT CARDS + VIGNETTE — consolidated per-frame pointer effects
       ========================================================= */
    const vignette = document.querySelector('.vignette');
    const tiltEls = document.querySelectorAll('[data-tilt]');

    if (!prefersReducedMotion && (vignette || (canHover && tiltEls.length))) {
        let lastMouse = null;
        let fxTicking = false;

        const fxTick = () => {
            fxTicking = false;
            if (!lastMouse) return;

            if (vignette) {
                const x = (lastMouse.clientX / window.innerWidth) * 100;
                const y = (lastMouse.clientY / window.innerHeight) * 100;
                vignette.style.background = `radial-gradient(circle at ${x}% ${y}%, transparent 40%, rgba(127, 29, 29, 0.15) 100%)`;
            }

            if (canHover) {
                tiltEls.forEach(el => {
                    const r = el.getBoundingClientRect();
                    if (lastMouse.clientX < r.left || lastMouse.clientX > r.right || lastMouse.clientY < r.top || lastMouse.clientY > r.bottom) {
                        el.style.transform = '';
                        return;
                    }
                    const px = (lastMouse.clientX - r.left) / r.width - 0.5;
                    const py = (lastMouse.clientY - r.top) / r.height - 0.5;
                    el.style.transform = `perspective(1000px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) scale(1.015) translate3d(0,0,0)`;
                });
            }
        };

        window.addEventListener('mousemove', (e) => {
            lastMouse = e;
            if (!fxTicking) { fxTicking = true; requestAnimationFrame(fxTick); }
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            tiltEls.forEach(el => { el.style.transform = ''; });
        });
    }

    /* =========================================================
       LIST-HERO MOUSE PARALLAX (home hero diagonal stack)
       ========================================================= */
    const listHeroStack = document.querySelector('.list-hero-stack');
    const listHeroSection = document.querySelector('.list-hero');

    if (listHeroStack && listHeroSection && !prefersReducedMotion && canHover && isWideViewport) {
        let tiltTargetX = 0, tiltTargetY = 0;
        let tiltCurrentX = 0, tiltCurrentY = 0;

        listHeroSection.addEventListener('mousemove', (e) => {
            const r = listHeroSection.getBoundingClientRect();
            tiltTargetX = ((e.clientX - r.left) / r.width - 0.5) * 2;
            tiltTargetY = ((e.clientY - r.top) / r.height - 0.5) * 2;
        }, { passive: true });

        listHeroSection.addEventListener('mouseleave', () => { tiltTargetX = 0; tiltTargetY = 0; });

        const tiltLoop = () => {
            tiltCurrentX += (tiltTargetX - tiltCurrentX) * 0.055;
            tiltCurrentY += (tiltTargetY - tiltCurrentY) * 0.055;
            const extraRotate = tiltCurrentX * 2.4;
            const shiftX = tiltCurrentX * 12;
            const shiftY = tiltCurrentY * 16;
            listHeroStack.style.transform = `rotate(${(-8 + extraRotate).toFixed(2)}deg) translate3d(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px, 0)`;
            requestAnimationFrame(tiltLoop);
        };
        requestAnimationFrame(tiltLoop);
    }

    /* =========================================================
       PAGE TRANSITIONS — fade + rise before navigating internally
       ========================================================= */
    if (!prefersReducedMotion) {
        const pageOverlay = document.createElement('div');
        pageOverlay.className = 'page-transition-overlay';
        document.body.appendChild(pageOverlay);

        const mainContent = document.querySelector('main, .list-hero, body > section');

        document.addEventListener('click', (e) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const link = e.target.closest('a[href]');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
            if (link.target === '_blank' || link.hasAttribute('download')) return;

            let url;
            try { url = new URL(href, window.location.href); } catch (err) { return; }
            if (url.origin !== window.location.origin) return;
            if (url.pathname === window.location.pathname && url.hash) return;

            e.preventDefault();
            pageOverlay.classList.add('active');
            if (hasGSAP && mainContent) {
                gsap.to(mainContent, { autoAlpha: 0, y: -20, duration: 0.35, ease: 'power2.inOut' });
            }
            setTimeout(() => { window.location.href = href; }, 380);
        });

        // Gentle entrance on the content that's already in the DOM at load.
        if (hasGSAP && mainContent) {
            gsap.fromTo(mainContent, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.05 });
        }
    }

    /* --- Scroll cue --- */
    const scrollCue = document.querySelector('.scroll-cue');
    if (scrollCue) {
        scrollCue.addEventListener('click', () => {
            const hero = document.querySelector('.list-hero, .hero');
            if (hero) scrollToY(hero.getBoundingClientRect().height);
        });
    }

    /* --- Smooth internal anchor links --- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetSel = this.getAttribute('href');
            if (targetSel === '#') return;
            const target = document.querySelector(targetSel);
            if (target) {
                e.preventDefault();
                const y = target.getBoundingClientRect().top + window.scrollY;
                scrollToY(y);
            }
        });
    });

    /* =========================================================
       LIGHTBOX (with keyboard + swipe navigation)
       ========================================================= */
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox-overlay';
    lightbox.innerHTML = `
        <button class="lightbox-close" aria-label="Cerrar">✕</button>
        <button class="lightbox-nav lightbox-prev" aria-label="Anterior">‹</button>
        <button class="lightbox-nav lightbox-next" aria-label="Siguiente">›</button>
        <span class="lightbox-counter"></span>
        <img class="lightbox-img" src="" alt="">
        <p class="lightbox-caption"></p>
    `;
    document.body.appendChild(lightbox);

    const lbImg = lightbox.querySelector('.lightbox-img');
    const lbCaption = lightbox.querySelector('.lightbox-caption');
    const lbCounter = lightbox.querySelector('.lightbox-counter');
    const lbPrev = lightbox.querySelector('.lightbox-prev');
    const lbNext = lightbox.querySelector('.lightbox-next');

    let galleryImgs = [];
    let galleryIndex = 0;

    const renderLightbox = () => {
        const img = galleryImgs[galleryIndex];
        if (!img) return;
        const wrapper = img.closest('.case-image-large, .case-image-small');
        const captionEl = wrapper ? wrapper.querySelector('.img-caption') : null;
        lbImg.src = img.src;
        lbCaption.textContent = captionEl ? captionEl.textContent : '';
        lbCounter.textContent = galleryImgs.length > 1 ? `${galleryIndex + 1} / ${galleryImgs.length}` : '';
        const multi = galleryImgs.length > 1;
        lbPrev.style.display = multi ? 'flex' : 'none';
        lbNext.style.display = multi ? 'flex' : 'none';
    };

    const openLightbox = (clickedImg) => {
        const gallery = clickedImg.closest('.case-gallery');
        galleryImgs = gallery ? Array.from(gallery.querySelectorAll('img')) : [clickedImg];
        galleryIndex = galleryImgs.indexOf(clickedImg);
        if (galleryIndex < 0) galleryIndex = 0;
        renderLightbox();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (lenis) lenis.stop();
    };

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        if (lenis) lenis.start();
    };

    const stepLightbox = (dir) => {
        if (!galleryImgs.length) return;
        galleryIndex = (galleryIndex + dir + galleryImgs.length) % galleryImgs.length;
        renderLightbox();
    };

    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG' && e.target.closest('.case-gallery')) openLightbox(e.target);
    });

    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', (e) => { e.stopPropagation(); stepLightbox(-1); });
    lbNext.addEventListener('click', (e) => { e.stopPropagation(); stepLightbox(1); });
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') stepLightbox(-1);
        if (e.key === 'ArrowRight') stepLightbox(1);
    });

    let touchStartX = null;
    lightbox.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) stepLightbox(dx > 0 ? -1 : 1);
        touchStartX = null;
    }, { passive: true });

    /* --- Re-run pointer-driven setups after admin-sync injects new DOM (project previews, list-hero) --- */
    window.initProjectPreviews = () => {}; // legacy no-op kept for admin-sync.js compat
    window.initListHero = () => {
        const items = document.querySelectorAll('.list-hero-item');
        const glow = document.getElementById('list-hero-glow');
        const glowImg = document.getElementById('list-hero-glow-img');
        if (!items.length || !glow || !glowImg) return;
        items.forEach(item => {
            if (item.hasAttribute('data-glow-bound')) return;
            item.setAttribute('data-glow-bound', '1');
            item.addEventListener('mouseenter', () => {
                const imgUrl = item.getAttribute('data-image');
                if (imgUrl) { glowImg.src = imgUrl; glow.classList.add('active'); }
            });
            item.addEventListener('mouseleave', () => glow.classList.remove('active'));
        });
    };
    initListHero();

});
