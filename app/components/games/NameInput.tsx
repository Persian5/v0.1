import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from 'lucide-react';

interface NameInputProps {
  onNameSubmit: (name: string) => void;
  title?: string;
  description?: string;
}

export function NameInput({ 
  onNameSubmit, 
  title = "What's your name?",
  description = "We'll use this to personalize your conversation practice."
}: NameInputProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) return;
    
    setIsSubmitting(true);
    onNameSubmit(trimmedName);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim().length >= 2) {
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 text-center">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-primary mb-2">
          {title}
        </h2>
        <p className="text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Name Input */}
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Enter your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={handleKeyPress}
          className="text-center text-lg"
          maxLength={20}
          autoFocus
        />
        
        <Button
          onClick={handleSubmit}
          disabled={name.trim().length < 2 || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Starting Story...' : 'Continue to Story'}
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground mt-4">
        Your name will be used in Persian: "Esme man {name.trim()}-e"
      </p>
    </div>
  );
} 