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
});
