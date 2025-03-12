const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// We need to install a package to parse frontmatter
// Run: npm install gray-matter
const matter = require('gray-matter');

const postsDir = path.join(__dirname, '../posts');
const blogDir = path.join(__dirname, '../blog');
const existingIndexPath = path.join(blogDir, 'index.html');

// Template for blog posts
const template = (content, metadata) => `
<!DOCTYPE html>
<html>
<head>
  <title>${metadata.title}</title>
  <link rel="stylesheet" type="text/css" href="../css/style.css">
</head>
<body>
  <div class="content">
    <header>
      <a href="/blog/">← Back to Blog</a>
    </header>
    <article>
      <h1>${metadata.title}</h1>
      <div class="post-metadata">
        <time datetime="${metadata.date}">${new Date(metadata.date).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}</time>
      </div>
      ${content}
    </article>
  </div>
</body>
</html>
`;

// Generate HTML for the post list
const generatePostListHTML = (posts) => {
  return posts.map(post => `
    <div class="post-item">
      <h2 class="post-title">
        <a href="/blog/${post.slug}">${post.title}</a>
      </h2>
      <div class="post-date">
        <time datetime="${post.date}">${new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}</time>
      </div>
      ${post.description ? `<p>${post.description}</p>` : ''}
    </div>
  `).join('');
};

// Make sure the blog directory exists
if (!fs.existsSync(blogDir)) {
  fs.mkdirSync(blogDir, { recursive: true });
}

// Convert markdown files to HTML
async function buildBlog() {
  const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));
  const allPosts = [];

  for (const file of files) {
    const filePath = path.join(postsDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Parse frontmatter and content
    const { data, content } = matter(fileContent);

    // Set default metadata if not provided
    const metadata = {
      title: data.title || file.replace('.md', ''),
      date: data.date || new Date().toISOString().split('T')[0],
      description: data.description || '',
      slug: file.replace('.md', '')
    };

    // Convert markdown to HTML
    const html = await marked(content);
    const outputPath = path.join(blogDir, `${metadata.slug}.html`);

    // Save the post HTML
    fs.writeFileSync(outputPath, template(html, metadata));
    console.log(`Generated ${outputPath}`);

    // Add to posts list for index page
    allPosts.push(metadata);
  }

  // Sort posts by date (newest first)
  allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Update the index page
  updateIndexPage(allPosts);
}

// Function to update the index page while preserving existing styling
function updateIndexPage(posts) {
  // Check if index.html exists
  if (fs.existsSync(existingIndexPath)) {
    let indexContent = fs.readFileSync(existingIndexPath, 'utf-8');

    // Generate the post list HTML
    const postListHTML = generatePostListHTML(posts);

    // Create a completely new index.html based on the existing structure
    // This is more reliable than trying to use regex to replace specific parts

    // First, extract the parts we need to preserve
    const headMatch = /<head>[\s\S]*?<\/head>/i.exec(indexContent);
    const headContent = headMatch ? headMatch[0] : '<head><title>Mosaic Labs Blog</title></head>';

    const heroMatch = /<div class="hero[\s\S]*?<\/div>\s*<\/div>/i.exec(indexContent);
    const heroContent = heroMatch ? heroMatch[0] : '<div class="hero small"><div class="text-center"><h1 class="title">Mosaic Labs Blog</h1></div></div>';

    const backLinkMatch = /<a href="[^"]*">Back to Home[^<]*<\/a>/i.exec(indexContent);
    const backLinkContent = backLinkMatch ? backLinkMatch[0] : '<a href="/">Back to Home</a>';

    const footerMatch = /<hr>[\s\S]*?<footer-component><\/footer-component>/i.exec(indexContent);
    const footerContent = footerMatch ? footerMatch[0] : '<hr><footer-component></footer-component>';

    // Create the new HTML structure
    const newIndexContent = `<!DOCTYPE html>
<html>
${headContent}
<body>
  ${heroContent}
  <div class="content">
    ${backLinkContent}
    <main>
      <div id="posts-list">
        ${postListHTML}
      </div>
    </main>
    ${footerContent}
  </div>
</body>
</html>`;

    // Write the updated index.html
    fs.writeFileSync(existingIndexPath, newIndexContent);
    console.log(`Updated ${existingIndexPath}`);
  } else {
    // If index.html doesn't exist, create a basic one
    const indexTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>Blog | Mosaic Labs</title>
  <link rel="stylesheet" type="text/css" href="../css/style.css">
</head>
<body>
  <div class="hero small">
    <div class="text-center">
      <h1 class="title">Mosaic Labs Blog</h1>
    </div>
  </div>
  <div class="content">
    <a href="/">Back to Home</a>
    <main>
      <div id="posts-list">
        ${generatePostListHTML(posts)}
      </div>
    </main>
    <hr>
    <footer-component></footer-component>
  </div>
</body>
</html>
`;
    fs.writeFileSync(existingIndexPath, indexTemplate);
    console.log(`Created ${existingIndexPath}`);
  }
}

buildBlog().catch(err => {
  console.error('Error building blog:', err);
  process.exit(1);
}); 