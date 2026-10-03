/* ==========================================================================
   BLACKHAWK PROTECTIVE COATINGS - APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. MOBILE NAVIGATION TOGGLE & ACCESSIBILITY ---
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileToggle && navMenu) {
        // Accessibility initialization
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.setAttribute('aria-controls', 'nav-menu');
        if (!navMenu.id) navMenu.id = 'nav-menu';

        const openMenu = () => {
            navMenu.classList.add('active');
            mobileToggle.classList.add('active');
            mobileToggle.setAttribute('aria-expanded', 'true');
            mobileToggle.innerHTML = '✕';
            document.body.style.overflow = 'hidden';
        };

        const closeMenu = () => {
            navMenu.classList.remove('active');
            mobileToggle.classList.remove('active');
            mobileToggle.setAttribute('aria-expanded', 'false');
            mobileToggle.innerHTML = '☰';
            document.body.style.overflow = '';
        };

        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = navMenu.classList.contains('active');
            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Close menu on any link click inside navMenu
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });

        // Close menu on Escape key press
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                closeMenu();
                mobileToggle.focus();
            }
        });

        // Close menu when clicking outside header & drawer
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                closeMenu();
            }
        });

        // Auto-close if screen resized to desktop viewport (> 1080px)
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1080 && navMenu.classList.contains('active')) {
                closeMenu();
            }
        });

        // Dynamically inject mobile drawer CTAs if not statically present
        if (!navMenu.querySelector('.mobile-drawer-cta')) {
            const drawerCta = document.createElement('li');
            drawerCta.className = 'mobile-drawer-cta';

            const phoneBtn = document.querySelector('.nav-cta .btn-phone');
            const quoteBtn = document.querySelector('.nav-cta .btn-primary');

            if (phoneBtn) {
                const phoneClone = phoneBtn.cloneNode(true);
                phoneClone.addEventListener('click', () => closeMenu());
                drawerCta.appendChild(phoneClone);
            }

            if (quoteBtn) {
                const quoteClone = quoteBtn.cloneNode(true);
                quoteClone.addEventListener('click', () => closeMenu());
                drawerCta.appendChild(quoteClone);
            }

            if (drawerCta.children.length > 0) {
                navMenu.appendChild(drawerCta);
            }
        }
    }

    // --- 2. INTERACTIVE BEFORE/AFTER SLIDER LOGIC ---
    const sliderContainer = document.querySelector('.ba-slider-container');
    const rangeInput = document.querySelector('.ba-input-range');

    if (sliderContainer && rangeInput) {
        const updateSliderPosition = (val) => {
            sliderContainer.style.setProperty('--slider-pos', `${val}%`);
        };

        // Listen to range input adjustments
        rangeInput.addEventListener('input', (e) => {
            updateSliderPosition(e.target.value);
        });

        // Optional smooth mouse drag support directly on container
        let isDragging = false;

        const handleMove = (clientX) => {
            const rect = sliderContainer.getBoundingClientRect();
            let x = clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width));
            const percentage = (x / rect.width) * 100;
            rangeInput.value = percentage;
            updateSliderPosition(percentage);
        };

        sliderContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            handleMove(e.clientX);
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            handleMove(e.clientX);
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch support
        sliderContainer.addEventListener('touchstart', (e) => {
            isDragging = true;
            handleMove(e.touches[0].clientX);
        });

        window.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            handleMove(e.touches[0].clientX);
        });

        window.addEventListener('touchend', () => {
            isDragging = false;
        });
    }

    // --- 3. QUOTE FORM SUBMISSION HANDLER TEMPLATE ---
    const quoteForm = document.getElementById('quote-form');
    const successMsg = document.getElementById('form-success');

    if (quoteForm) {
        quoteForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Collect form data
            const formData = new FormData(quoteForm);
            const formValues = Object.fromEntries(formData.entries());
            
            console.log('Quote Request Submitted:', formValues);

            // Display success alert message
            if (successMsg) {
                successMsg.style.display = 'block';
                quoteForm.reset();

                // Scroll smoothly to success message
                successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    // --- 4. IN-SHOP VIDEO SHOWCASE & PLAYER HANDLER ---
    const sprayVideo = document.getElementById('shopSprayVideo');
    const playToggleBtn = document.getElementById('videoPlayToggle');
    const muteToggleBtn = document.getElementById('videoMuteToggle');
    const activeLabel = document.getElementById('videoActiveLabel');
    const clipTabs = document.querySelectorAll('.clip-tab-btn');

    if (sprayVideo) {
        let isUserPaused = false;

        const updatePlayBtn = (isPlaying) => {
            if (playToggleBtn) {
                playToggleBtn.textContent = isPlaying ? '⏸' : '▶';
                playToggleBtn.setAttribute('aria-label', isPlaying ? 'Pause video' : 'Play video');
            }
        };

        const togglePlay = () => {
            if (sprayVideo.paused) {
                isUserPaused = false;
                sprayVideo.play().then(() => updatePlayBtn(true)).catch(() => {});
            } else {
                isUserPaused = true;
                sprayVideo.pause();
                updatePlayBtn(false);
            }
        };

        if (playToggleBtn) {
            playToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePlay();
            });
        }

        sprayVideo.addEventListener('click', togglePlay);

        if (muteToggleBtn) {
            muteToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sprayVideo.muted = !sprayVideo.muted;
                muteToggleBtn.textContent = sprayVideo.muted ? '🔇' : '🔊';
                muteToggleBtn.setAttribute('aria-label', sprayVideo.muted ? 'Unmute audio' : 'Mute audio');
            });
        }

        clipTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetSrc = tab.getAttribute('data-clip');
                const title = tab.getAttribute('data-title');
                if (!targetSrc) return;

                clipTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                if (activeLabel && title) {
                    activeLabel.textContent = title;
                }

                const wasPaused = sprayVideo.paused;
                const isMuted = sprayVideo.muted;

                sprayVideo.src = targetSrc;
                sprayVideo.muted = isMuted;
                sprayVideo.load();

                if (!wasPaused && !isUserPaused) {
                    sprayVideo.play().then(() => updatePlayBtn(true)).catch(() => {});
                } else {
                    updatePlayBtn(false);
                }
            });
        });

        // IntersectionObserver: Pause video when scrolled out of view, auto-resume if not user-paused
        if ('IntersectionObserver' in window) {
            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting && !sprayVideo.paused) {
                        sprayVideo.pause();
                        updatePlayBtn(false);
                    } else if (entry.isIntersecting && sprayVideo.paused && !isUserPaused) {
                        sprayVideo.play().then(() => updatePlayBtn(true)).catch(() => {});
                    }
                });
            }, { threshold: 0.2 });
            videoObserver.observe(sprayVideo);
        }
    }

    // Gallery video click to play/pause
    document.querySelectorAll('.gallery-reel-video').forEach(video => {
        video.addEventListener('click', () => {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        });
    });
});
