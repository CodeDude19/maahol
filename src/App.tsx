import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UpdateNotification from "./components/UpdateNotification";
import { useEffect } from "react";
import { audioEngine } from "./lib/audio/AudioEngine";

// Initialize audio preloading
const initializeAudio = () => {
  // Start preloading common sounds when page loads
  audioEngine.preloadCommonSounds().catch(err => {
    console.error("Error preloading common sounds:", err);
  });
};

const queryClient = new QueryClient();

const AppContent = () => {
  useEffect(() => {
    // Initialize audio when component mounts
    initializeAudio();
  }, []);

  return (
    <>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/maahol">
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <UpdateNotification />
      </TooltipProvider>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
