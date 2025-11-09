"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Medal, Star, Sparkles, Home, RotateCcw, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { getModule } from "@/lib/config/curriculum"
import { VocabularyService } from "@/lib/services/vocabulary-service"
import { PremiumLockModal } from "@/components/PremiumLockModal"
import { getCachedModuleAccess, setCachedModuleAccess } from "@/lib/utils/module-access-cache"
import { SmartAuthService } from "@/lib/services/smart-auth-service"

interface ModuleCompletionProps {
  moduleId: string;
  totalXpEarned: number;
}

interface ModuleCompletionData {
  title: string;
  description: string;
  motivationalMessage: string;
  skillsLearned: string[];
}

// Module completion data - could be moved to curriculum.ts later
const MODULE_COMPLETION_DATA: Record<string, ModuleCompletionData> = {
  "module1": {
    title: "Module 1 Complete!",
    description: "You can now greet people and introduce yourself in Persian!",
    motivationalMessage: "Incredible! You've mastered basic Persian greetings and introductions!",
    skillsLearned: [
      "Greeting someone with 'Salam'",
      "Asking 'How are you?' with 'Chetori?'",
      "Introducing yourself with your name",
      "Saying 'Nice to meet you'",
      "Saying goodbye with 'Khodafez'"
    ]
  },
  "module2": {
    title: "Module 2 Complete!",
    description: "You can now count and talk about numbers in Persian!",
    motivationalMessage: "Amazing! You've conquered Persian numbers and age conversations!",
    skillsLearned: [
      "Counting from 1 to 100",
      "Asking about age",
      "Talking about prices",
      "Using numbers in daily conversation"
    ]
  },
  "module3": {
    title: "Module 3 Complete!",
    description: "You can now talk about your family and relationships in Persian!",
    motivationalMessage: "Fantastic! You've mastered family vocabulary and possessive structures!",
    skillsLearned: [
      "Talking about parents (madar/pedar)",
      "Describing siblings (baradar/khahar)",
      "Using possessive suffixes (-am/-et)",
      "Asking about family members",
      "Building complex family sentences"
    ]
  },
  // Add more modules as they're developed
};

export function ModuleCompletion({ moduleId, totalXpEarned }: ModuleCompletionProps) {
  const router = useRouter();
  const [vocabularyLearned, setVocabularyLearned] = useState<string[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const currentModule = getModule(moduleId);
  const completionData = MODULE_COMPLETION_DATA[moduleId];
  
  // Get next module info
  const nextModuleId = moduleId === "module1" ? "module2" : moduleId === "module2" ? "module3" : "module4";
  const nextModule = getModule(nextModuleId);
  const isNextModuleAvailable = nextModule?.available || false;
  
  // ALWAYS run hooks before any early returns (React Rules of Hooks)
  useEffect(() => {
    // Get all vocabulary learned in this module
    const moduleVocabulary = VocabularyService.getModuleVocabulary(moduleId);
    setVocabularyLearned(moduleVocabulary.map((item: any) => item.finglish));
  }, [moduleId]);

  // Early return AFTER all hooks
  if (!module || !completionData) {
    return null;
  }

  const handleNextModule = async () => {
    if (!isNextModuleAvailable) return;
    
    // ✅ FIX: Check premium access BEFORE navigating
    if (nextModule?.requiresPremium) {
      const { user } = SmartAuthService.getSessionState()
      if (user) {
        try {
          // Check cache first
          const cachedAccess = getCachedModuleAccess(nextModuleId, user.id)
          let accessData
          
          if (cachedAccess) {
            accessData = cachedAccess
          } else {
            // Cache miss - fetch from API
            const accessResponse = await fetch(`/api/check-module-access?moduleId=${nextModuleId}`)
            if (accessResponse.ok) {
              accessData = await accessResponse.json()
              setCachedModuleAccess(nextModuleId, user.id, accessData)
            }
          }
          
          // If user doesn't have premium access, show modal instead of navigating
          if (accessData && !accessData.canAccess && accessData.reason === 'no_premium') {
            setShowPremiumModal(true)
            return
          }
        } catch (error) {
          console.error('Failed to check premium access:', error)
          // On error, still try to navigate (fail open)
        }
      }
    }
    
    // User has access (or module doesn't require premium) - navigate
    router.push(`/modules/${nextModuleId}`);
  };

  const handleRepracticeModule = () => {
    router.push(`/modules/${moduleId}`);
  };

  const handleViewDashboard = () => {
    router.push('/modules');
  };

  return (
    <div className="max-w-2xl mx-auto text-center py-8 px-4">
      
      {/* Celebration Medal */}
      <motion.div 
        className="relative mx-auto w-32 h-32 mb-8"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 blur-lg animate-pulse"></div>
        <div className="relative bg-green-500 rounded-full p-6 flex justify-center items-center h-full shadow-2xl">
          <Medal className="h-16 w-16 text-white" />
        </div>
      </motion.div>
      
      {/* Module Completion Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold mb-4 text-green-600">
          {completionData.title}
        </h1>
        
        <p className="text-xl text-gray-700 mb-2">
          {completionData.description}
        </p>
        
        <p className="text-lg text-green-600 font-medium mb-8">
          {completionData.motivationalMessage}
        </p>
      </motion.div>

      {/* Stats Section */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {/* XP Earned */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="h-6 w-6 text-yellow-500" />
            <span className="text-lg font-semibold text-gray-700">XP Earned</span>
          </div>
          <div className="text-3xl font-bold text-yellow-600">
            {totalXpEarned} XP
          </div>
        </div>

        {/* Vocabulary Learned */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-blue-500" />
            <span className="text-lg font-semibold text-gray-700">Words Learned</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {vocabularyLearned.length}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            Persian words
          </div>
        </div>
      </motion.div>

      {/* Skills Learned Section */}
      <motion.div
        className="bg-gray-50 rounded-xl p-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">Skills You've Mastered</h3>
        <ul className="space-y-2">
          {completionData.skillsLearned.map((skill, index) => (
            <li key={index} className="flex items-center gap-3 text-left">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700">{skill}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        {/* Next Module Button */}
        <Button 
          className={`w-full text-lg py-6 ${
            isNextModuleAvailable 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          onClick={handleNextModule}
          disabled={!isNextModuleAvailable}
        >
          {isNextModuleAvailable ? (
            <>
              Next Module <ArrowRight className="ml-2 h-5 w-5" />
            </>
          ) : (
            'More Modules Coming Soon!'
          )}
        </Button>
        
        {/* Secondary Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="w-full py-3"
            onClick={handleRepracticeModule}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Re-Practice {currentModule?.title || 'Module'}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full py-3"
            onClick={handleViewDashboard}
          >
            <Home className="h-4 w-4 mr-2" />
            View Dashboard
          </Button>
        </div>
      </motion.div>
      
      {/* Premium Lock Modal */}
      <PremiumLockModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        moduleTitle={nextModule?.title}
      />
    </div>
  );
} 