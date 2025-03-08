const posts = [
  {
    title: "Second Post Title",
    date: "2025-03-07",
    slug: "second.md",
    summary: "Short description of your first post"
  },
  {
    title: "First Post Title",
    date: "2025-03-07",
    slug: "first-post.md",
    summary: "Short description of your first post"
  },
  // Add more posts as you create them
];

// Format date to a more readable format
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
}

// Render the post listing
function renderPostsList() {
  const postsList = document.getElementById('posts-list');
  posts.forEach(post => {
    const item = document.createElement('div');
    item.className = 'post-item';
    item.innerHTML = `
      <h2 class="post-title">
        <a href="./viewer.html?post=${post.slug}">${post.title}</a>
      </h2>
      <div class="post-date">${formatDate(post.date)}</div>
      <p>${post.summary}</p>
    `;
    postsList.appendChild(item);
  });
}

document.addEventListener('DOMContentLoaded', renderPostsList);