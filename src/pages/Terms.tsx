import React from "react";
import { AppTopBar } from '@/components/AppTopBar';
import { Footer } from '@/components/ui/footer';

export default function Terms() {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#23213A] to-[#2D274B]">
            <AppTopBar pageTitle="Terms & Conditions" />
            <div className="flex-grow flex flex-col items-center justify-start px-4 py-10">
                <div className="max-w-2xl w-full bg-gray-900/80 rounded-2xl shadow-lg p-8 border border-gray-800">
                    <h1 className="text-3xl font-bold text-white mb-6">Terms & Conditions</h1>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-purple-200 mb-2">1. Introduction</h2>
                        <p className="text-gray-200 text-sm">
                            Welcome to Lockler. By using our escrow and fund release platform, you agree to these Terms & Conditions. <strong>This is a super alpha version of Lockler. Bugs and issues may still be present.</strong> If in doubt, please use the <a href="https://app.safe.global/" className="text-purple-300 underline" target="_blank" rel="noopener noreferrer">official Safe app</a> or the respective chain explorer to verify and manage your funds. Please read these terms carefully before using the service.
                        </p>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-purple-200 mb-2">2. Definitions</h2>
                        <ul className="list-disc list-inside text-gray-200 text-sm ml-4">
                            <li><strong>"User"</strong> refers to any individual or entity using the Lockler platform.</li>
                            <li><strong>"Escrow"</strong> means the smart contract holding funds until release conditions are met.</li>
                            <li><strong>"Dispute"</strong> means any disagreement regarding the release of funds.</li>
                            <li><strong>"Platform"</strong> refers to the Lockler web application and associated smart contracts.</li>
                        </ul>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-purple-200 mb-2">3. User Responsibilities</h2>
                        <ul className="list-disc list-inside text-gray-200 text-sm ml-4">
                            <li>Users must provide accurate information and ensure they have the authority to enter into escrow agreements.</li>
                            <li>Users are responsible for securing their wallet credentials and private keys.</li>
                            <li>Users must comply with all applicable laws and regulations.</li>
                        </ul>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-purple-200 mb-2">4. Escrow Terms</h2>
                        <ul className="list-disc list-inside text-gray-200 text-sm ml-4">
                            <li>Funds are held in a smart contract until the agreed-upon conditions are met and a release is proposed and approved.</li>
                            <li>Either party may propose a fund release; disputes may be escalated to an arbitrator (e.g., Kleros) if enabled.</li>
                            <li>All transactions are final and irreversible once executed on-chain.</li>
                        </ul>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-purple-200 mb-2">5. Dispute Resolution</h2>
                        <ul className="list-disc list-inside text-gray-200 text-sm ml-4">
                            <li>Disputes regarding fund release may be resolved via the platform's integrated arbitration mechanism, if available.</li>
                            <li>Users agree to abide by the decision of the arbitrator or dispute resolution process.</li>
                        </ul>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-purple-200 mb-2">6. Limitation of Liability</h2>
                        <ul className="list-disc list-inside text-gray-200 text-sm ml-4">
                            <li>Lockler is provided "as is" without warranties of any kind. This is a super alpha version and may contain bugs or incomplete features.</li>
                            <li>The platform, its developers, and affiliates are not liable for any loss of funds due to user error, smart contract bugs, incorrect data, or third-party actions. No loss of funds (including through incorrect data or 'slip-throughs' because no one challenged incorrect transactions) is covered or liable by the platform.</li>
                            <li>Users assume all risks associated with blockchain transactions, including but not limited to incorrect data, unchallenged transactions, or bugs in the alpha version. You are solely responsible for verifying all data and transactions. If in doubt, use the <a href="https://app.safe.global/" className="text-purple-300 underline" target="_blank" rel="noopener noreferrer">official Safe app</a> or the respective chain explorer.</li>
                        </ul>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-purple-200 mb-2">7. Contact</h2>
                        <p className="text-gray-200 text-sm">
                            For questions or support, please contact <a href="https://t.me/daisugist" className="text-purple-300 underline" target="_blank" rel="noopener noreferrer">t.me/daisugist</a>.
                        </p>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    );
} 