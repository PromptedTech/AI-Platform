import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { addCredits } from './credits';

/**
 * Check and claim daily login reward
 * @param {string} uid - User ID
 * @returns {Promise<{claimed: boolean, credits?: number, message: string}>}
 */
export async function claimDailyReward(uid) {
  if (!uid) throw new Error('User ID is required');

  try {
    const rewardsRef = doc(db, 'rewards', uid);
    const rewardsDoc = await getDoc(rewardsRef);
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyRewardAmount = 10;

    if (!rewardsDoc.exists()) {
      // First time claiming
      await setDoc(rewardsRef, {
        lastDailyReward: today,
        totalDaysLogged: 1,
        createdAt: new Date().toISOString(),
      });
      
      await addCredits(uid, dailyRewardAmount);
      
      return {
        claimed: true,
        credits: dailyRewardAmount,
        message: `Welcome! You earned ${dailyRewardAmount} credits for your first login!`,
      };
    }

    const data = rewardsDoc.data();
    const lastClaim = data.lastDailyReward;

    if (lastClaim === today) {
      return {
        claimed: false,
        message: 'You already claimed your daily reward today. Come back tomorrow!',
      };
    }

    // Claim reward
    await updateDoc(rewardsRef, {
      lastDailyReward: today,
      totalDaysLogged: (data.totalDaysLogged || 0) + 1,
    });

    await addCredits(uid, dailyRewardAmount);

    return {
      claimed: true,
      credits: dailyRewardAmount,
      message: `Daily reward claimed! You earned ${dailyRewardAmount} credits!`,
    };
  } catch (error) {
    console.error('Error claiming daily reward:', error);
    throw error;
  }
}

/**
 * Check if daily reward is available
 * @param {string} uid - User ID
 * @returns {Promise<boolean>}
 */
export async function isDailyRewardAvailable(uid) {
  if (!uid) return false;

  try {
    const rewardsRef = doc(db, 'rewards', uid);
    const rewardsDoc = await getDoc(rewardsRef);
    
    if (!rewardsDoc.exists()) return true;
    
    const today = new Date().toISOString().split('T')[0];
    const lastClaim = rewardsDoc.data().lastDailyReward;
    
    return lastClaim !== today;
  } catch (error) {
    console.error('Error checking daily reward:', error);
    return false;
  }
}

/**
 * Achievement-based rewards
 */
export const ACHIEVEMENTS = [
  {
    id: 'first-chat',
    title: 'First Conversation',
    description: 'Send your first chat message',
    credits: 5,
    condition: (stats) => stats.totalChats >= 1,
  },
  {
    id: 'chat-master',
    title: 'Chat Master',
    description: 'Send 50 chat messages',
    credits: 25,
    condition: (stats) => stats.totalChats >= 50,
  },
  {
    id: 'first-image',
    title: 'Image Creator',
    description: 'Generate your first image',
    credits: 10,
    condition: (stats) => stats.totalImages >= 1,
  },
  {
    id: 'image-artist',
    title: 'Image Artist',
    description: 'Generate 20 images',
    credits: 50,
    condition: (stats) => stats.totalImages >= 20,
  },
  {
    id: 'daily-streak-7',
    title: 'Week Warrior',
    description: 'Login for 7 days in a row',
    credits: 30,
    condition: (stats) => stats.loginStreak >= 7,
  },
];

/**
 * Check and claim achievements
 * @param {string} uid - User ID
 * @param {Object} stats - User stats {totalChats, totalImages, loginStreak}
 * @returns {Promise<Array>} - Newly unlocked achievements
 */
export async function checkAchievements(uid, stats) {
  if (!uid) throw new Error('User ID is required');

  try {
    const achievementsRef = doc(db, 'achievements', uid);
    const achievementsDoc = await getDoc(achievementsRef);
    
    const claimed = achievementsDoc.exists() ? achievementsDoc.data().claimed || [] : [];
    const newAchievements = [];

    for (const achievement of ACHIEVEMENTS) {
      if (!claimed.includes(achievement.id) && achievement.condition(stats)) {
        claimed.push(achievement.id);
        await addCredits(uid, achievement.credits);
        newAchievements.push(achievement);
      }
    }

    if (newAchievements.length > 0) {
      await setDoc(achievementsRef, { claimed, updatedAt: new Date().toISOString() });
    }

    return newAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    throw error;
  }
}

/**
 * Get user's claimed achievements
 * @param {string} uid - User ID
 * @returns {Promise<Array>}
 */
export async function getClaimedAchievements(uid) {
  if (!uid) return [];

  try {
    const achievementsRef = doc(db, 'achievements', uid);
    const achievementsDoc = await getDoc(achievementsRef);
    
    if (!achievementsDoc.exists()) return [];
    
    return achievementsDoc.data().claimed || [];
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
}


