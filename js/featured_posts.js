async function loadFeaturedPosts() {
    try {
        const response = await fetch('/data/posts.json');
        const posts = await response.json();

        // Filter featured posts (Featured = 1)
        const featuredPosts = posts.filter(post => post.featured == 1);

        const container = document.getElementById("featured-posts-container");
        container.innerHTML = featuredPosts.map(post => `
            <article class="post">
                <div class="post-image-container">
                    <img src="${post['thumbnail_url']}" alt="${post.title}" class="post-image" loading="lazy">
                </div>
                <h4 class="post-title">${post.title}</h4>
                <p class="post-excerpt">${post.description || "No description available."}</p>
                <a href="${post['markdown_url']}" class="read-more">Read More</a>
            </article>
        `).join('');

    } catch (error) {
        console.error("Error fetching featured posts:", error);
    }
}

// Load featured posts when the page loads
document.addEventListener("DOMContentLoaded", loadFeaturedPosts);
