// Select the hamburger icon and the navigation menu
const hamburger = document.getElementById('hamburger-icon');
const navMenu = document.getElementById('nav-menu');

// Add click event to the hamburger icon to toggle the menu
hamburger.addEventListener('click', (e) => {
    // Prevent the click from propagating to the document
    e.stopPropagation();
    // Toggle the 'active' class on the navigation menu
    navMenu.classList.toggle('active');
});

// Close the navigation menu when clicking anywhere outside the menu
document.addEventListener('click', (e) => {
    // Check if the click was outside the nav menu and hamburger icon
    if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        // Remove 'active' class to close the menu
        navMenu.classList.remove('active');
    }
});

// Prevent the click event from closing the menu when clicking inside the menu
navMenu.addEventListener('click', (e) => {
    e.stopPropagation();
});
