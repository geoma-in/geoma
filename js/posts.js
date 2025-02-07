document.addEventListener("DOMContentLoaded", async function () {
    const postsContainer = document.getElementById("posts-grid"); // Latest posts container
    const categoriesContainer = document.getElementById("categories-grid");
    const filteredPostsContainer = document.querySelector("#filtered-posts .posts-grid");
    const selectedCategoryTitle = document.getElementById("selected-category-title");
    const filteredSection = document.getElementById("filtered-posts");

    try {
        const response = await fetch("/data/posts.json");
        const posts = await response.json();

        // Sort posts by publication_date (latest first)
        posts.sort((a, b) => new Date(b.publication_date) - new Date(a.publication_date));

        // Display latest 3 posts
        postsContainer.innerHTML = posts.slice(0, 3).map(post => createPostHTML(post)).join("\n");

        // Get unique categories
        const categories = [...new Set(posts.flatMap(post => post.categories.split(",").map(cat => cat.trim())))]
            .filter(cat => cat);

        // Display categories
        categoriesContainer.innerHTML = categories.map(category => 
            `<div class="categories-card" data-category="${category}" onclick="filterPosts('${category}')">
                <p class="categories-title">${category}</p>
            </div>`
        ).join("\n");

    } catch (error) {
        console.error("Error loading posts.json:", error);
    }
});

// Function to filter posts by category
function filterPosts(category) {
    fetch("/data/posts.json")
        .then(response => response.json())
        .then(posts => {
            const filteredPosts = posts.filter(post => post.categories.includes(category));
            const filteredPostsContainer = document.querySelector("#filtered-posts .posts-grid");
            const selectedCategoryTitle = document.getElementById("selected-category-title");
            const filteredSection = document.getElementById("filtered-posts");
            
            selectedCategoryTitle.textContent = `Blogs in : ${category}`;
            filteredPostsContainer.innerHTML = filteredPosts.map(post => createPostHTML(post)).join("\n");
            filteredSection.style.display = "block";
        })
        .catch(error => console.error("Error filtering posts:", error));
}

// Helper function to generate post HTML
function createPostHTML(post) {
    return `
        <article class="post">
            <div class="post-image-container">
                <img src="${post.thumbnail_url}" alt="${post.title}" class="post-image" loading="lazy">
            </div>
            <h4 class="post-title">${post.title}</h4>
            <p class="post-excerpt">${post.description}</p>
            <a href="${post.markdown_url}" class="read-more">Read More</a>
        </article>`;
}