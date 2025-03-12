const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

const postsDir = path.join(__dirname, '../posts');
const blogDir = path.join(__dirname, '../blog');
const existingIndexPath = path.join(blogDir, 'index.html');

// Template for blog posts
const template = (content, metadata) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.title} | Mosaic Labs</title>
  <meta name="description" content="${metadata.description || `${metadata.title} - Mosaic Labs Blog`}">
  <link rel="icon" type="image/png" href="../favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
  <link rel="stylesheet" type="text/css" href="../css/style.css">

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/contrib/auto-render.min.js"></script>

  <meta property="og:type" content="article">
  <meta property="og:url" content="https://www.mosaic-labs.org/blog/${metadata.slug}">
  <meta property="og:title" content="${metadata.title} | Mosaic Labs">
  <meta property="og:description" content="${metadata.description || `${metadata.title} - Mosaic Labs Blog`}">
  <meta property="og:image" content="https://mosaic-labs.org/images/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://www.mosaic-labs.org/blog/${metadata.slug}">
  <meta property="twitter:title" content="${metadata.title} | Mosaic Labs">
  <meta property="twitter:description" content="${metadata.description || `${metadata.title} - Mosaic Labs Blog`}">
  <meta property="twitter:image" content="https://mosaic-labs.org/images/og-image.jpg">

  <script src="../components/gtag-component.js" defer></script>
  <script src="../components/footer-component.js" defer></script>
</head>
<body>
  <div class="content">
    <header>
      <a href="/blog/">← Back to Blog</a>
    </header>
    <article>
      <h1>${metadata.title}</h1>
      ${metadata.author ? `<div class="post-author">${metadata.author}</div>` : ''}
      <div class="post-metadata">
        <time datetime="${metadata.date}">${new Date(metadata.date).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}</time>
      </div>
      ${content}
    </article>
    <hr>
    <footer-component></footer-component>
  </div>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      renderMathInElement(document.body, {
        delimiters: [
          {left: "$", right: "$", display: false},
          {left: "$$", right: "$$", display: true}
        ]
      });
    });
  </script>
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
      <div class="post-metadata">
        ${post.author ? `<div class="post-author">by ${post.author}</div>` : ''}
        <div>
          <time class="post-date" datetime="${post.date}">${new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}</time>
        </div>
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
      author: data.author || '',
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

    const backLinkMatch = /<a href="[^"]*"><- Back to Home[^<]*<\/a>/i.exec(indexContent);
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
    throw error(`Couldn't find ${existingIndexPath}`);
  }
}

buildBlog().catch(err => {
  console.error('Error building blog:', err);
  process.exit(1);
}); 