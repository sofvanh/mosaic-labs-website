class NewsletterComponent extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = `
      <div class="signup-container">
        <h3>Stay Updated</h3>
        <form action="https://buttondown.email/api/emails/embed-subscribe/mosaic-labs" method="post"
          target="popupwindow" onsubmit="window.open('https://buttondown.email/mosaic-labs', 'popupwindow')">
          <div class="form-group">
            <input type="email" name="email" id="bd-email" placeholder="your@email.com" required>
            <input type="submit" value="Subscribe" class="submit-btn">
          </div>
          <small class="privacy-notice">
            We'll only send occasional updates about our projects.
            <br>
            Consider also joining our
            <a href="https://discord.gg/Ua3eYqsmyn">Discord</a>
            for more frequent updates.
          </small>
        </form>
      </div>
    `;
  }
}

customElements.define('newsletter-component', NewsletterComponent);
