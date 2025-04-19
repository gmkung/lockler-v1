import { Card, CardContent } from "./ui/card";

interface DeploymentStatusProps {
  moduleDeploymentHash: string | null;
  transactionData: any;
  error: string | null;
}

export function DeploymentStatus({ moduleDeploymentHash, transactionData, error }: DeploymentStatusProps) {
  return (
    <>
      {error && (
        <div className="text-red-500 mt-2">
          Error: {error}
        </div>
      )}

      {moduleDeploymentHash && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Transaction Hash</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {moduleDeploymentHash}
          </pre>
        </div>
      )}

      {transactionData && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Transaction Receipt</h3>
          <Card>
            <CardContent className="p-4">
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(transactionData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
} 