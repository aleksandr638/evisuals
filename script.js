// --- ЗАГРУЗКА ХЕДЕРА И ФУТЕРА ---
async function loadIncludes() {
    try {
        // Загрузка Header
        const headerRes = await fetch('header.html');
        if (headerRes.ok) {
            const headerHtml = await headerRes.text();
            document.getElementById('header-placeholder').outerHTML = headerHtml;
        }

        // Загрузка Footer
        const footerRes = await fetch('footer.html');
        if (footerRes.ok) {
            const footerHtml = await footerRes.text();
            document.getElementById('footer-placeholder').outerHTML = footerHtml;
        }
    } catch (error) {
        console.warn('Локальный запуск (file:///). Хедер и футер не подгружены.', error);
    } finally {
        // ВАЖНО: Запускаем анимации сайта ВСЕГДА, даже если была ошибка загрузки файлов
        initApp();
    }
}

document.addEventListener('DOMContentLoaded', loadIncludes);

// --- ВСЯ ОСТАЛЬНАЯ ЛОГИКА САЙТА ---
function initApp() {
    
    // 0. Корректировка ссылок для главной страницы
    const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    if (isHomePage) {
        document.querySelectorAll('header a[href^="index.html#"]').forEach(link => {
            const href = link.getAttribute('href');
            link.setAttribute('href', href.replace('index.html', ''));
        });
    }

    // 1. Lenis Smooth Scroll
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time)=>{ lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    window.addEventListener('load', () => ScrollTrigger.refresh());
    new ResizeObserver(() => ScrollTrigger.refresh()).observe(document.body);

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = this.getAttribute('href');
            if(target.length > 1) {
                e.preventDefault();
                lenis.scrollTo(target, { offset: -50 });
            }
        });
    });

    gsap.registerPlugin(ScrollTrigger);

    // 2. Универсальная анимация появления (GSAP Reveal)
    document.querySelectorAll('.gsap-reveal').forEach((elem) => {
        gsap.set(elem, { autoAlpha: 0, y: 30 });
        gsap.to(elem, {
            scrollTrigger: { trigger: elem, start: "top 85%" },
            autoAlpha: 1, y: 0, duration: 1, ease: "power2.out", stagger: 0.1
        });
    });

    // 3. Анимация счетчиков
    const counters = document.querySelectorAll('.counter');
    if (counters.length > 0) {
        gsap.utils.toArray(counters).forEach(counter => {
            let target = parseFloat(counter.getAttribute('data-target'));
            ScrollTrigger.create({
                trigger: counter.closest('.metric-item'),
                start: "top 85%",
                onEnter: () => {
                    gsap.to(counter, { innerHTML: target, duration: 2.5, snap: { innerHTML: 1 }, ease: "power2.out" });
                },
                once: true 
            });
        });
    }

    // 4. Логика фильтров портфолио
    const filterBtns = document.querySelectorAll('.filter-btn');
    const gallery = document.getElementById('portfolio-gallery');
    if (filterBtns.length > 0 && gallery) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const view = btn.getAttribute('data-view');
                if (view === 'list') {
                    gallery.classList.remove('view-grid');
                    gallery.classList.add('view-list');
                } else {
                    gallery.classList.remove('view-list');
                    gallery.classList.add('view-grid');
                }
                setTimeout(() => ScrollTrigger.refresh(), 400);
            });
        });
    }

    // 5. Прячущийся Header
    let lastScroll = 0;
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll > lastScroll && currentScroll > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            lastScroll = currentScroll;
        });
    }

    // 6. Кастомный Dropdown
    const selectWrapper = document.getElementById('custom-select');
    if (selectWrapper) {
        const select = selectWrapper.querySelector('.custom-select');
        const trigger = selectWrapper.querySelector('.custom-select-trigger');
        const triggerText = trigger.querySelector('span');
        const options = selectWrapper.querySelectorAll('.custom-option');
        const hiddenInput = document.getElementById('site_type_input');

        trigger.addEventListener('click', function() { select.classList.toggle('open'); });

        options.forEach(option => {
            option.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                const text = this.textContent;
                triggerText.textContent = text;
                triggerText.classList.add('selected-text'); 
                hiddenInput.value = value;
                select.classList.remove('open');
            });
        });

        window.addEventListener('click', function(e) {
            if (!select.contains(e.target)) { select.classList.remove('open'); }
        });
    }

    // 7. Логика FAQ
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const faqHeader = item.querySelector('.faq-header');
            const content = item.querySelector('.faq-content');
            
            faqHeader.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-content').style.maxHeight = null;
                });
                if (!isActive) {
                    item.classList.add('active');
                    content.style.maxHeight = content.scrollHeight + "px";
                }
                setTimeout(() => ScrollTrigger.refresh(), 400);
            });
        });
    }

    // 8. ASCII 3D Анимация
    const asciiCanvas = document.getElementById('ascii-canvas');
    if(asciiCanvas && window.innerWidth > 600) { 
        let A = 0, B = 0;
        const chars = " .,-~:;=!*#$@";
        
        function renderAscii() {
            const width = 110; const height = 45; 
            const b = []; const z = [];

            A += 0.04; B += 0.02;
            const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);

            for (let k = 0; k < width * height; k++) { b[k] = k % width === width - 1 ? '\n' : ' '; z[k] = 0; }

            for (let j = 0; j < 6.28; j += 0.07) { 
                const ct = Math.cos(j), st = Math.sin(j);
                for (let i = 0; i < 6.28; i += 0.02) { 
                    const sp = Math.sin(i), cp = Math.cos(i);
                    const h = ct + 2; const D = 1 / (sp * h * sA + st * cA + 5); const t = sp * h * cA - st * sA;
                    const x = Math.floor(width / 2 + 45 * D * (cp * h * cB - t * sB));
                    const y = Math.floor(height / 2 + 22 * D * (cp * h * sB + t * cB));
                    const o = x + width * y;
                    const N = Math.floor(8 * ((st * sA - sp * ct * cA) * cB - sp * ct * sA - st * cA - cp * ct * sB));

                    if (y >= 0 && y < height && x >= 0 && x < width - 1 && D > z[o]) { z[o] = D; b[o] = chars[N > 0 ? N : 0]; }
                }
            }
            asciiCanvas.innerText = b.join('');
            requestAnimationFrame(renderAscii);
        }
        renderAscii();
    }
}

