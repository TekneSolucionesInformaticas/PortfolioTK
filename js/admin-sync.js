/**
 * TEKNÉ Admin Sync V4 - Global JSON Source
 * Reads from data/site-content.json (shared across all devices).
 * Falls back to localStorage only if JSON fetch fails (e.g. local dev).
 */

document.addEventListener('DOMContentLoaded', async () => {

    // Resolve base path: works from root pages AND from proyectos/ subdirectory
    const isSubdir = /proyectos\//.test(window.location.pathname);
    const basePath = isSubdir ? '../' : '';

    // Image URLs in the JSON are stored root-relative (e.g. "img/projects/opersa/hero.jpg").
    // Most existing images are self-contained base64 data URIs, but on-disk file paths need
    // the same basePath adjustment as the JSON fetch above when rendered from a subdirectory page.
    const resolveImg = (url) => {
        if (!url || url.startsWith('data:') || /^https?:\/\//.test(url) || url.startsWith('/')) return url;
        return basePath + url;
    };

    // 1. Try shared global JSON first (works on every device)
    let db = null;
    try {
        const res = await fetch(basePath + 'data/site-content.json', { cache: 'default' });
        if (res.ok) db = await res.json();
    } catch (e) { /* ignore */ }

    // 2. Fallback to localStorage only if JSON unavailable (offline / local dev)
    if (!db) db = JSON.parse(localStorage.getItem('tekne_v3'));
    if (!db) { document.body.classList.add('synced'); return; }

    // 1. GLOBAL LOGO
    const branding = document.querySelector('.hero-logo');
    if (branding && db.home.title) branding.textContent = db.home.title;

    // 2. SPLASH HOME (index.html)
    const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('PortfolioTK/');
    if (isHome) {
        const title = document.querySelector('.hero-title span');
        const tagline = document.querySelector('.hero-subtitle span');
        const subtitle = document.querySelector('.hero-main-content div span:not(.hero-nav-item)');

        if (title) title.textContent = db.home.title;
        if (tagline) tagline.textContent = db.home.tagline;
        if (subtitle) subtitle.textContent = db.home.subtitle;

        // 2b. "QUÉ HACEMOS" teaser — reuses db.services
        const svcGrid = document.querySelector('.home-services-grid');
        if (svcGrid && db.services && db.services.length) {
            svcGrid.innerHTML = db.services.slice(0, 3).map(s => `
                <div class="home-service-card" data-reveal>
                    <img src="${resolveImg(s.img)}" alt="${s.name || ''}" loading="lazy" decoding="async">
                    <h3>${s.name || ''}</h3>
                    <p>${s.desc || ''}</p>
                </div>
            `).join('');
        }

        // 2c. List-hero — giant diagonal stack of every real project
        const listStack = document.querySelector('.list-hero-stack');
        if (listStack && db.projects && db.projects.length) {
            listStack.innerHTML = db.projects.map((p, i) => {
                const isLegacy = ['remitos', 'app-movil'].includes(p.id);
                const url = isLegacy ? `proyectos/${p.id}.html` : `proyectos/detalle.html?id=${p.id}`;
                return `
                    <a href="${url}" class="list-hero-item reveal-text" data-image="${resolveImg(p.imgs[0])}">
                        <span class="list-hero-tick">${p.cat || ''}</span>
                        <span class="list-hero-name" style="transition-delay:${0.04 * i}s;">${p.name}</span>
                    </a>
                `;
            }).join('');
        }

        // 2d. Stats strip — additive optional field, degrades gracefully if absent
        const statsStrip = document.querySelector('.stats-strip');
        if (statsStrip && db.home.stats && db.home.stats.length) {
            statsStrip.innerHTML = db.home.stats.map(s => `
                <div class="stat-item" data-reveal-blur>
                    <span class="stat-value" data-count="${s.value}">0</span>
                    <span class="stat-label">${s.label}</span>
                </div>
            `).join('');
        }

        // 2e. About teaser — additive optional field
        const aboutEl = document.querySelector('.about-teaser p');
        if (aboutEl && db.home.about) aboutEl.innerHTML = db.home.about;

        // 2f. "Más Proyectos" logo tiles — additive optional field
        const logoGrid = document.querySelector('.logo-tiles-grid');
        if (logoGrid && db.logoProjects && db.logoProjects.length) {
            logoGrid.innerHTML = db.logoProjects.map(p => `
                <div class="logo-tile" data-reveal data-accent="${p.accent || 'red'}">
                    ${p.img ? `<div class="logo-tile-media"><img src="${resolveImg(p.img)}" alt="${p.name}" loading="lazy" decoding="async"></div>` : ''}
                    <div class="logo-tile-body">
                        <h3 class="logo-tile-name">${p.name}</h3>
                        <p class="logo-tile-desc">${p.desc || ''}</p>
                    </div>
                    <div class="logo-tile-tags">${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
                </div>
            `).join('');
        }
    }

    // 3. INTERNAL CASE STUDY HYDRATION (proyectos/*.html) — servicios.html and
    // proyectos.html no longer exist as standalone pages; their content now
    // lives inside the isHome block above (home-services-grid, logo-tiles-grid).
    const isDetallePage = window.location.pathname.includes('detalle.html');
    const isLegacyProject = window.location.pathname.includes('proyectos/') && !isDetallePage;

    if (isDetallePage || isLegacyProject) {
        let pId;
        if (isDetallePage) {
            const urlParams = new URLSearchParams(window.location.search);
            pId = urlParams.get('id');
        } else {
            pId = window.location.pathname.split('/').pop().replace('.html', '');
        }

        const p = db.projects.find(proj => proj.id === pId);

        if (p) {
            // Hydrate Detalle.html Elements
            const t = document.getElementById('case-title') || document.querySelector('.case-hero h1 span');
            if (t) t.textContent = p.name;
            
            // Hero subtitle is static ("Diseñado y desarrollado por TEKNÉ") — no override needed

            const catEl = document.getElementById('case-cat');
            if (catEl) catEl.textContent = p.cat;

            const cText = document.getElementById('case-challenge-text') || document.querySelectorAll('.case-content p')[0];
            if (cText) cText.textContent = p.challenge;
            
            const sText = document.getElementById('case-solution-text') || document.querySelectorAll('.case-content p')[1];
            if (sText) sText.textContent = p.solution;

            // Gallery (Dynamic Grid Generation)
            const gCont = document.querySelector('.case-gallery');
            if (gCont && p.imgs) {
                let gH = '';
                p.imgs.forEach((url, i) => {
                    // Logic: 1st is large, 2nd & 3rd are small. Others follow a 2x2 grid.
                    const isL = i === 0;
                    const caption = (p.captions && p.captions[i]) ? p.captions[i] : '';
                    gH += `
                        <div class="${isL ? 'case-image-large' : 'case-image-small'}" data-reveal data-tilt style="transition-delay: ${0.1 * i}s;">
                            <img src="${resolveImg(url)}" alt="${p.name} — imagen ${i + 1}" loading="lazy" decoding="async">
                            ${caption ? `<p class="img-caption">${caption}</p>` : ''}
                        </div>
                    `;
                });
                gCont.innerHTML = gH;
            }

            // Metrics
            const m1v = document.getElementById('case-m1v') || document.querySelectorAll('.metric-value')[0];
            const m1l = document.getElementById('case-m1l') || document.querySelectorAll('.metric-label')[0];
            const m2v = document.getElementById('case-m2v') || document.querySelectorAll('.metric-value')[1];
            const m2l = document.getElementById('case-m2l') || document.querySelectorAll('.metric-label')[1];

            if (m1v) m1v.textContent = p.m1[0];
            if (m1l) m1l.textContent = p.m1[1];
            if (m2v) m2v.textContent = p.m2[0];
            if (m2l) m2l.textContent = p.m2[1];
        }
    }

    // Trigger reveal & previews
    if (window.revealOnScroll) window.revealOnScroll();
    if (window.initProjectPreviews) window.initProjectPreviews();
    if (window.initListHero) window.initListHero();

    // Mark body as synced so CSS can reveal hidden sections
    document.body.classList.add('synced');

});
