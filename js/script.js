/**
 * TEKNÉ Soluciones Tecnológicas - PREMIUM PORTFOLIO JS
 * Handle all logic for scroll behavior, animations and dynamic interactions.
 */

document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* --- Constants --- */
    const projectPreview = document.querySelector('.project-preview');

    const topNav = document.querySelector('.hero-top-nav');

    /* --- Mobile Hamburger Menu --- */
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
        };

        burger.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('active');
            burger.classList.toggle('active', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) closeMobileMenu();
        });
    }

    /* --- Navbar Scroll State --- */
    const updateNavbar = () => {
        if (!topNav) return;
        if (window.scrollY > 100) {
            topNav.classList.add('scrolled');
        } else {
            topNav.classList.remove('scrolled');
        }
    };

    /* --- Reveal Animations (IntersectionObserver) --- */
    const observedReveals = new WeakSet();
    let revealObserver = null;

    if ('IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });
    }

    // Scans the DOM for any reveal-ready element not yet observed and hooks it up.
    // Exposed as window.revealOnScroll for backward compatibility — admin-sync.js
    // calls this after injecting new dynamic content into the page.
    const observeReveals = () => {
        const els = document.querySelectorAll('[data-reveal], .reveal-text, [data-reveal-blur]');
        els.forEach(el => {
            if (observedReveals.has(el)) return;
            observedReveals.add(el);
            if (revealObserver) {
                revealObserver.observe(el);
            } else {
                el.classList.add('revealed'); // no IO support — just show it
            }
        });
    };

    window.revealOnScroll = observeReveals;
    observeReveals();

    // Reveal-text spans on hero-type headers fire immediately on load, not on scroll into view.
    setTimeout(() => {
        document.querySelectorAll('.hero-title.reveal-text, .hero-subtitle.reveal-text, .hero-main-content .reveal-text').forEach(el => {
            el.classList.add('revealed');
        });
    }, 100);

    let navTicking = false;
    window.addEventListener('scroll', () => {
        if (!navTicking) {
            navTicking = true;
            requestAnimationFrame(() => { updateNavbar(); navTicking = false; });
        }
    }, { passive: true });
    updateNavbar();

    /* --- Project List Hover Preview (Split-Screen) --- */
    window.initProjectPreviews = () => {
        const items = document.querySelectorAll('.project-item');
        const pImg = document.getElementById('project-preview-img');

        if (items.length > 0 && pImg) {
            items.forEach(item => {
                item.addEventListener('mouseenter', () => {
                    const imgUrl = item.getAttribute('data-image');
                    if (imgUrl) {
                        pImg.src = imgUrl;
                        pImg.style.opacity = '0';
                        setTimeout(() => { pImg.style.opacity = '0.8'; }, 50);
                    }
                });
            });
        }
    };

    initProjectPreviews();

    /* --- List Hero Hover Glow (giant diagonal project stack on home) --- */
    window.initListHero = () => {
        const items = document.querySelectorAll('.list-hero-item');
        const glow = document.getElementById('list-hero-glow');
        const glowImg = document.getElementById('list-hero-glow-img');
        if (!items.length || !glow || !glowImg) return;

        items.forEach(item => {
            item.addEventListener('mouseenter', () => {
                const imgUrl = item.getAttribute('data-image');
                if (imgUrl) {
                    glowImg.src = imgUrl;
                    glow.classList.add('active');
                }
            });
            item.addEventListener('mouseleave', () => {
                glow.classList.remove('active');
            });
        });
    };

    initListHero();

    /* --- Animated Stat Counters --- */
    const animateCounter = (el) => {
        const raw = el.getAttribute('data-count') || el.textContent;
        const match = raw.match(/(-?\d[\d.,]*)/);
        if (!match) return;

        const prefix = raw.slice(0, match.index);
        const suffix = raw.slice(match.index + match[0].length);
        const target = parseFloat(match[0].replace(/\./g, '').replace(',', '.'));
        if (isNaN(target)) return;

        if (prefersReducedMotion) {
            el.textContent = prefix + match[0] + suffix;
            return;
        }

        const duration = 1200;
        const start = performance.now();
        const step = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const current = Math.round(target * eased);
            el.textContent = prefix + current + suffix;
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const statEls = document.querySelectorAll('.stat-value[data-count]');
    if (statEls.length && 'IntersectionObserver' in window) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        statEls.forEach(el => counterObserver.observe(el));
    } else {
        statEls.forEach(animateCounter);
    }

    /* --- Consolidated pointer-driven fx: vignette glow, magnetic buttons, tilt cards --- */
    const vignette = document.querySelector('.vignette');
    const magneticEls = document.querySelectorAll('[data-magnetic]');
    const tiltEls = document.querySelectorAll('[data-tilt]');
    const canHover = window.matchMedia('(hover: hover)').matches;

    if (!prefersReducedMotion && (vignette || (canHover && (magneticEls.length || tiltEls.length)))) {
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
                magneticEls.forEach(el => {
                    const r = el.getBoundingClientRect();
                    const cx = r.left + r.width / 2;
                    const cy = r.top + r.height / 2;
                    const dx = lastMouse.clientX - cx;
                    const dy = lastMouse.clientY - cy;
                    const dist = Math.hypot(dx, dy);
                    const radius = Math.max(r.width, r.height) * 1.6;
                    if (dist < radius) {
                        const pull = (1 - dist / radius) * 0.35;
                        el.style.transform = `translate(${dx * pull}px, ${dy * pull}px)`;
                    } else {
                        el.style.transform = '';
                    }
                });

                tiltEls.forEach(el => {
                    const r = el.getBoundingClientRect();
                    if (lastMouse.clientX < r.left || lastMouse.clientX > r.right || lastMouse.clientY < r.top || lastMouse.clientY > r.bottom) {
                        el.style.transform = '';
                        return;
                    }
                    const px = (lastMouse.clientX - r.left) / r.width - 0.5;
                    const py = (lastMouse.clientY - r.top) / r.height - 0.5;
                    el.style.transform = `perspective(1000px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) scale(1.015)`;
                });
            }
        };

        window.addEventListener('mousemove', (e) => {
            lastMouse = e;
            if (!fxTicking) {
                fxTicking = true;
                requestAnimationFrame(fxTick);
            }
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            magneticEls.forEach(el => { el.style.transform = ''; });
            tiltEls.forEach(el => { el.style.transform = ''; });
        });
    }

    /* --- List-hero mouse parallax: the diagonal stack subtly tracks the cursor,
       layered on top of its static -8deg rotation, lerped for a fluid feel --- */
    const listHeroStack = document.querySelector('.list-hero-stack');
    const listHeroSection = document.querySelector('.list-hero');
    const isWideViewport = window.matchMedia('(min-width: 769px)').matches;

    if (listHeroStack && listHeroSection && !prefersReducedMotion && canHover && isWideViewport) {
        let tiltTargetX = 0, tiltTargetY = 0;
        let tiltCurrentX = 0, tiltCurrentY = 0;

        listHeroSection.addEventListener('mousemove', (e) => {
            const r = listHeroSection.getBoundingClientRect();
            tiltTargetX = ((e.clientX - r.left) / r.width - 0.5) * 2;
            tiltTargetY = ((e.clientY - r.top) / r.height - 0.5) * 2;
        }, { passive: true });

        listHeroSection.addEventListener('mouseleave', () => {
            tiltTargetX = 0;
            tiltTargetY = 0;
        });

        const tiltLoop = () => {
            tiltCurrentX += (tiltTargetX - tiltCurrentX) * 0.055;
            tiltCurrentY += (tiltTargetY - tiltCurrentY) * 0.055;
            const extraRotate = tiltCurrentX * 2.4;
            const shiftX = tiltCurrentX * 12;
            const shiftY = tiltCurrentY * 16;
            listHeroStack.style.transform = `rotate(${(-8 + extraRotate).toFixed(2)}deg) translate(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px)`;
            requestAnimationFrame(tiltLoop);
        };
        requestAnimationFrame(tiltLoop);
    }

    /* --- Page transitions: a smooth fade-to-background instead of a hard cut
       when navigating to another internal page --- */
    if (!prefersReducedMotion) {
        const pageOverlay = document.createElement('div');
        pageOverlay.className = 'page-transition-overlay';
        document.body.appendChild(pageOverlay);

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
            setTimeout(() => { window.location.href = href; }, 380);
        });
    }

    /* --- Scroll cue --- */
    const scrollCue = document.querySelector('.scroll-cue');
    if (scrollCue) {
        scrollCue.addEventListener('click', () => {
            const hero = document.querySelector('.hero');
            if (hero) {
                window.scrollTo({ top: hero.getBoundingClientRect().height, behavior: 'smooth' });
            }
        });
    }

    /* --- Smooth Internal Links --- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetSel = this.getAttribute('href');
            if (targetSel === '#') return;
            const target = document.querySelector(targetSel);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* --- Lightbox (with keyboard + swipe navigation) --- */
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
    };

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    };

    const stepLightbox = (dir) => {
        if (!galleryImgs.length) return;
        galleryIndex = (galleryIndex + dir + galleryImgs.length) % galleryImgs.length;
        renderLightbox();
    };

    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG' && e.target.closest('.case-gallery')) {
            openLightbox(e.target);
        }
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

});
