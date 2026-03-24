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
    if (projectItems.length > 0 && projectPreview) {
        projectItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                const imgUrl = item.getAttribute('data-image');
                if (imgUrl) {
                    previewImg.src = imgUrl;
                    // Reset opacity for a fresh fade
                    previewImg.style.opacity = '0';
                    setTimeout(() => {
                        previewImg.style.opacity = '0.8';
                    }, 50);
                }
            });
        });
    }

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

});
