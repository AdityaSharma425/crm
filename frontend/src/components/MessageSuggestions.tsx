import { useState } from 'react';
import { campaigns } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface MessageSuggestionsProps {
  onSelect: (message: string) => void;
  campaignObjective: string;
  audienceDescription: string;
}

export default function MessageSuggestions({ onSelect, campaignObjective, audienceDescription }: MessageSuggestionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generateSuggestions = async () => {
    try {
      setIsLoading(true);
      const response = await campaigns.suggestMessages({
        campaignObjective,
        audienceDescription
      });
      setSuggestions(response.data.messages);
    } catch (error) {
      toast.error('Failed to generate message suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={generateSuggestions}
        disabled={isLoading || !campaignObjective || !audienceDescription}
        className="btn-secondary text-sm"
      >
        {isLoading ? 'Generating...' : 'Generate Message Suggestions'}
      </button>

      {suggestions.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Suggested Messages:</h4>
          {suggestions.map((message, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              onClick={() => onSelect(message)}
            >
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 