document.addEventListener("DOMContentLoaded", async function () {
    await loadCategories();
});

async function loadCategories() {
    try {
        const response = await fetch("/data/posts.json");
        const posts = await response.json();

        console.log("Fetched Categories Data:", posts); // Debugging

        displayCategories(posts);
    } catch (error) {
        console.error("Error fetching posts.json:", error);
    }
}

function displayCategories(posts) {
    const container = document.getElementById("categories-grid");
    if (!container) {
        console.error("Element #categories-grid not found!");
        return;
    }

    // Extract unique categories
    const categories = [...new Set(posts.flatMap(post => post.categories.split(",").map(cat => cat.trim())))];

    if (categories.length === 0) {
        console.warn("No categories found!");
        return;
    }

    console.log("Fetched categories", categories)

    // Generate category cards
    container.innerHTML = categories.map(category => `
        <div class="categories-card">
            <p class="categories-title">${category}</p>
        </div>
    `).join('');
}
