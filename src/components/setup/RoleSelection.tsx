
import { Button } from "../ui/button";

interface RoleSelectionProps {
  escrowMode: 'p2p' | 'grant';
  p2pRole: 'sender' | 'receiver';
  setP2PRole: (role: 'sender' | 'receiver') => void;
}

export function RoleSelection({ escrowMode, p2pRole, setP2PRole }: RoleSelectionProps) {
  if (escrowMode !== 'p2p') return null;

  return (
    <div className="mb-4 px-1 text-center">
      <label className="block text-purple-200 font-bold mb-2">
        Your Role
      </label>
      <div className="flex gap-3 justify-center">
        <Button
          variant={p2pRole === 'sender' ? 'default' : 'outline'}
          onClick={() => setP2PRole('sender')}
          className={`rounded-full flex-1 min-w-[110px] text-sm transition-all ${p2pRole === 'sender' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-gray-800 text-gray-300'}`}
        >
          I am the Sender
        </Button>
        <Button
          variant={p2pRole === 'receiver' ? 'default' : 'outline'}
          onClick={() => setP2PRole('receiver')}
          className={`rounded-full flex-1 min-w-[110px] text-sm transition-all ${p2pRole === 'receiver' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white' : 'bg-gray-800 text-gray-300'}`}
        >
          I am the Receiver
        </Button>
      </div>
    </div>
  );
}
