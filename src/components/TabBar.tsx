import React from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

export type TabType = "discover" | "mixes";

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const isMobile = useIsMobile();

  return (
    <div className="sticky top-[74px] z-30 w-full px-4 pb-2 pt-1">
      <div className={`mx-auto ${!isMobile ? 'max-w-[650px]' : ''}`}>
        <motion.div 
          className="py-1.5 px-2 rounded-[12px] backdrop-blur-lg bg-white/20 w-full"
          style={{
            boxShadow: "0 8px 32px -8px rgba(255, 255, 255, 0.1), 0 0 20px 0px rgba(255, 255, 255, 0.1)",
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
        >
          <div className="flex justify-center items-center gap-1 w-full">
            <TabButton 
              isActive={activeTab === "discover"} 
              onClick={() => onTabChange("discover")}
              label="Discover"
            />
            <TabButton 
              isActive={activeTab === "mixes"} 
              onClick={() => onTabChange("mixes")}
              label="Mixes"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, label }) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 py-2 px-3 rounded-[10px] text-center transition-all duration-200 ${
        isActive ? "text-white font-medium" : "text-white/60 font-normal"
      }`}
    >
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-white/10 rounded-[10px]"
          layoutId="activeTab"
          initial={false}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30
          }}
        />
      )}
      <span className="relative z-10 text-sm">{label}</span>
    </button>
  );
};

export default TabBar;