import { useState, useEffect, useCallback } from 'react';
import { retrieveQuestions, Question, QuestionProgress } from 'reality-kleros-subgraph';

export function useQuestions(realityModuleAddress: string, chainId?: number | null) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<QuestionProgress>({
    total: 0,
    processed: 0,
    failed: 0
  });

  const loadQuestions = useCallback(async () => {
    if (!realityModuleAddress || !chainId) {
      setIsLoading(false);
      setError(!realityModuleAddress ? "No module address provided" : "No chain ID provided");
      return;
    }

    try {
      setIsLoading(true);
      setQuestions([]);
      setProgress({ total: 0, processed: 0, failed: 0 });

      // Process questions as they come in
      for await (const question of retrieveQuestions(
        chainId,
        {
          user: realityModuleAddress.toLowerCase(),
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
  }, [realityModuleAddress, chainId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return { questions, isLoading, error, progress, refetch: loadQuestions };
} 