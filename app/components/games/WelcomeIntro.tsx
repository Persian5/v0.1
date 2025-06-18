import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface VocabularyItem {
  persian: string;
  english: string;
}

interface LessonIntroProps {
  onStart: () => void;
  title: string;
  description: string;
  // Layout configuration
  useSimpleLayout?: boolean; // If true, shows simple layout without images
  
  // Simple layout props
  sectionTitle?: string;
  sectionDescription?: string;
  objectives?: string[];
  objectiveEmojis?: string[];
  vocabularyItems?: VocabularyItem[];
  
  // Image layout props
  backgroundImage?: string;
  backgroundImageAlt?: string;
  foregroundImage?: string;
  foregroundImageAlt?: string;
  missionTitle?: string;
  missionDescription?: string;
  missionInstructions?: string;
  
  // Button customization
  buttonText?: string;
}

export function LessonIntro({ 
  onStart,
  title,
  description,
  useSimpleLayout = false,
  
  // Simple layout props
  sectionTitle = "What You'll Learn",
  sectionDescription = "This lesson focuses on essential responses that every Persian learner needs to know.",
  objectives = [],
  objectiveEmojis = [],
  vocabularyItems = [],
  
  // Image layout props
  backgroundImage,
  backgroundImageAlt = "Background image",
  foregroundImage,
  foregroundImageAlt = "Character image",
  missionTitle = "Let's Get Started!",
  missionDescription = "Welcome to this lesson!",
  missionInstructions = "Your objectives:",
  
  // Button customization
  buttonText = "Let's Start!"
}: LessonIntroProps) {

  // Simple layout without images
  if (useSimpleLayout) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary">{title}</h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">{description}</p>
        </div>
        
        {/* Main Content Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-primary/10 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4">{sectionTitle}</h2>
            <p className="text-muted-foreground mb-6">
              {sectionDescription}
            </p>
          </div>
          
          {/* Learning Objectives */}
          {objectives.length > 0 && (
            <div className="grid gap-4 mb-8">
              {objectives.map((objective, index) => (
                <div key={index} className="flex items-center justify-center gap-4 p-4 bg-primary/5 rounded-lg">
                  <span className="text-2xl">
                    {objectiveEmojis[index] || "📚"}
                  </span>
                  <span className="text-base sm:text-lg font-medium">{objective}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Vocabulary Preview */}
          {vocabularyItems.length > 0 && (
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-primary mb-3">Vocabulary Preview</h3>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {vocabularyItems.map((item, index) => (
                  <div key={index} className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                    <div className="text-lg font-bold text-primary">{item.persian}</div>
                    <div className="text-sm text-muted-foreground">{item.english}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Start Button */}
        <div className="flex justify-center">
          <Button
            onClick={onStart}
            className="py-6 px-10 text-lg w-full sm:w-auto"
          >
            {buttonText} <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </div>
    );
  }

  // Image layout (default)
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header Section - Title stays outside cards on both layouts */}
      <div className="text-center mb-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary">{title}</h1>
        <p className="text-lg sm:text-xl text-muted-foreground mt-2 max-w-3xl mx-auto">{description}</p>
      </div>
      
      {/* MOBILE LAYOUT - Modified structure */}
      <div className="md:hidden bg-gradient-to-b from-primary/5 to-background rounded-2xl shadow-md border border-primary/10 overflow-hidden">
        {/* Layered Images Container */} 
        <div className="relative w-full h-64"> {/* Container for layering */} 
          {/* Background Image */} 
          {backgroundImage && (
            <Image 
              src={backgroundImage}
              alt={backgroundImageAlt}
              layout="fill"
              objectFit="cover"
              className="opacity-90"
            />
          )}
          
          {/* Foreground Image */} 
          {foregroundImage && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 w-2/5 max-w-[180px]">
              <Image 
                src={foregroundImage}
                alt={foregroundImageAlt}
                width={180} 
                height={180}
                className="w-full h-auto object-contain drop-shadow-lg"
                priority
              />
            </div>
          )}
        </div>
        
        {/* Content below image */}
        <div className="px-4 pb-4 pt-4"> {/* Added top padding */} 
          <h2 className="text-2xl font-bold mb-3 text-primary text-center">{missionTitle}</h2>
          
          <p className="text-sm mb-3 text-muted-foreground text-center">
            {missionDescription}
          </p>
          
          {/* Button between title and mission text on mobile */}
          <Button
            onClick={onStart}
            className="w-full py-5 text-lg mb-3"
          >
            {buttonText} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* DESKTOP LAYOUT - Balanced proportions and compact */}
      <div className="hidden md:block">
        <div className="flex gap-6 items-stretch mb-5">
          {/* Left column - Images Container */}
          <div className="w-2/5 flex justify-center">
            <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-md border border-primary/10">
              {/* Background Image */} 
              {backgroundImage && (
                <Image 
                  src={backgroundImage}
                  alt={backgroundImageAlt}
                  layout="fill"
                  objectFit="cover"
                  className="opacity-80"
                />
              )}
              {/* Foreground Image */} 
              {foregroundImage && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 w-3/5 max-w-[280px]">
                  <Image 
                    src={foregroundImage}
                    alt={foregroundImageAlt}
                    width={280} 
                    height={280}
                    className="w-full h-auto object-contain drop-shadow-xl"
                    priority
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Right column - Mission Card with increased width */}
          <div className="w-3/5">
            <div className="bg-white rounded-2xl p-6 shadow-md border border-primary/10 h-full flex flex-col">
              <h2 className="text-2xl font-bold mb-3 text-primary text-center">{missionTitle}</h2>
              
              <p className="text-base mb-4 text-muted-foreground text-center">
                {missionDescription}
              </p>
              
              <div className="flex-grow">
                {objectives.length > 0 && (
                  <>
                    <p className="font-bold mb-3 text-center">{missionInstructions}</p>
                    <ul className="space-y-2 text-center">
                      {objectives.map((objective, index) => (
                        <li key={index} className="flex items-center justify-center gap-3">
                          <span className="text-xl">
                            {objectiveEmojis[index] || "📚"}
                          </span>
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Button below both columns on desktop */}
        <div className="flex justify-center mt-5">
          <Button
            onClick={onStart}
            className="py-6 px-10 text-lg w-full"
          >
            {buttonText} <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
} 
