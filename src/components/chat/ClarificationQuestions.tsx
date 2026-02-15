import { useState, useCallback } from 'react';
import { apiClient } from '@/api/client';
import { useAppDispatch } from '@/store/hooks';
import { setProgress } from '@/store/chatSlice';

interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'free_text';
  options?: string[];
}

interface ClarificationQuestionsProps {
  questions: ClarificationQuestion[];
  taskId: string;
}

/**
 * Inline clarification questions component.
 *
 * Renders below the assistant message when the agent needs more info.
 * Supports single choice, multiple choice, and free text inputs.
 */
export function ClarificationQuestions({ questions, taskId }: ClarificationQuestionsProps) {
  const dispatch = useAppDispatch();
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSingleChoice = useCallback((questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }, []);

  const handleMultipleChoice = useCallback((questionId: string, option: string) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      if (current.includes(option)) {
        return { ...prev, [questionId]: current.filter((o) => o !== option) };
      }
      return { ...prev, [questionId]: [...current, option] };
    });
  }, []);

  const handleFreeText = useCallback((questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      // Build answers payload
      const formattedAnswers = questions.map((q) => {
        const answer = answers[q.id];
        return {
          question: q.question,
          answer: Array.isArray(answer) ? answer.join(', ') : (answer || 'No answer'),
        };
      });

      await apiClient.post(`/planning/tasks/${taskId}/reply`, {
        answers: formattedAnswers,
      });

      setSubmitted(true);
      dispatch(setProgress({
        status: 'PROCESSING',
        progress: 20,
        message: 'Great, planning your trip with additional details...',
      }));
    } catch (err) {
      console.error('Failed to submit clarification reply:', err);
    } finally {
      setSubmitting(false);
    }
  }, [answers, questions, taskId, dispatch]);

  const handleSkip = useCallback(async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = questions.map((q) => ({
        question: q.question,
        answer: 'Flexible / no preference',
      }));

      await apiClient.post(`/planning/tasks/${taskId}/reply`, {
        answers: formattedAnswers,
      });

      setSubmitted(true);
      dispatch(setProgress({
        status: 'PROCESSING',
        progress: 20,
        message: 'Planning your trip with flexible preferences...',
      }));
    } catch (err) {
      console.error('Failed to submit skip reply:', err);
    } finally {
      setSubmitting(false);
    }
  }, [questions, taskId, dispatch]);

  if (submitted) {
    return (
      <div className="mt-2 pl-11 text-xs text-green-600 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Answers submitted — generating your plan...
      </div>
    );
  }

  return (
    <div className="mt-3 pl-11 space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
        <p className="text-sm font-medium text-amber-800">
          I need a bit more information to plan the perfect trip:
        </p>

        {questions.map((q) => (
          <QuestionField
            key={q.id}
            question={q}
            value={answers[q.id]}
            onSingleChoice={handleSingleChoice}
            onMultipleChoice={handleMultipleChoice}
            onFreeText={handleFreeText}
          />
        ))}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Submitting...' : 'Continue Planning'}
          </button>
          <button
            onClick={handleSkip}
            disabled={submitting}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50 transition"
          >
            Skip — use defaults
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestionField({
  question,
  value,
  onSingleChoice,
  onMultipleChoice,
  onFreeText,
}: {
  question: ClarificationQuestion;
  value: string | string[] | undefined;
  onSingleChoice: (id: string, option: string) => void;
  onMultipleChoice: (id: string, option: string) => void;
  onFreeText: (id: string, text: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm text-gray-700 font-medium">{question.question}</p>

      {question.type === 'single_choice' && question.options && (
        <div className="flex flex-wrap gap-2">
          {question.options.map((opt) => (
            <button
              key={opt}
              onClick={() => onSingleChoice(question.id, opt)}
              className={`px-3 py-1.5 text-xs rounded-full border transition ${
                value === opt
                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {question.type === 'multiple_choice' && question.options && (
        <div className="flex flex-wrap gap-2">
          {question.options.map((opt) => {
            const selected = Array.isArray(value) && value.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => onMultipleChoice(question.id, opt)}
                className={`px-3 py-1.5 text-xs rounded-full border transition ${
                  selected
                    ? 'bg-blue-100 border-blue-400 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {selected ? '✓ ' : ''}{opt}
              </button>
            );
          })}
        </div>
      )}

      {question.type === 'free_text' && (
        <input
          type="text"
          value={(value as string) || ''}
          onChange={(e) => onFreeText(question.id, e.target.value)}
          placeholder="Type your answer..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      )}
    </div>
  );
}
