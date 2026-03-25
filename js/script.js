/**
 * TEKNÉ Soluciones Tecnológicas - PREMIUM PORTFOLIO JS
 * Handle all logic for scroll behavior, animations and dynamic interactions.
 * Inspiration: Seungmee Lee (Transitions & Micro-interactions)
 */

document.addEventListener('DOMContentLoaded', () => {

    /* --- Constants --- */
    const reveals = document.querySelectorAll('[data-reveal]');
    const revealTexts = document.querySelectorAll('.reveal-text');
    const projectItems = document.querySelectorAll('.project-item');
    const projectPreview = document.querySelector('.project-preview');
    const previewImg = document.getElementById('project-preview-img');

    const topNav = document.querySelector('.hero-top-nav');

    /* --- Mobile Hamburger Menu --- */
    if (topNav) {
        // Inject burger button into nav
        const burger = document.createElement('button');
        burger.className = 'nav-burger';
        burger.setAttribute('aria-label', 'Menú');
        burger.innerHTML = '<span></span><span></span><span></span>';
        topNav.appendChild(burger);

        // Build mobile overlay by cloning existing nav links
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        topNav.querySelectorAll('a').forEach(link => {
            const clone = link.cloneNode(true);
            clone.removeAttribute('style'); // strip inline color/font from some links
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

        // Close on link click (navigation)
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) closeMobileMenu();
        });
    }

    /* --- Navbar Scroll State --- */
    const updateNavbar = () => {
        if (window.scrollY > 100) {
            topNav.classList.add('scrolled');
        } else {
            topNav.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', updateNavbar);
    updateNavbar();

    /* --- Immediate Transitions (On Load) --- */
    setTimeout(() => {
        revealTexts.forEach(el => el.classList.add('revealed'));
    }, 100);

    /* --- Scroll Reveal Animation --- */
    const revealOnScroll = () => {
        reveals.forEach(el => {
            const revealTop = el.getBoundingClientRect().top;
            const revealPoint = 150;

            if (revealTop < window.innerHeight - revealPoint) {
                el.classList.add('revealed');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

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

    /* --- Mouse Follow Vignette (Premium Detail) --- */
    const vignette = document.querySelector('.vignette');
    if (vignette) {
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            vignette.style.background = `radial-gradient(circle at ${x}% ${y}%, transparent 40%, rgba(127, 29, 29, 0.15) 100%)`;
        });
    }

    /* --- Smooth Internal Links --- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    /* --- Lightbox --- */
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox-overlay';
    lightbox.innerHTML = `
        <button class="lightbox-close" aria-label="Cerrar">✕</button>
        <img class="lightbox-img" src="" alt="">
        <p class="lightbox-caption"></p>
    `;
    document.body.appendChild(lightbox);

    const lbImg = lightbox.querySelector('.lightbox-img');
    const lbCaption = lightbox.querySelector('.lightbox-caption');

    const openLightbox = (src, caption) => {
        lbImg.src = src;
        lbCaption.textContent = caption || '';
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    };

    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG' && e.target.closest('.case-gallery')) {
            const wrapper = e.target.closest('.case-image-large, .case-image-small');
            const captionEl = wrapper ? wrapper.querySelector('.img-caption') : null;
            openLightbox(e.target.src, captionEl ? captionEl.textContent : '');
        }
    });

    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

});