// --- ЛОГИКА LIGHTBOX (ГАЛЕРЕЯ КЕЙСОВ) ---
document.addEventListener('DOMContentLoaded', () => {
    const galleryItems = document.querySelectorAll('.gallery-item img');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');

    if (galleryItems.length > 0 && lightbox) {
        // Открытие фото
        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                lightboxImg.src = item.src;
                lightbox.classList.add('active');
                
                // Отключаем скролл страницы на фоне (учитывая Lenis)
                document.documentElement.classList.add('lenis-stopped');
                document.body.style.overflow = 'hidden';
            });
        });

        // Функция закрытия
        const closeLightbox = () => {
            lightbox.classList.remove('active');
            
            // Ждем завершения анимации затухания перед очисткой src
            setTimeout(() => {
                lightboxImg.src = '';
            }, 400);

            // Включаем скролл обратно
            document.documentElement.classList.remove('lenis-stopped');
            document.body.style.overflow = '';
        };

        // Закрытие по крестику
        lightboxClose.addEventListener('click', closeLightbox);

        // Закрытие по клику на темный фон
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Закрытие по клавише ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                closeLightbox();
            }
        });
    }
});

// --- ЛОГИКА ДЛЯ ВИДЕО ГАЛЕРЕИ (Play/Pause, только 1 видео одновременно) ---
document.addEventListener('DOMContentLoaded', () => {
    const customPlayers = document.querySelectorAll('.video-wrapper.custom-player');

    if (customPlayers.length > 0) {
        customPlayers.forEach(player => {
            const video = player.querySelector('video');

            // Обработка клика по видео
            player.addEventListener('click', () => {
                
                // Если кликнутое видео было на паузе
                if (video.paused) {
                    
                    // 1. Сначала ставим на паузу ВСЕ остальные видео
                    customPlayers.forEach(otherPlayer => {
                        if (otherPlayer !== player) {
                            const otherVideo = otherPlayer.querySelector('video');
                            otherVideo.pause();
                            otherPlayer.classList.remove('is-playing');
                        }
                    });

                    // 2. Затем запускаем наше видео
                    video.play().then(() => {
                        player.classList.add('is-playing');
                    }).catch(err => console.log("Ошибка воспроизведения:", err));
                    
                } else {
                    // Если кликнули по видео, которое уже играет — ставим его на паузу
                    video.pause();
                    player.classList.remove('is-playing');
                }
            });

            // Когда видео заканчивается само (если не стоит loop), возвращаем кнопку Play
            video.addEventListener('ended', () => {
                player.classList.remove('is-playing');
                // Если хотите, чтобы видео зацикливалось, раскомментируйте следующие 2 строки:
                // video.currentTime = 0; 
                // video.play(); player.classList.add('is-playing');
            });
        });
    }
});