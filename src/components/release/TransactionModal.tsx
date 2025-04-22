
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Expand } from "lucide-react";
import { ProposalTransaction } from "@/lib/types";

interface TransactionModalProps {
  transaction: ProposalTransaction;
}

export function TransactionModal({ transaction }: TransactionModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full hover:bg-purple-900/20"
        >
          <Expand className="h-4 w-4 text-purple-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-gray-900 border-purple-800/20">
        <DialogHeader>
          <DialogTitle className="text-purple-100">Raw Transaction Data</DialogTitle>
        </DialogHeader>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-purple-800/20">
          <pre className="text-sm text-purple-200 font-mono break-all whitespace-pre-wrap overflow-auto max-h-[60vh]">
            {JSON.stringify(transaction, null, 2)}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
