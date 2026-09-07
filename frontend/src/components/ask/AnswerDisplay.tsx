import React from 'react';
import { AskQueryResponse } from '@/types';
import { AnswerCard } from '../query/AnswerCard';

export interface AnswerDisplayProps {
  response: AskQueryResponse | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

export const AnswerDisplay: React.FC<AnswerDisplayProps> = ({
  response,
  isLoading = false,
  isError = false,
  errorMessage,
}) => {
  return (
    <AnswerCard
      response={response}
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
    />
  );
};
