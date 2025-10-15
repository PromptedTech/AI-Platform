import { useState } from 'react';
import { claimDailyReward, isDailyRewardAvailable } from '../lib/rewards';
import BuyCreditsModal from './BuyCreditsModal';

export default function CreditsModal({ isOpen, onClose, currentCredits, onCreditsUpdate, userId }) {
  const [dailyRewardAvailable, setDailyRewardAvailable] = useState(null);
  const [claimingReward, setClaimingReward] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);

  const checkDailyReward = async () => {
    if (!userId) return;
    const available = await isDailyRewardAvailable(userId);
    setDailyRewardAvailable(available);
  };

  const handleClaimDaily = async () => {
    setClaimingReward(true);
    try {
      const result = await claimDailyReward(userId);
      setRewardMessage(result.message);
      setDailyRewardAvailable(false);
      if (result.claimed && result.credits) {
        onCreditsUpdate(currentCredits + result.credits);
      }
    } catch (error) {
      setRewardMessage('Failed to claim reward. Please try again.');
    } finally {
      setClaimingReward(false);
    }
  };

  const handlePurchaseSuccess = (newBalance) => {
    onCreditsUpdate(newBalance);
    setShowBuyModal(false);
  };

  if (!isOpen) return null;

  if (dailyRewardAvailable === null) {
    checkDailyReward();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Get More Credits</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Current balance: <span className="font-semibold text-primary-600 dark:text-primary-400">{currentCredits} credits</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Daily Reward */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-full">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Daily Login Reward</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Claim 10 free credits every day!</p>
                </div>
              </div>
              <button
                onClick={handleClaimDaily}
                disabled={!dailyRewardAvailable || claimingReward}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {claimingReward ? 'Claiming...' : dailyRewardAvailable ? 'Claim Now' : 'Claimed'}
              </button>
            </div>
            {rewardMessage && (
              <p className="mt-2 text-sm text-green-700 dark:text-green-300">{rewardMessage}</p>
            )}
          </div>

          {/* Credit Packages */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Purchase Credits</h3>
            <div className="flex justify-center">
              <button
                onClick={() => setShowBuyModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                View Credit Packages
              </button>
            </div>
          </div>

          {/* How to Earn */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">How to Earn Free Credits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Daily Login</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Get 10 credits every day</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Complete Achievements</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Unlock rewards by using the platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Buy Credits Modal */}
      <BuyCreditsModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        userId={userId}
        onSuccess={handlePurchaseSuccess}
      />
    </div>
  );
}


