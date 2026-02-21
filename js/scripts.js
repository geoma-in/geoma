document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.getElementById('hamburger-icon');
    const navMenu = document.getElementById('nav-menu');

    if (hamburger && navMenu) {
        // Toggle Mobile Menu
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            
            // Icon Switch Animation
            const icon = hamburger.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.replace('fa-bars', 'fa-times');
            } else {
                icon.classList.replace('fa-times', 'fa-bars');
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                navMenu.classList.remove('active');
                const icon = hamburger.querySelector('i');
                icon.classList.replace('fa-times', 'fa-bars');
            }
        });

        // Prevent click propagation inside menu
        navMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
});