import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { EscrowContractTerms, Payment } from "../lib/types";
import { TOKENS, CHAIN_CONFIG } from "../lib/constants";
import { Send, ArrowDownLeft, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { getAvailableTokens as getAvailableTokensUtil, getTokenInfo, getInputStep } from '../lib/currency';

interface ContractTermsFormProps {
  contractTerms: EscrowContractTerms;
  setContractTerms: (terms: EscrowContractTerms) => void;
  escrowMode: 'p2p' | 'grant';
  chainId: number;
}

// Utility style helpers
const inputClass = "rounded-xl bg-gray-900 mt-1 text-white text-sm border-0 focus:ring-2 focus:ring-pink-400";
const selectClass = "rounded-xl bg-gray-900 text-white px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-purple-500";
const cardClass = "rounded-3xl bg-gradient-to-br from-[#23213A] to-[#2D274B] border border-gray-800 shadow-md";

export function ContractTermsForm({ contractTerms, setContractTerms, escrowMode, chainId }: ContractTermsFormProps) {
  const getAvailableTokens = () => getAvailableTokensUtil(chainId);
  const getNativeCurrencySymbol = () => getTokenInfo(TOKENS.NATIVE.address, chainId).symbol;

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
    <div className="w-full">
      <div className="grid gap-8 grid-cols-5">
        {/* Input Fields Column - Takes up 3/5 of the space */}
        <div className="col-span-3 space-y-6">
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
            <Textarea
              id="description"
              value={contractTerms.description}
              onChange={(e) => setContractTerms({ ...contractTerms, description: e.target.value })}
              className={`${inputClass} min-h-[120px] w-full`}
              placeholder="Describe what triggers release (e.g. Design delivery, bug bounty, etc)"
            />
          </div>

          {/* Config Section - Compact Layout */}
          <div className="grid grid-cols-4 gap-4 bg-[#1a1831] p-4 rounded-xl">
            <div>
              <Label className="text-purple-100 text-xs">Question Bond ({getNativeCurrencySymbol()})</Label>
              <Input
                id="bond"
                type="number"
                value={contractTerms.bond || "0"}
                onChange={(e) => setContractTerms({ ...contractTerms, bond: e.target.value })}
                className={inputClass + " text-xs"}
                placeholder="0.1"
                step={getInputStep(TOKENS.NATIVE.address, chainId)}
              />
            </div>
            <div>
              <Label className="text-purple-100 text-xs">Timeout (s)</Label>
              <Input
                id="timeout"
                type="number"
                value={contractTerms.timeout || "0"}
                onChange={(e) => setContractTerms({ ...contractTerms, timeout: parseInt(e.target.value) })}
                className={inputClass + " text-xs"}
                placeholder="3600"
              />
            </div>
            <div>
              <Label className="text-purple-100 text-xs">Cooldown (s)</Label>
              <Input
                id="cooldown"
                type="number"
                value={contractTerms.cooldown || "0"}
                onChange={(e) => setContractTerms({ ...contractTerms, cooldown: parseInt(e.target.value) })}
                className={inputClass + " text-xs"}
                placeholder="3600"
              />
            </div>
            <div>
              <Label className="text-purple-100 text-xs">Expiration (s)</Label>
              <Input
                id="expiration"
                type="number"
                value={contractTerms.expiration || "0"}
                onChange={(e) => setContractTerms({ ...contractTerms, expiration: parseInt(e.target.value) })}
                className={inputClass + " text-xs"}
                placeholder="86400"
              />
            </div>
          </div>

          {/* Participants Section */}
          <div>
            <Label className="text-purple-100 font-semibold">Participants</Label>
            {contractTerms.payments.map((payment, index) => (
              <div key={index} className="flex gap-3 mt-3 bg-[#1a1831] p-3 rounded-xl items-center">
                <div className="flex-none">
                  {payment.role === 'sender' ? (
                    <Send className="h-5 w-5 text-indigo-400" />
                  ) : (
                    <ArrowDownLeft className="h-5 w-5 text-pink-400" />
                  )}
                </div>
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
                  className={inputClass + " w-32"}
                />
                <select
                  value={payment.currency}
                  onChange={(e) => updatePayment(index, 'currency', e.target.value)}
                  className={selectClass + " w-24"}
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
                    onClick={() => removePayment(index)}
                    className="shrink-0"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {escrowMode === 'grant' && (
              <div className="flex gap-3 mt-4">
                <Button type="button" onClick={() => addPayment('sender')} className="rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 text-white shadow">
                  Add Payer
                </Button>
                <Button type="button" onClick={() => addPayment('receiver')} className="rounded-full bg-gradient-to-r from-pink-400 to-fuchsia-500 text-white shadow">
                  Add Payee
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* JSON Preview Column */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-purple-100 font-semibold">Contract JSON Preview</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-purple-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">This is the actual contract that's stored on IPFS, for any potential dispute resolution.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Card className="h-full bg-[#1a1831] border border-purple-800 rounded-2xl shadow-lg">
            <CardContent className="p-4">
              <pre className="text-xs text-purple-100 font-mono whitespace-pre-wrap">
                {JSON.stringify(contractTerms, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
