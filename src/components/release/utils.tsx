
import { CircleCheck, Info } from "lucide-react";

export const getSecurityIcon = (isValid: boolean) => {
  return isValid ?
    <CircleCheck className="h-4 w-4 text-green-600" /> :
    <Info className="h-4 w-4 text-red-600" />;
};
