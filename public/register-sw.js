if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/maahol/sw.js', { scope: '/maahol/' })
      .then(registration => {
        console.log('ServiceWorker registration successful');
        
        // Check for updates on page load
        registration.update();
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
          console.log('Checking for service worker updates...');
        }, 60 * 1000); // Check every minute
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}