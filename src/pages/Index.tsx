import React, { useState, useEffect } from "react";
import { sounds } from "@/data/sounds";
import SoundGrid from "@/components/SoundGrid";
import Dashboard from "@/components/Dashboard";
import AppBar from "@/components/AppBar";
import TabBar, { TabType } from "@/components/TabBar";
import MixesTab from "@/components/MixesTab";
import InstallPWA from "@/components/InstallPWA";
import { AudioStateProvider, useAudioState } from "@/contexts/AudioStateContext";
import { AnimatePresence, motion } from "framer-motion";

const IndexContent = () => {
  const [mounted, setMounted] = useState(false);
  const [filteredSounds, setFilteredSounds] = useState(sounds);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<TabType>("discover");
  const { getActiveSounds } = useAudioState();
  const activeSounds = getActiveSounds();

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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <AppBar 
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
      />
      
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      
      <main className="flex-grow px-2 sm:px-4 mb-6 overflow-y-auto relative">
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
          {activeTab === "discover" ? (
            <motion.div
              key="discover"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              <SoundGrid sounds={filteredSounds} />
            </motion.div>
          ) : (
            <motion.div
              key="mixes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              <MixesTab />
            </motion.div>
          )}
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
    <AudioStateProvider>
      <IndexContent />
    </AudioStateProvider>
  );
};

export default Index;
