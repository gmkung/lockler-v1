import { useState, useEffect } from 'react';
import { retrieveQuestions, Question, QuestionProgress } from 'reality-kleros-subgraph';
import { DEFAULT_CHAIN_ID } from '../lib/constants';

export function useQuestions(realityModuleAddress: string) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<QuestionProgress>({
    total: 0,
    processed: 0,
    failed: 0
  });

  useEffect(() => {
    const loadQuestions = async () => {
      if (!realityModuleAddress) return;

      try {
        setIsLoading(true);
        setQuestions([]);
        setProgress({ total: 0, processed: 0, failed: 0 });

        // Process questions as they come in
        for await (const question of retrieveQuestions(
          DEFAULT_CHAIN_ID,
          {
            user: realityModuleAddress.toLowerCase(), // The Reality Module that created the questions
            batchSize: 100
          },
          (progress) => {
            setProgress(progress);
          }
        )) {
          setQuestions(prev => [...prev, question]);
        }

        setError(null);
      } catch (err) {
        console.error('Error loading questions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [realityModuleAddress]);

  return { questions, isLoading, error, progress };
} 