import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface WelcomeIntroProps {
  onStart: () => void;
  title?: string;
  description?: string;
  objectives?: string[];
  lessonType?: string;
}

export function WelcomeIntro({ 
  onStart,
  title = "Basic Greetings",
  description = "Learn common Persian greetings used in everyday conversations.",
  objectives = [
    "Say hello and greet someone",
    "Ask how someone is doing",
    "Welcome someone",
    "Say goodbye properly"
  ],
  lessonType = "greetings"
}: WelcomeIntroProps) {

  // For politeness lesson (Lesson 2), show simple layout without images
  if (lessonType === "politeness") {
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
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4">What You'll Learn</h2>
            <p className="text-muted-foreground mb-6">
              This lesson focuses on essential responses that every Persian learner needs to know.
            </p>
          </div>
          
          {/* Learning Objectives */}
          <div className="grid gap-4 mb-8">
            {objectives.map((objective, index) => (
              <div key={index} className="flex items-center justify-center gap-4 p-4 bg-primary/5 rounded-lg">
                <span className="text-2xl">
                  {index === 0 ? "😊" : index === 1 ? "🙏" : index === 2 ? "✅" : "❌"}
                </span>
                <span className="text-base sm:text-lg font-medium">{objective}</span>
              </div>
            ))}
          </div>
          
          {/* Vocabulary Preview */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-primary mb-3">Vocabulary Preview</h3>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                <div className="text-lg font-bold text-primary">Khoobam</div>
                <div className="text-sm text-muted-foreground">I'm good</div>
              </div>
              <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                <div className="text-lg font-bold text-primary">Merci</div>
                <div className="text-sm text-muted-foreground">Thank you</div>
              </div>
              <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                <div className="text-lg font-bold text-primary">Baleh</div>
                <div className="text-sm text-muted-foreground">Yes</div>
              </div>
              <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                <div className="text-lg font-bold text-primary">Na</div>
                <div className="text-sm text-muted-foreground">No</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Start Button */}
        <div className="flex justify-center">
          <Button
            onClick={onStart}
            className="py-6 px-10 text-lg w-full sm:w-auto"
          >
            Start Learning! <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </div>
    );
  }

  // Default layout for other lessons (like Lesson 1 with Ali)
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header Section - Title stays outside cards on both layouts */}
      <div className="text-center mb-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary">{title}</h1>
        <p className="text-lg sm:text-xl text-muted-foreground mt-2 max-w-3xl mx-auto">{description}</p>
      </div>
      
      {/* MOBILE LAYOUT - Modified structure */}
      <div className="md:hidden bg-gradient-to-b from-primary/5 to-background rounded-2xl shadow-md border border-primary/10 overflow-hidden">
        {/* Layered Images: Airport background, Ali foreground */} 
        <div className="relative w-full h-64"> {/* Container for layering */} 
          {/* Background: Tehran Airport */} 
          <Image 
            src="/icons/tehranairport.png" 
            alt="Tehran Airport Background"
            layout="fill"
            objectFit="cover"
            className="opacity-90"
          />
          
          {/* Foreground: Ali Image */} 
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 w-2/5 max-w-[180px]">
            <Image 
              src="/icons/ali.png" 
              alt="Ali with a speech bubble"
              width={180} 
              height={180}
              className="w-full h-auto object-contain drop-shadow-lg"
              priority
            />
          </div>
        </div>
        
        {/* Title below image */}
        <div className="px-4 pb-4 pt-4"> {/* Added top padding */} 
          <h2 className="text-2xl font-bold mb-3 text-primary text-center">Let's Help Ali!</h2>
          
          <p className="text-sm mb-3 text-muted-foreground text-center">
            Ali just landed in Tehran and wants to greet people the right way. You'll meet him again at the end of this lesson — let's make sure you're ready to help him when the time comes.
          </p>
          
          {/* Button MOVED between title and mission text on mobile */}
          <Button
            onClick={onStart}
            className="w-full py-5 text-lg mb-3"
          >
            Let's Start! <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* DESKTOP LAYOUT - Balanced proportions and compact */}
      <div className="hidden md:block">
        <div className="flex gap-6 items-stretch mb-5">
          {/* Left column - Ali Image with Airport Background */}
          <div className="w-2/5 flex justify-center">
            <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-md border border-primary/10">
              {/* Background: Tehran Airport */} 
              <Image 
                src="/icons/tehranairport.png" 
                alt="Tehran Airport Background"
                layout="fill"
                objectFit="cover"
                className="opacity-80"
              />
              {/* Foreground: Ali Image */} 
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 w-3/5 max-w-[280px]">
                <Image 
                  src="/icons/ali.png" 
                  alt="Ali with a speech bubble"
                  width={280} 
                  height={280}
                  className="w-full h-auto object-contain drop-shadow-xl"
                  priority
                />
              </div>
            </div>
          </div>
          
          {/* Right column - Mission Card with increased width */}
          <div className="w-3/5">
            <div className="bg-white rounded-2xl p-6 shadow-md border border-primary/10 h-full flex flex-col">
              <h2 className="text-2xl font-bold mb-3 text-primary text-center">Let's Help Ali!</h2>
              
              <p className="text-base mb-4 text-muted-foreground text-center">
                Ali just landed in Tehran and wants to greet people the right way. You'll meet him again at the end of this lesson — let's make sure you're ready to help him when the time comes.
              </p>
              
              <div className="flex-grow">
                <p className="font-bold mb-3 text-center">Your mission is to get Ali ready. Help him:</p>
                <ul className="space-y-2 text-center">
                  {objectives.map((objective, index) => (
                    <li key={index} className="flex items-center justify-center gap-3">
                      <span className="text-xl">
                        {index === 0 ? "👋" : index === 1 ? "🤔" : index === 2 ? "🙏" : "👋"}
                      </span>
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
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
            Let's Start! <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
} 
