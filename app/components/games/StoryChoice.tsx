import { Button } from '@/components/ui/button';
import { StoryChoice as StoryChoiceType } from '@/lib/types';

interface StoryChoiceProps {
  choice: StoryChoiceType;
  onSelect: (choice: StoryChoiceType) => void;
  disabled?: boolean;
  showResult?: boolean;
  isSelected?: boolean;
}

export function StoryChoice({ 
  choice, 
  onSelect, 
  disabled = false,
  showResult = false,
  isSelected = false 
}: StoryChoiceProps) {
  
  const handleClick = () => {
    if (!disabled) {
      // Log vocabulary usage for tracking (removed from UI)
      console.log(`Story choice selected: "${choice.text}" uses vocabulary: [${choice.vocabularyUsed.join(', ')}]`);
      onSelect(choice);
    }
  };

  // Style based on state
  const getButtonStyle = () => {
    if (showResult && isSelected) {
      return choice.isCorrect 
        ? 'bg-green-500 hover:bg-green-500 text-white border-green-500' 
        : 'bg-red-500 hover:bg-red-500 text-white border-red-500';
    }
    
    if (disabled) {
      return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    }
    
    return 'bg-white hover:bg-primary/5 text-gray-900 border-gray-200 hover:border-primary/30';
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      variant="outline"
      size="lg"
      className={`w-full text-left justify-start p-4 h-auto whitespace-normal ${getButtonStyle()}`}
    >
      {/* Persian text (main choice) */}
      <div className="text-base font-medium">
        {choice.text}
      </div>
    </Button>
  );
} 