// Import polyfills first
import "./lib/polyfills";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Setup from "./pages/Setup";
import Release from './pages/Release';
import Terms from './pages/Terms';

import SelectSafe from './pages/SelectSafe';
import MyLocklers from './pages/MyLocklers'; // Import the new page
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { CHAIN_CONFIG, SUPPORTED_CHAINS, getRpcUrl } from './lib/constants';
import Intro from './pages/Intro'; // Import the new Intro page

const queryClient = new QueryClient();

// Define chains using our constants
const gnosisChain = {
  id: SUPPORTED_CHAINS.GNOSIS,
  name: CHAIN_CONFIG[SUPPORTED_CHAINS.GNOSIS].name,
  nativeCurrency: CHAIN_CONFIG[SUPPORTED_CHAINS.GNOSIS].nativeCurrency,
  rpcUrls: {
    default: {
      http: [CHAIN_CONFIG[SUPPORTED_CHAINS.GNOSIS].rpcUrl],
    },
    public: {
      http: [CHAIN_CONFIG[SUPPORTED_CHAINS.GNOSIS].rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'Gnosis Scan',
      url: CHAIN_CONFIG[SUPPORTED_CHAINS.GNOSIS].blockExplorer,
    },
  },
};

const config = createConfig({
  chains: [mainnet, gnosisChain],
  transports: {
    [mainnet.id]: http(),
    [gnosisChain.id]: http(getRpcUrl(SUPPORTED_CHAINS.GNOSIS)),
  }
});

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <TooltipProvider>
          <Routes>
            <Route path="/" element={<Intro />} /> {/* Set Intro as the root route */}
            <Route path="/setup" element={<Setup />} />
            <Route path="/release" element={<SelectSafe />} />
            <Route path="/release/:chainId/:address" element={<Release />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/myLocklers" element={<MyLocklers />} /> {/* Add the new route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </HashRouter>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
