
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
      <div className="min-h-screen flex flex-col pb-20">
        <motion.header
          className="py-6 text-center glass-effect sticky top-0 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">
            <span className="wave-animation">
              {Array.from("Serene Sounds").map((char, i) => (
                <span key={i} style={{ "--i": i } as any}>{char === " " ? "\u00A0" : char}</span>
              ))}
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">Create your perfect ambient soundscape</p>
        </motion.header>

        <div className="flex justify-center my-4">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 px-4 sm:px-0 no-scrollbar">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="glass-effect border-white/30 hover:bg-white/20">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  {categories.find(c => c.id === selectedCategory)?.name || "All Sounds"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-effect border-white/30">
                {categories.map(category => (
                  <DropdownMenuItem 
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={selectedCategory === category.id ? "bg-primary/10" : ""}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <main className="flex-grow px-2 sm:px-4 mb-6">
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
        
        <footer className="fixed bottom-0 left-0 right-0 p-4 z-10">
          <Dashboard />
        </footer>
      </div>
    </AudioProvider>
  );
};

export default Index;
