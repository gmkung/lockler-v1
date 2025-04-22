
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface CounterpartyInputProps {
  escrowMode: 'p2p' | 'grant';
  p2pRole: 'sender' | 'receiver';
  counterpartyAddress: string;
  setCounterpartyAddress: (address: string) => void;
}

export function CounterpartyInput({ 
  escrowMode, 
  p2pRole, 
  counterpartyAddress, 
  setCounterpartyAddress 
}: CounterpartyInputProps) {
  if (escrowMode !== 'p2p') return null;

  return (
    <div className="mb-4 px-1">
      <Label className="text-purple-100 text-left block mb-1 text-sm">
        {p2pRole === 'sender' ? 'Receiver' : 'Sender'} Address
      </Label>
      <Input
        className="rounded-xl bg-gray-900 mt-1 text-white text-sm"
        value={counterpartyAddress}
        onChange={(e) => setCounterpartyAddress(e.target.value)}
        placeholder={`Enter ${p2pRole === 'sender' ? 'receiver' : 'sender'} Ethereum address`}
      />
    </div>
  );
}
