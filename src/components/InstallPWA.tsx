import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InstallPWA: React.FC = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for the appinstalled event to know when the PWA was installed
    const handleAppInstalled = () => {
      // Show a toast notification
      toast({
        title: "Installation Complete",
        description: "Maahol is now available on your home screen!",
      });
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
      
      // We'll show a toast immediately after user accepts installation
      // (this is in addition to the appinstalled event, which might not fire on all browsers)
      toast({
        title: "Installing...",
        description: "Look for Maahol on your home screen once installation completes!",
      });
      
      setDeferredPrompt(null);
    }
  };

  if (!showInstallPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white">Install Maahol</h3>
            <p className="text-sm text-white/80">Install our app for a better experience</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPWA; 