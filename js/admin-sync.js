/**
 * TEKNÉ Admin Sync V3 (Base64 Support)
 * Full Dynamic Content Engine
 */

document.addEventListener('DOMContentLoaded', () => {

    const db = JSON.parse(localStorage.getItem('tekne_v3'));
    if (!db) return;

    // 1. LOGO & NAV
    const branding = document.querySelector('.hero-logo');
    if (branding && db.home.title) branding.textContent = db.home.title;

    // 2. SPLASH HOME
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        const title = document.querySelector('.hero-title span');
        const tagline = document.querySelector('.hero-subtitle span');
        const subtitle = document.querySelector('.hero-main-content div span:not(.hero-nav-item)');

        if (title) title.textContent = db.home.title;
        if (tagline) tagline.textContent = db.home.tagline;
        if (subtitle) subtitle.textContent = db.home.subtitle;
    }

    // 3. SERVICES LIST
    if (window.location.pathname.includes('servicios.html')) {
        const sc = document.querySelector('main.container-large');
        if (sc && db.services) {
            let h = '';
            db.services.forEach((s, i) => {
                const odd = i % 2 !== 0;
                h += `
                    <section class="service-block">
                        ${!odd ? `
                            <div class="service-info" data-reveal>
                                <h2>${s.name}</h2><p>${s.desc}</p>
                            </div>
                            <div class="service-image" data-reveal style="transition-delay: 0.2s;"><img src="${s.img}"></div>
                        ` : `
                            <div class="service-image" data-reveal><img src="${s.img}"></div>
                            <div class="service-info" data-reveal style="transition-delay: 0.2s;">
                                <h2>${s.name}</h2><p>${s.desc}</p>
                            </div>
                        `}
                    </section>
                `;
            });
            sc.innerHTML = h;
        }
    }

    // 4. PROJECTS LISTING
    if (window.location.pathname.includes('proyectos.html')) {
        const pc = document.querySelector('.projects-list');
        if (pc && db.projects) {
            let h = '';
            db.projects.forEach((p, i) => {
                h += `
                    <a href="proyectos/${p.id}.html" class="project-item" data-image="${p.imgs[0]}">
                        <div style="display: flex; align-items: center;">
                            <span class="project-index">0${i + 1}</span>
                            <span class="project-name">${p.name}</span>
                        </div>
                    </a>
                `;
            });
            h += `<div class="project-preview"><img id="project-preview-img" src="${db.projects[0]?.imgs[0]}"></div>`;
            pc.innerHTML = h;
        }
    }

    // 5. INTERNAL CASE STUDY HYDRATION
    if (window.location.pathname.includes('proyectos/') && !window.location.pathname.includes('proyectos.html')) {
        const pageId = window.location.pathname.split('/').pop().replace('.html', '');
        const p = db.projects.find(proj => proj.id === pageId);

        if (p) {
            // Hero
            const t = document.querySelector('.case-hero h1 span');
            if (t) t.textContent = p.name;
            
            // Challenge & Solution
            const ps = document.querySelectorAll('.case-content p');
            if (ps[0]) ps[0].textContent = p.challenge;
            if (ps[1]) ps[1].textContent = p.solution;

            // Gallery (Change ANY image in the project)
            const imgs = document.querySelectorAll('.case-gallery img');
            p.imgs.forEach((url, idx) => {
                if (imgs[idx]) imgs[idx].src = url;
            });

            // Metrics
            const mVs = document.querySelectorAll('.metric-value');
            const mLs = document.querySelectorAll('.metric-label');
            if (mVs[0]) mVs[0].textContent = p.m1[0];
            if (mLs[0]) mLs[0].textContent = p.m1[1];
            if (mVs[1]) mVs[1].textContent = p.m2[0];
            if (mLs[1]) mLs[1].textContent = p.m2[1];
        }
    }

    // Trigger reveal
    if (window.revealOnScroll) window.revealOnScroll();

});
