
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

// Utility style helpers for dark bg and rounded cards
const inputClass = "rounded-xl bg-gray-900 mt-1 text-white text-sm border-0 focus:ring-2 focus:ring-pink-400";
const selectClass = "rounded-xl bg-gray-900 text-white px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-purple-500";
const cardClass = "rounded-3xl bg-gradient-to-br from-[#23213A] to-[#2D274B] border border-gray-800 shadow-md";
// Animations and pastel lines for extra cutesy-ness

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
    <div className={`${cardClass} p-4`}>
      <h3 className="text-xl font-extrabold mb-6 text-gradient-primary text-white tracking-tight">
        Contract Terms
      </h3>
      <div className="grid gap-7 sm:grid-cols-2">
        {/* Input Fields Column */}
        <div className="space-y-4">
          {/* Basic Info */}
          <div>
            <Label htmlFor="title" className="text-purple-100 font-semibold">Title</Label>
            <Input
              id="title"
              value={contractTerms.title}
              onChange={(e) => setContractTerms({ ...contractTerms, title: e.target.value })}
              className={inputClass}
              placeholder="e.g. Design Milestone Escrow"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-purple-100 font-semibold">Description</Label>
            <Input
              as="textarea"
              id="description"
              value={contractTerms.description}
              onChange={(e) => setContractTerms({ ...contractTerms, description: e.target.value })}
              className={inputClass + " min-h-[40px]"}
              placeholder="Describe what triggers release (e.g. Design delivery, bug bounty, etc)"
            />
          </div>

          {/* Payments */}
          <div>
            <Label className="text-purple-100 font-semibold">Payments</Label>
            {contractTerms.payments.map((payment, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:gap-2 gap-1 mt-2 bg-[#1a1831] p-2 rounded-xl">
                <Input
                  placeholder="Address"
                  value={payment.address}
                  onChange={(e) => updatePayment(index, 'address', e.target.value)}
                  disabled={escrowMode === 'p2p'}
                  className={inputClass + " flex-1"}
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={payment.amount}
                  onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                  className={inputClass + " flex-1"}
                />
                <select
                  value={payment.currency}
                  onChange={(e) => updatePayment(index, 'currency', e.target.value)}
                  className={selectClass + " flex-1"}
                >
                  {getAvailableTokens().map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
                {escrowMode === 'grant' && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="mt-2 sm:mt-0"
                    onClick={() => removePayment(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {escrowMode === 'grant' && (
              <div className="flex gap-2 mt-2">
                <Button type="button" onClick={() => addPayment('sender')} className="rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 text-white shadow">
                  Add Sender
                </Button>
                <Button type="button" onClick={() => addPayment('receiver')} className="rounded-full bg-gradient-to-r from-pink-400 to-fuchsia-500 text-white shadow">
                  Add Receiver
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* JSON Preview Column */}
        <div className="space-y-2">
          <Label className="text-purple-100 font-semibold">Preview</Label>
          <Card className="h-full bg-[#1a1831] border border-purple-800 rounded-2xl shadow-lg">
            <CardContent className="p-4">
              <pre className="text-xs text-purple-100 overflow-auto max-h-[250px] font-mono">
                {JSON.stringify(contractTerms, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
