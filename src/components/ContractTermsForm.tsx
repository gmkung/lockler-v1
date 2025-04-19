import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { EscrowContractTerms, Payment } from "../lib/types";
import { TOKENS } from "../lib/constants";

interface ContractTermsFormProps {
  contractTerms: EscrowContractTerms;
  setContractTerms: (terms: EscrowContractTerms) => void;
  escrowMode: 'p2p' | 'grant';
  chainId: number;
}

export function ContractTermsForm({ contractTerms, setContractTerms, escrowMode, chainId }: ContractTermsFormProps) {
  const getAvailableTokens = () => {
    const availableTokens = [TOKENS.NATIVE];
    Object.entries(TOKENS).forEach(([key, tokenConfig]) => {
      if (key !== 'NATIVE' && tokenConfig[chainId]) {
        availableTokens.push(tokenConfig[chainId]);
      }
    });
    return availableTokens;
  };

  const addPayment = (role: 'sender' | 'receiver') => {
    if (escrowMode === 'grant') {
      setContractTerms({
        ...contractTerms,
        payments: [...contractTerms.payments, {
          address: "",
          amount: "0",
          currency: TOKENS.NATIVE.address,
          role
        }]
      });
    }
  };

  const updatePayment = (index: number, field: keyof Payment, value: string) => {
    const newPayments = [...contractTerms.payments];
    newPayments[index] = {
      ...newPayments[index],
      [field]: value
    };
    setContractTerms({
      ...contractTerms,
      payments: newPayments
    });
  };

  const removePayment = (index: number) => {
    if (escrowMode === 'grant') {
      setContractTerms({
        ...contractTerms,
        payments: contractTerms.payments.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <div className="space-y-6 border-b pb-6">
      <h3 className="text-xl font-semibold">Contract Terms</h3>

      <div className="grid grid-cols-2 gap-6">
        {/* Input Fields Column */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={contractTerms.title}
              onChange={(e) => setContractTerms({ ...contractTerms, title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={contractTerms.description}
              onChange={(e) => setContractTerms({ ...contractTerms, description: e.target.value })}
            />
          </div>

          {/* Payments */}
          <div>
            <Label>Payments</Label>
            {contractTerms.payments.map((payment, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  placeholder="Address"
                  value={payment.address}
                  onChange={(e) => updatePayment(index, 'address', e.target.value)}
                  disabled={escrowMode === 'p2p'}
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={payment.amount}
                  onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                />
                <select
                  value={payment.currency}
                  onChange={(e) => updatePayment(index, 'currency', e.target.value)}
                  className="border rounded p-2"
                >
                  {getAvailableTokens().map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
                {escrowMode === 'grant' && (
                  <Button
                    variant="destructive"
                    onClick={() => removePayment(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {escrowMode === 'grant' && (
              <div className="flex gap-2 mt-2">
                <Button onClick={() => addPayment('sender')}>
                  Add Sender
                </Button>
                <Button onClick={() => addPayment('receiver')}>
                  Add Receiver
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* JSON Preview Column */}
        <div className="space-y-4">
          <Label>Contract Terms Preview</Label>
          <Card className="h-full">
            <CardContent className="p-4">
              <pre className="text-sm overflow-auto max-h-[600px]">
                {JSON.stringify(contractTerms, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 