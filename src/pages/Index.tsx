import React, { useState, useEffect } from "react";
import { sounds } from "@/data/sounds";
import SoundGrid from "@/components/SoundGrid";
import Dashboard from "@/components/Dashboard";
import AppBar from "@/components/AppBar";
import InstallPWA from "@/components/InstallPWA";
import { AudioProvider } from "@/contexts/AudioContext";
import { AnimatePresence, motion } from "framer-motion";

const Index = () => {
  const [mounted, setMounted] = useState(false);
  const [filteredSounds, setFilteredSounds] = useState(sounds);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
    <AudioProvider>
      <div className="min-h-screen flex flex-col bg-black text-white">
        <AppBar 
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
        />
        
        <main className="flex-grow px-2 sm:px-4 mb-6 mt-[0.7vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
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
    </AudioProvider>
  );
};

export default Index;
