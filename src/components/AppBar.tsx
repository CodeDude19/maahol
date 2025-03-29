import React from "react";
import { motion } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

interface AppBarProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: { id: string; name: string }[];
}

const AppBar: React.FC<AppBarProps> = ({ 
  selectedCategory, 
  setSelectedCategory, 
  categories 
}) => {
  return (
    <motion.div 
      className="sticky top-2 z-50 py-4 px-4 mx-4 mt-2.5 rounded-[10px] backdrop-blur-lg bg-white/30 border border-white/20"
      style={{
        boxShadow: "0 8px 32px -8px rgba(255, 255, 255, 0.1), 0 0 20px 0px rgba(255, 255, 255, 0.15)",
        '--appbar-height': '60px'
      } as React.CSSProperties}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-medium tracking-tight flex items-center">
          <img src="/images/Maahol.png" alt="Maahol icon" className="w-8 h-8 mr-2 rounded-full" style={{boxShadow: '0 0 30px rgba(16, 185, 129, 0.9), 0 0 50px rgba(16, 185, 129, 0.7)', clipPath: 'circle(50% at 50% 50%)', filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))'}} />
          <span className="text-white mr-2">Maahol</span> 
        </h1>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-white/30 hover:bg-white/10 bg-white/20 backdrop-blur-sm rounded-[10px]">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {categories.find(c => c.id === selectedCategory)?.name || "All Sounds"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border-white/30 bg-white/20 backdrop-blur-lg rounded-[10px]">
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
    </motion.div>
  );
};

export default AppBar;