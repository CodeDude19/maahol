import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UpdateNotification: React.FC = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Listen for the 'updateAvailable' message from the service worker
    const handleUpdateFound = (event: MessageEvent) => {
      if (event.data && event.data.type === 'updateAvailable') {
        setShowUpdatePrompt(true);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleUpdateFound);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleUpdateFound);
    };
  }, []);

  const handleUpdateClick = () => {
    // Send message to service worker to skip waiting
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'skipWaiting' });
    }

    // Show a toast notification
    toast({
      title: "Updating...",
      description: "The app will refresh in a moment.",
    });

    // Give the service worker time to activate
    setTimeout(() => {
      window.location.reload();
    }, 1000);

    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-4 right-4 z-50 bg-emerald-500/10 backdrop-blur-lg border border-emerald-500/20 rounded-lg p-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <RefreshCw size={20} className="text-emerald-400 mr-3 animate-spin-slow" />
            <div>
              <h3 className="text-lg font-medium text-white">Update Available</h3>
              <p className="text-sm text-white/80">A new version is ready to install</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpdateClick}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Update
            </button>
            <button
              onClick={() => setShowUpdatePrompt(false)}
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

export default UpdateNotification;