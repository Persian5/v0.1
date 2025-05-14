import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface WelcomeIntroProps {
  onStart: () => void;
  title?: string;
  description?: string;
  objectives?: string[];
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
  ]
}: WelcomeIntroProps) {
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
                  <li className="flex items-center justify-center gap-3">
                    <span className="text-xl">👋</span>
                    <span>Say "hello" like a local</span>
                  </li>
                  <li className="flex items-center justify-center gap-3">
                    <span className="text-xl">🤔</span>
                    <span>Ask "how are you?"</span>
                  </li>
                  <li className="flex items-center justify-center gap-3">
                    <span className="text-xl">🙏</span>
                    <span>Welcome people properly</span>
                  </li>
                  <li className="flex items-center justify-center gap-3">
                    <span className="text-xl">👋</span>
                    <span>Say goodbye the right way</span>
                  </li>
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
