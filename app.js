document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // DOM ELEMENTS
    // ==========================================================================
    const loader = document.getElementById('loader');
    const percentText = document.getElementById('progress-percent');
    const progressRing = document.querySelector('.progress-ring__circle');
    const canvas = document.getElementById('animation-canvas');
    const track = document.querySelector('.scroll-track');
    const navbar = document.getElementById('navbar');
    const heroText = document.getElementById('hero-text');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    // ==========================================================================
    // MOBILE NAVIGATION & HAMBURGER TOGGLE
    // ==========================================================================
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // ==========================================================================
    // SCROLL REVEALS (INTERSECTION OBSERVER)
    // ==========================================================================
    const revealElements = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(element => {
            revealObserver.observe(element);
        });
    } else {
        revealElements.forEach(element => {
            element.classList.add('active');
        });
    }

    // ==========================================================================
    // ANCHOR LINKS SMOOTH SCROLL
    // ==========================================================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const targetElement = document.querySelector(href);
            if (targetElement) {
                e.preventDefault();
                const offsetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - 80;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==========================================================================
    // FRAME-BY-FRAME SCROLL ANIMATION CONFIG & STATE
    // ==========================================================================
    const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
    const totalFrames = 221;
    const images = [];
    let loadedCount = 0;

    let currentFrameIndex = 1;
    let targetFrameIndex = 1;
    let isDrawing = false;
    let dpr = window.devicePixelRatio || 1;

    const ringRadius = 50;
    const ringCircumference = 2 * Math.PI * ringRadius;

    if (progressRing) {
        progressRing.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
        progressRing.style.strokeDashoffset = ringCircumference;
    }

    let canvasWidth = 0;
    let canvasHeight = 0;

    // 1. Preload all image frames
    function preloadImages() {
        if (!canvas) return; // Exit if canvas is not on the page

        for (let i = 1; i <= totalFrames; i++) {
            const img = new Image();
            const frameNum = String(i).padStart(3, '0');
            img.src = `./ezgif-frame-${frameNum}.jpg`;

            img.onload = () => {
                loadedCount++;
                updateLoaderProgress();
                if (loadedCount === totalFrames) {
                    onPreloadComplete();
                }
            };

            img.onerror = () => {
                console.error(`Failed to load frame ${frameNum}`);
                loadedCount++;
                updateLoaderProgress();
                if (loadedCount === totalFrames) {
                    onPreloadComplete();
                }
            };

            images.push(img);
        }
    }

    // Update loader UI progress ring and percent text
    function updateLoaderProgress() {
        const progress = Math.min(100, Math.round((loadedCount / totalFrames) * 100));
        if (percentText) percentText.textContent = `${progress}%`;

        if (progressRing) {
            const offset = ringCircumference - (progress / 100) * ringCircumference;
            progressRing.style.strokeDashoffset = offset;
        }
    }

    // Once preload finishes, remove loader and init scroll event listeners
    function onPreloadComplete() {
        setTimeout(() => {
            if (loader) {
                loader.classList.add('fade-out');
                loader.addEventListener('transitionend', () => {
                    loader.style.display = 'none';
                }, { once: true });
            }

            initCanvas();
            window.addEventListener('resize', handleResize);
            window.addEventListener('scroll', handleScroll, { passive: true });

            handleScroll();
        }, 600);
    }

    // 2. Fit and scale high-DPI canvas
    function initCanvas() {
        if (!canvas) return;
        const width = canvas.parentElement.clientWidth;
        const height = canvas.parentElement.clientHeight;
        dpr = window.devicePixelRatio || 1;

        canvasWidth = width;
        canvasHeight = height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        drawFrame(1);
    }

    function handleResize() {
        requestAnimationFrame(initCanvas);
    }

    // Preserves aspect ratio (contain style drawing)
    function drawFrame(frameIndex) {
        const img = images[frameIndex - 1];
        if (!img || !img.complete || !ctx) return;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const imgRatio = imgWidth / imgHeight;
        const canvasRatio = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, xOffset, yOffset;

        if (canvasRatio > imgRatio) {
            drawHeight = canvasHeight;
            drawWidth = canvasHeight * imgRatio;
            xOffset = (canvasWidth - drawWidth) / 2;
            yOffset = 0;
        } else {
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imgRatio;
            xOffset = 0;
            yOffset = (canvasHeight - drawHeight) / 2;
        }

        ctx.drawImage(img, xOffset, yOffset, drawWidth, drawHeight);
    }

    // 3. Scroll tracking & eased render loop
    function handleScroll() {
        // Sticky bar background transitions
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        if (!track || !canvas) return;

        const rect = track.getBoundingClientRect();
        const scrollableDistance = rect.height - window.innerHeight;
        const scrolledDistance = -rect.top;

        let progress = scrolledDistance / scrollableDistance;
        progress = Math.max(0, Math.min(1, progress));

        targetFrameIndex = 1 + progress * (totalFrames - 1);

        if (!isDrawing) {
            isDrawing = true;
            requestAnimationFrame(updateLoop);
        }
    }

    // requestAnimationFrame render loop with linear interpolation (lerp)
    function updateLoop() {
        const diff = targetFrameIndex - currentFrameIndex;

        if (Math.abs(diff) < 0.01) {
            currentFrameIndex = targetFrameIndex;
            isDrawing = false;
        } else {
            currentFrameIndex += diff * 0.12; // Easing speed
            requestAnimationFrame(updateLoop);
        }

        const currentProgress = (currentFrameIndex - 1) / (totalFrames - 1);
        const scale = 0.98 + (currentProgress * 0.02);

        drawFrame(Math.round(currentFrameIndex));

        if (canvas) {
            canvas.style.transform = `scale(${scale}) translate3d(0, 0, 0)`;
        }

        // Fade out hero text overlay as scroll progress moves forward
        if (heroText) {
            // Fade out completely by 15% scroll progress
            const fadeThreshold = 0.15;
            if (currentProgress < fadeThreshold) {
                const opacity = 1 - (currentProgress / fadeThreshold);
                const translateY = -50 - (currentProgress / fadeThreshold) * 40; // parallax lift from -50% to -90%
                heroText.style.opacity = opacity;
                heroText.style.transform = `translate(-50%, ${translateY}%)`;
                heroText.style.visibility = 'visible';
            } else {
                heroText.style.opacity = 0;
                heroText.style.visibility = 'hidden';
            }
        }
    }

    // Kickoff Preloading
    preloadImages();
});
