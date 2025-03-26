
import React, { useState, useEffect } from "react";
import { sounds } from "@/data/sounds";
import SoundGrid from "@/components/SoundGrid";
import Dashboard from "@/components/Dashboard";
import { AudioProvider } from "@/contexts/AudioContext";
import { AnimatePresence, motion } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

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
        <motion.header
          className="py-4 text-center bg-zinc-800/50 border-b border-white/10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl font-medium tracking-tight flex items-center justify-center">
            <span className="text-green-400 text-3xl mr-2">🌱</span> 
            <span>Serene Sounds</span>
          </h1>
        </motion.header>

        <div className="flex justify-center my-2">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 px-4 sm:px-0 no-scrollbar">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-white/30 hover:bg-white/10 bg-zinc-800/50">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  {categories.find(c => c.id === selectedCategory)?.name || "All Sounds"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-white/30 bg-zinc-800/90 backdrop-blur-lg">
                {categories.map(category => (
                  <DropdownMenuItem 
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={selectedCategory === category.id ? "bg-white/10" : ""}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <main className="flex-grow px-2 sm:px-4 mb-6 overflow-y-auto">
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
      </div>
    </AudioProvider>
  );
};

export default Index;
