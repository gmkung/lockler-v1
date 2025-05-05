import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { EscrowContractTerms, Payment } from "../lib/types";
import { TOKENS, CHAIN_CONFIG } from "../lib/constants";
import { Send, ArrowDownLeft, HelpCircle, Expand, Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { getAvailableTokens as getAvailableTokensUtil, getTokenInfo, getInputStep } from '../lib/currency';

interface ContractTermsFormProps {
  contractTerms: EscrowContractTerms;
  setContractTerms: (terms: EscrowContractTerms) => void;
  escrowMode: 'p2p' | 'grant';
  chainId: number;
}

const inputClass = "rounded-xl bg-gray-900 mt-1 text-white text-sm border-0 focus:ring-2 focus:ring-pink-400";
const selectClass = "rounded-xl bg-gray-900 text-white px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-purple-500";
const cardClass = "rounded-3xl bg-gradient-to-br from-[#23213A] to-[#2D274B] border border-gray-800 shadow-md";

const SECONDS_IN_DAY = 86400;

export function ContractTermsForm({ contractTerms, setContractTerms, escrowMode, chainId }: ContractTermsFormProps) {
  const getAvailableTokens = () => getAvailableTokensUtil(chainId);
  const getNativeCurrencySymbol = () => getTokenInfo(TOKENS.NATIVE.address, chainId).symbol;

  const convertDaysToSeconds = (days: number) => Math.floor(days * SECONDS_IN_DAY);
  const convertSecondsToDays = (seconds: number) => Math.max(1, Math.floor(seconds / SECONDS_IN_DAY));

  const updateDurationParam = (field: 'timeout' | 'cooldown' | 'expiration', daysValue: string) => {
    const days = parseFloat(daysValue);
    const seconds = !isNaN(days) ? convertDaysToSeconds(days) : 0;
    setContractTerms({ ...contractTerms, [field]: seconds });
  };

  const handleDownloadJson = () => {
    const dataStr = JSON.stringify(contractTerms, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportName = `lockler-contract-${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };

  // Example description text with markdown formatting for participants
  const descriptionPlaceholder = `# Project Milestone

## Description
Describe what triggers release (e.g. Design delivery, bug bounty, etc)

## Deliverables
- Item 1
- Item 2
- Item 3

## Participants
| Role | Address | Amount | Currency |
|------|---------|--------|----------|
| Sender | 0x... | 1.5 | ETH |
| Receiver | 0x... | 1.5 | ETH |

## Release Conditions
Describe under what conditions funds should be released.`;

  return (
    <div className="w-full">
      <div className="grid gap-8 grid-cols-5">
        {/* Left Column (2/5) - Title, Bond, Timeouts */}
        <div className="col-span-2 space-y-6">
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

          <div className="space-y-4 bg-[#1a1831] p-4 rounded-xl">
            <div>
              <div className="flex items-center gap-1">
                <Label className="text-purple-100 text-xs">Question Bond ({getNativeCurrencySymbol()})</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-purple-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Amount of native currency that a transaction proposer needs to put up as deposit to prevent abuse. This amount will only be lost if the proposal was successfully challenged.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
              <div className="flex items-center gap-1">
                <Label className="text-purple-100 text-xs">Timeout (days)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-purple-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>The time allowed for answering each question before it can be answered by the arbitrator.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="timeout"
                type="number"
                value={contractTerms.timeout ? convertSecondsToDays(contractTerms.timeout) : "0"}
                onChange={(e) => updateDurationParam('timeout', e.target.value)}
                className={inputClass + " text-xs"}
                placeholder="1"
                min="0"
                step="1"
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <Label className="text-purple-100 text-xs">Cooldown (days)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-purple-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Waiting period required after an oracle provides an answer before the transaction can be executed.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="cooldown"
                type="number"
                value={contractTerms.cooldown ? convertSecondsToDays(contractTerms.cooldown) : "0"}
                onChange={(e) => updateDurationParam('cooldown', e.target.value)}
                className={inputClass + " text-xs"}
                placeholder="1"
                min="0"
                step="1"
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <Label className="text-purple-100 text-xs">Expiration (days)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-purple-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Duration that a positive answer from the oracle remains valid. After this period, the answer expires and the proposal becomes invalid. Set to 0 for no expiration.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="expiration"
                type="number"
                value={contractTerms.expiration ? convertSecondsToDays(contractTerms.expiration) : "0"}
                onChange={(e) => updateDurationParam('expiration', e.target.value)}
                className={inputClass + " text-xs"}
                placeholder="7"
                min="0"
                step="1"
              />
            </div>
          </div>
        </div>

        {/* Right Column (3/5) - Description and JSON button */}
        <div className="col-span-3 space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-purple-100 font-semibold">Description</Label>
              <span className="text-xs text-purple-300">Supports Markdown format</span>
            </div>
            <div className="relative">
              <Textarea
                id="description"
                value={contractTerms.description}
                onChange={(e) => setContractTerms({ ...contractTerms, description: e.target.value })}
                className={`${inputClass} min-h-[450px] w-full resize-y`}
                placeholder={descriptionPlaceholder}
              />
              <div className="absolute bottom-4 right-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full hover:bg-purple-900/20 flex items-center gap-1"
                    >
                      <Expand className="h-4 w-4 text-purple-400" />
                      <span className="text-purple-300">View JSON</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl bg-gray-900 border-purple-800/20">
                    <DialogHeader>
                      <DialogTitle className="text-purple-100 flex justify-between items-center">
                        <span>Contract JSON Preview</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-purple-900/20"
                          onClick={handleDownloadJson}
                        >
                          <Download className="h-4 w-4 text-purple-400" />
                        </Button>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-purple-800/20">
                      <pre className="text-sm text-purple-200 font-mono whitespace-pre-wrap overflow-auto max-h-[60vh]">
                        {JSON.stringify(contractTerms, null, 2)}
                      </pre>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
