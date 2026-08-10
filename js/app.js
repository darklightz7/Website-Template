/* ==========================================================================
   BLACKHAWK PROTECTIVE COATINGS - APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. MOBILE NAVIGATION TOGGLE ---
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const isOpen = navMenu.classList.contains('active');
            mobileToggle.setAttribute('aria-expanded', isOpen);
            mobileToggle.innerHTML = isOpen ? '✕' : '☰';
        });

        // Close menu on link click
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                if (mobileToggle) mobileToggle.innerHTML = '☰';
            });
        });
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
