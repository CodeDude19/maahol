import React, { useState, useEffect } from "react";
import { sounds } from "@/data/sounds";
import SoundGrid from "@/components/SoundGrid";
import Dashboard from "@/components/Dashboard";
import AppBar from "@/components/AppBar";
import InstallPWA from "@/components/InstallPWA";
import { AudioProvider, useAudio } from "@/contexts/AudioContext";
import { AnimatePresence, motion } from "framer-motion";

const IndexContent = () => {
  const [mounted, setMounted] = useState(false);
  const [filteredSounds, setFilteredSounds] = useState(sounds);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { activeSounds } = useAudio();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredSounds(sounds);
    } else {
      setFilteredSounds(sounds.filter(sound => sound.category === selectedCategory));
    }
  }, [selectedCategory]);

  if (!mounted) return null;

  const categories = [
    { id: "all", name: "All Sounds" },
    { id: "rain", name: "Rain" },
    { id: "thunder", name: "Thunder" },
    { id: "nature", name: "Nature" },
    { id: "ambience", name: "Ambience" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <AppBar 
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
      />
      
      <main className="flex-grow px-2 sm:px-4 mb-6 mt-[1vh] overflow-y-auto relative">
        <AnimatePresence>
          {activeSounds.length > 0 && (
            <motion.div 
              className="fixed inset-0 z-0 opacity-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                backgroundImage: 'url("/maahol/images/rain.gif")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'repeat',
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10"
          >
            <SoundGrid sounds={filteredSounds} />
          </motion.div>
        </AnimatePresence>
      </main>
      
      <footer className="sticky bottom-0 left-0 right-0 z-10">
        <Dashboard />
      </footer>
      <InstallPWA />
    </div>
  );
};

const Index = () => {
  return (
    <AudioProvider>
      <IndexContent />
    </AudioProvider>
  );
};

export default Index;
