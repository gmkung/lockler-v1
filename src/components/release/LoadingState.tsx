
import { StepWrapper } from '../StepWrapper';

export function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1831] to-[#231a2c] p-4">
      <StepWrapper>
        <div className="animate-pulse space-y-4">
          <div className="h-16 w-16 bg-purple-500/20 rounded-full mx-auto"></div>
          <div className="h-8 bg-purple-500/20 rounded mx-auto w-3/4"></div>
          <div className="h-4 bg-purple-500/20 rounded w-full"></div>
          <div className="h-4 bg-purple-500/20 rounded w-5/6"></div>
          <div className="h-4 bg-purple-500/20 rounded w-4/6"></div>
        </div>
      </StepWrapper>
    </div>
  );
}
