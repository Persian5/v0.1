import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WelcomeIntroProps {
  onStart: () => void;
  title?: string;
  description?: string;
  objectives?: string[];
}

export function WelcomeIntro({ 
  onStart,
  title = "Basic Persian Greetings",
  description = "Let's learn the essentials of greeting someone in Persian",
  objectives = [
    "Say hello and greet someone",
    "Ask how someone is doing",
    "Welcome someone",
    "Say goodbye properly"
  ]
}: WelcomeIntroProps) {
  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-primary">{title}</h1>
      <p className="text-lg mb-4 text-muted-foreground">{description}</p>
      
      {/* Ali's story */}
      <div className="bg-secondary/10 rounded-xl p-6 mb-6">
        <h3 className="font-bold text-xl mb-3">Let's Help Ali!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ali is visiting Tehran for the first time and needs to learn basic greetings to make a good impression. 
          Your mission is to teach him the essential Persian phrases he needs.
        </p>
        <div className="flex justify-center">
          <div className="bg-background rounded-full w-16 h-16 flex items-center justify-center">
            <span className="text-2xl">👨‍💼</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-primary/10 rounded-xl p-6">
          <p className="text-lg mb-4">In this lesson, you'll learn how to:</p>
          <ul className="space-y-2 text-left">
            {objectives.map((objective, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </div>
        <Button 
          onClick={onStart} 
          className="w-full py-6 text-lg"
        >
          Let's Begin! <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
} 