interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  characterName?: string;
  characterEmoji?: string;
  userEmoji?: string;
  timestamp?: string;
}

export function ChatBubble({ 
  message, 
  isUser, 
  characterName = "Sara",
  characterEmoji = "👩",
  userEmoji = "👤"
}: ChatBubbleProps) {
  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Character Avatar (left side) */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
          {characterEmoji}
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-md' // User messages: blue, right-aligned
            : 'bg-gray-100 text-gray-900 rounded-bl-md' // Character messages: gray, left-aligned
        }`}
      >
        {/* Character name for first message */}
        {!isUser && characterName && (
          <div className="text-xs font-medium text-gray-500 mb-1">
            {characterName}
          </div>
        )}
        
        {/* Message text */}
        <div className="text-base leading-relaxed">
          {message}
        </div>
      </div>

      {/* User Avatar (right side) */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-sm">
          {userEmoji}
        </div>
      )}
    </div>
  );
} 