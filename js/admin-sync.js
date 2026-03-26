/**
 * TEKNÉ Admin Sync V4 - Global JSON Source
 * Reads from data/site-content.json (shared across all devices).
 * Falls back to localStorage only if JSON fetch fails (e.g. local dev).
 */

document.addEventListener('DOMContentLoaded', async () => {

    // Resolve base path: works from root pages AND from proyectos/ subdirectory
    const isSubdir = /proyectos\//.test(window.location.pathname);
    const basePath = isSubdir ? '../' : '';

    // 1. Try shared global JSON first (works on every device)
    let db = null;
    try {
        const res = await fetch(basePath + 'data/site-content.json', { cache: 'no-store' });
        if (res.ok) db = await res.json();
    } catch (e) { /* ignore */ }

    // 2. Fallback to localStorage only if JSON unavailable (offline / local dev)
    if (!db) db = JSON.parse(localStorage.getItem('tekne_v3'));
    if (!db) { document.body.classList.add('synced'); return; }

    // 1. GLOBAL LOGO
    const branding = document.querySelector('.hero-logo');
    if (branding && db.home.title) branding.textContent = db.home.title;

    // 2. SPLASH HOME (index.html)
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('PortfolioTK/')) {
        const title = document.querySelector('.hero-title span');
        const tagline = document.querySelector('.hero-subtitle span');
        const subtitle = document.querySelector('.hero-main-content div span:not(.hero-nav-item)');

        if (title) title.textContent = db.home.title;
        if (tagline) tagline.textContent = db.home.tagline;
        if (subtitle) subtitle.textContent = db.home.subtitle;
    }

    // 3. SERVICES LIST (servicios.html)
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

    // 4. PROJECTS LISTING (proyectos.html)
    if (window.location.pathname.includes('proyectos.html')) {
        const pc = document.querySelector('.projects-list');
        if (pc && db.projects) {
            let h = '';
            db.projects.forEach((p, i) => {
                // Determine the correct URL: use specific file for legacy, or detalle.html for new ones
                const isLegacy = ['remitos', 'app-movil', 'sistema-web'].includes(p.id);
                const projectUrl = isLegacy ? `proyectos/${p.id}.html` : `proyectos/detalle.html?id=${p.id}`;
                
                h += `
                    <a href="${projectUrl}" class="project-item" data-image="${p.imgs[0]}">
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

    // 5. INTERNAL CASE STUDY HYDRATION (proyectos/*.html)
    const isDetallePage = window.location.pathname.includes('detalle.html');
    const isLegacyProject = window.location.pathname.includes('proyectos/') && !window.location.pathname.includes('proyectos.html');

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
            
            const pd = document.getElementById('case-hero-desc') || document.querySelector('.case-hero p');
            if (pd) pd.textContent = p.challenge.substring(0, 150) + "..."; // Fallback text

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
                        <div class="${isL ? 'case-image-large' : 'case-image-small'}" data-reveal style="transition-delay: ${0.1 * i}s;">
                            <img src="${url}">
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

    // Mark body as synced so CSS can reveal hidden sections
    document.body.classList.add('synced');

});
