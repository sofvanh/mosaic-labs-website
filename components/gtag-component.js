const initGoogleAnalytics = () => {
  const gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-YXHBJ67PXC';


  const configScript = document.createElement('script');
  configScript.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-YXHBJ67PXC');
    `;

  document.head.appendChild(gtagScript);
  document.head.appendChild(configScript);
};

initGoogleAnalytics(); 