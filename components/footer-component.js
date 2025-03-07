class FooterComponent extends HTMLElement {
  constructor() {
    super();
    const currentYear = new Date().getFullYear();
    this.innerHTML = `
      <footer>      
            <div style="flex: 1;">
            <h1 style="font-size: 2rem; margin-top: 0;">Mosaic Labs</h1>
                <div class="nowrap">&copy; ${currentYear}</div>
            </div>
            <div class="footer-links">
                <h4>LINKS</h4>
                <ul>
                    <li><a href="https://nexus-tool.com">Nexus</a></li>
                    <li><a href="https://pantheon.chat">Pantheon</a></li>
                    <!-- <li><a href="/blog/index.html">Blog</a></li> -->
                    <li><a href="https://github.com/sofvanh">GitHub</a></li>
                </ul>
            </div>
            <div class="footer-links">
                <h4>CONTACT</h4>
                <ul>
                    <li><a href="https://buttondown.com/mosaic-labs">Newsletter</a></li>
                    <li><a href="https://discord.gg/Ua3eYqsmyn">Discord</a></li>
                    <li><a href="mailto:hello@mosaic-labs.org">Email</a></li>
                </ul>
            </div>
      </footer>
    `;
  }
}

customElements.define('footer-component', FooterComponent);