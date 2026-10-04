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

    // --- 3. FIRST-TOUCH ATTRIBUTION & CAMPAIGN TRACKER ---
    const initAttributionTracker = () => {
        try {
            const STORAGE_KEY = 'bh_attribution_first_touch';
            const existing = localStorage.getItem(STORAGE_KEY);

            // If already recorded within the last 30 days, keep original first-touch
            if (existing) {
                const parsed = JSON.parse(existing);
                const ageDays = (Date.now() - (parsed._recorded_at || 0)) / (1000 * 60 * 60 * 24);
                if (ageDays < 30) return parsed;
            }

            const urlParams = new URLSearchParams(window.location.search);
            const ref = (document.referrer || '').trim();
            const currentHost = window.location.hostname;

            // Determine if referrer is external (prevents internal page self-referral)
            let externalReferrer = '';
            if (ref) {
                try {
                    const refUrl = new URL(ref);
                    if (refUrl.hostname !== currentHost) {
                        externalReferrer = ref;
                    }
                } catch (e) {
                    if (!ref.includes(currentHost)) externalReferrer = ref;
                }
            }

            // High-level marketing channel classification
            let leadSource = 'Direct / Organic';
            const utmSource = urlParams.get('utm_source') || '';
            const utmMedium = urlParams.get('utm_medium') || '';
            const gclid = urlParams.get('gclid') || '';
            const fbclid = urlParams.get('fbclid') || '';

            if (gclid || (utmSource.toLowerCase() === 'google' && utmMedium.toLowerCase() === 'cpc')) {
                leadSource = 'Google Ads';
            } else if (fbclid || utmSource.toLowerCase().includes('facebook') || utmSource.toLowerCase().includes('instagram')) {
                leadSource = 'Meta Ads / Social';
            } else if (utmSource) {
                leadSource = utmSource + (utmMedium ? ` / ${utmMedium}` : '');
            } else if (externalReferrer) {
                const refLower = externalReferrer.toLowerCase();
                if (refLower.includes('google.')) leadSource = 'Google Organic Search';
                else if (refLower.includes('bing.')) leadSource = 'Bing Organic Search';
                else if (refLower.includes('yahoo.')) leadSource = 'Yahoo Search';
                else if (refLower.includes('yelp.')) leadSource = 'Yelp Referral';
                else if (refLower.includes('facebook.') || refLower.includes('instagram.')) leadSource = 'Social Media Referral';
                else if (refLower.includes('blackhawkblasting.')) leadSource = 'Blackhawk Blasting Referral';
                else {
                    try {
                        leadSource = 'Referral (' + new URL(externalReferrer).hostname + ')';
                    } catch (e) {
                        leadSource = 'External Referral';
                    }
                }
            }

            const attributionData = {
                lead_source: leadSource,
                initial_referrer: externalReferrer || 'Direct / None',
                first_landing_page: window.location.pathname + window.location.search,
                utm_source: utmSource,
                utm_medium: utmMedium,
                utm_campaign: urlParams.get('utm_campaign') || '',
                utm_content: urlParams.get('utm_content') || '',
                utm_term: urlParams.get('utm_term') || '',
                gclid: gclid,
                fbclid: fbclid,
                _recorded_at: Date.now()
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(attributionData));
            return attributionData;
        } catch (err) {
            // Failsafe: never break site execution if storage is disabled in private browsing
            return null;
        }
    };

    const getAttributionData = () => {
        try {
            const stored = localStorage.getItem('bh_attribution_first_touch');
            if (stored) return JSON.parse(stored);
        } catch (e) {}
        return initAttributionTracker() || {};
    };

    // Initialize attribution immediately on first view
    initAttributionTracker();

    // --- 4. UNIVERSAL ASYNC FORM SUBMISSION HANDLER (GHL EDGE WEBHOOK) ---
    const formsToHandle = [
        document.getElementById('quote-form'),
        document.getElementById('contact-form')
    ].filter(Boolean);

    formsToHandle.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit';
            const successMsg = document.getElementById('form-success');
            const errorMsg = document.getElementById('form-error');

            // Hide previous alert banners
            if (successMsg) successMsg.style.display = 'none';
            if (errorMsg) errorMsg.style.display = 'none';

            // Set loading state on submit button
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.7';
                submitBtn.innerHTML = '<span style="display:inline-block; animation: spin 1s infinite linear;">↻</span> Submitting to Shop...';
            }

            try {
                // Collect and serialize form values
                const formData = new FormData(form);
                const payload = {};
                const services = [];

                for (const [key, value] of formData.entries()) {
                    if (key === 'services') {
                        services.push(value);
                    } else {
                        payload[key] = value;
                    }
                }

                if (services.length > 0) {
                    payload.services = services;
                }

                // Append browser context & first-touch attribution
                payload.source_page = window.location.href;
                payload.submission_page = window.location.pathname;

                const attr = getAttributionData();
                Object.assign(payload, {
                    lead_source: attr.lead_source || 'Direct / Website Form',
                    initial_referrer: attr.initial_referrer || 'Direct / None',
                    first_landing_page: attr.first_landing_page || window.location.pathname,
                    utm_source: attr.utm_source || '',
                    utm_medium: attr.utm_medium || '',
                    utm_campaign: attr.utm_campaign || '',
                    utm_content: attr.utm_content || '',
                    utm_term: attr.utm_term || '',
                    gclid: attr.gclid || '',
                    fbclid: attr.fbclid || ''
                });

                // POST to Cloudflare Pages edge function (/api/submit)
                const response = await fetch('/api/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    form.reset();
                    if (successMsg) {
                        successMsg.style.display = 'block';
                        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } else {
                    throw new Error(result.error || 'Submission error');
                }

            } catch (err) {
                console.error('Form submission failed:', err);
                if (errorMsg) {
                    errorMsg.style.display = 'block';
                    errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    alert('There was an issue sending your message. Please call our shop directly at (214) 555-0142.');
                }
            } finally {
                // Restore button state
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        });
    });

    // --- 4. VIDEO PLAYERS (HERO & IN-SHOP SHOWCASE) ---
    const initVideoPlayer = (videoEl, playBtn, muteBtn) => {
        if (!videoEl) return;
        let isUserPaused = false;

        const updatePlayBtn = (isPlaying) => {
            if (playBtn) {
                playBtn.textContent = isPlaying ? '⏸' : '▶';
                playBtn.setAttribute('aria-label', isPlaying ? 'Pause video' : 'Play video');
            }
        };

        const togglePlay = () => {
            if (videoEl.paused) {
                isUserPaused = false;
                videoEl.play().then(() => updatePlayBtn(true)).catch(() => {});
            } else {
                isUserPaused = true;
                videoEl.pause();
                updatePlayBtn(false);
            }
        };

        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePlay();
            });
        }

        videoEl.addEventListener('click', togglePlay);

        if (muteBtn) {
            muteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                videoEl.muted = !videoEl.muted;
                muteBtn.textContent = videoEl.muted ? '🔇' : '🔊';
                muteBtn.setAttribute('aria-label', videoEl.muted ? 'Unmute audio' : 'Mute audio');
            });
        }

        // IntersectionObserver: Pause when off-screen, auto-resume if not explicitly paused by user
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting && !videoEl.paused) {
                        videoEl.pause();
                        updatePlayBtn(false);
                    } else if (entry.isIntersecting && videoEl.paused && !isUserPaused) {
                        videoEl.play().then(() => updatePlayBtn(true)).catch(() => {});
                    }
                });
            }, { threshold: 0.2 });
            observer.observe(videoEl);
        }
    };

    // Initialize Hero Video (Bedliner Texture)
    initVideoPlayer(
        document.getElementById('heroSprayVideo'),
        document.getElementById('heroPlayToggle'),
        document.getElementById('heroMuteToggle')
    );

    // Initialize Lower Showcase Video (Plural Spray Gun)
    initVideoPlayer(
        document.getElementById('shopSprayVideo'),
        document.getElementById('videoPlayToggle'),
        document.getElementById('videoMuteToggle')
    );

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
