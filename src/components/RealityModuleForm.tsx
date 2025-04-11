
import React, { useState } from "react";
import { ethers } from "ethers";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { REALITY_MODULE_CONTRACTS, REALITY_MODULE_DEFAULTS } from "@/lib/constants";
import { deployRealityModule } from "@/lib/realityModule";

// Form schema with validation
const formSchema = z.object({
  safeAddress: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, { message: "Invalid Ethereum address format" })
    .refine(address => ethers.isAddress(address), {
      message: "Invalid Ethereum address",
    }),
  bond: z.string()
    .refine(value => !isNaN(Number(value)) && Number(value) > 0, {
      message: "Bond must be a positive number",
    }),
  timeout: z.string()
    .refine(value => !isNaN(Number(value)) && Number(value) >= 3600, {
      message: "Timeout must be at least 3600 seconds (1 hour)",
    }),
  cooldown: z.string()
    .refine(value => !isNaN(Number(value)) && Number(value) >= 3600, {
      message: "Cooldown must be at least 3600 seconds (1 hour)",
    }),
  expiration: z.string()
    .refine(value => !isNaN(Number(value)) && Number(value) >= 86400, {
      message: "Expiration must be at least 86400 seconds (1 day)",
    }),
  templateQuestion: z.string()
    .min(10, { message: "Question template must be at least 10 characters" })
    .max(200, { message: "Question template must be at most 200 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

interface RealityModuleFormProps {
  connectedAddress: string;
  signer: ethers.Signer;
}

const RealityModuleForm: React.FC<RealityModuleFormProps> = ({ connectedAddress, signer }) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedModuleAddress, setDeployedModuleAddress] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      safeAddress: "",
      bond: REALITY_MODULE_DEFAULTS.BOND,
      timeout: REALITY_MODULE_DEFAULTS.TIMEOUT,
      cooldown: REALITY_MODULE_DEFAULTS.COOLDOWN,
      expiration: REALITY_MODULE_DEFAULTS.EXPIRATION,
      templateQuestion: REALITY_MODULE_DEFAULTS.TEMPLATE_QUESTION,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsDeploying(true);
      const result = await deployRealityModule(signer, data);
      
      if (result.moduleAddress) {
        setDeployedModuleAddress(result.moduleAddress);
        setTxHash(result.txHash);
        toast.success("Reality Module deployed successfully!");
      } else {
        toast.error("Failed to deploy Reality Module");
      }
    } catch (error: any) {
      console.error("Error deploying Reality Module:", error);
      toast.error(`Deployment failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-6">Deploy Reality Module</h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="safeAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Safe Address</FormLabel>
                  <FormControl>
                    <Input placeholder="0x..." {...field} />
                  </FormControl>
                  <FormDescription>
                    The address of the Gnosis Safe that will own this module
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bond"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bond Amount (xDAI)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormDescription>
                      Default: {REALITY_MODULE_DEFAULTS.BOND} xDAI
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeout (seconds)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Default: {REALITY_MODULE_DEFAULTS.TIMEOUT} (2 days)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cooldown"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cooldown (seconds)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Default: {REALITY_MODULE_DEFAULTS.COOLDOWN} (2 days)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration (seconds)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Default: {REALITY_MODULE_DEFAULTS.EXPIRATION} (7 days)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="templateQuestion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Template</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormDescription>
                    The template question for Reality.eth. Should describe the conditions under which proposals should be executed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isDeploying}
              >
                {isDeploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isDeploying ? "Deploying..." : "Deploy Reality Module"}
              </Button>
            </div>
          </form>
        </Form>

        {deployedModuleAddress && (
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-700">Deployment Successful!</h3>
            <div className="mt-2">
              <p className="text-sm">
                <span className="font-medium">Module Address:</span>{" "}
                <span className="font-mono">{deployedModuleAddress}</span>
              </p>
              {txHash && (
                <p className="text-sm mt-2">
                  <span className="font-medium">Transaction:</span>{" "}
                  <a 
                    href={`https://gnosisscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-blue-600 hover:underline"
                  >
                    {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                  </a>
                </p>
              )}
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  The module has been deployed and is now owned by your Safe. You can now use it to create and execute proposals through Reality.eth.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealityModuleForm;
