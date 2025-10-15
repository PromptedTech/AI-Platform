import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';

const DEFAULT_CREDITS = 50;

/**
 * Get user's credit balance
 * @param {string} uid - User ID
 * @returns {Promise<number>} - Current credit balance
 */
export async function getUserCredits(uid) {
  if (!uid) {
    throw new Error('User ID is required');
  }

  try {
    const userDoc = await getDoc(doc(db, 'profiles', uid));
    
    if (!userDoc.exists()) {
      // Create profile with default credits if it doesn't exist
      await setDoc(doc(db, 'profiles', uid), {
        credits: DEFAULT_CREDITS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return DEFAULT_CREDITS;
    }

    const credits = userDoc.data().credits || 0;
    return credits;
  } catch (error) {
    console.error('Error getting user credits:', error);
    throw error;
  }
}

/**
 * Add credits to user's balance
 * @param {string} uid - User ID
 * @param {number} amount - Amount of credits to add
 * @returns {Promise<number>} - New credit balance
 */
export async function addCredits(uid, amount) {
  if (!uid) {
    throw new Error('User ID is required');
  }

  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }

  try {
    const userDocRef = doc(db, 'profiles', uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Create profile with default credits plus the amount
      const newBalance = DEFAULT_CREDITS + amount;
      await setDoc(userDocRef, {
        credits: newBalance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return newBalance;
    }

    // Update existing profile
    await updateDoc(userDocRef, {
      credits: increment(amount),
      updatedAt: new Date().toISOString(),
    });

    // Get updated balance
    const updatedDoc = await getDoc(userDocRef);
    return updatedDoc.data().credits;
  } catch (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
}

/**
 * Deduct credits from user's balance (won't go below 0)
 * @param {string} uid - User ID
 * @param {number} amount - Amount of credits to deduct
 * @returns {Promise<{success: boolean, newBalance: number, message?: string}>}
 */
export async function deductCredits(uid, amount) {
  if (!uid) {
    throw new Error('User ID is required');
  }

  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }

  try {
    const userDocRef = doc(db, 'profiles', uid);
    const userDoc = await getDoc(userDocRef);

    let currentBalance = DEFAULT_CREDITS;

    if (!userDoc.exists()) {
      // Create profile with default credits
      await setDoc(userDocRef, {
        credits: DEFAULT_CREDITS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      currentBalance = userDoc.data().credits || 0;
    }

    // Check if user has enough credits
    if (currentBalance < amount) {
      return {
        success: false,
        newBalance: currentBalance,
        message: `Insufficient credits. You have ${currentBalance} credits but need ${amount}.`,
      };
    }

    // Deduct credits
    const newBalance = currentBalance - amount;
    await updateDoc(userDocRef, {
      credits: newBalance,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      newBalance,
    };
  } catch (error) {
    console.error('Error deducting credits:', error);
    throw error;
  }
}

/**
 * Check if user has enough credits
 * @param {string} uid - User ID
 * @param {number} amount - Amount to check
 * @returns {Promise<boolean>}
 */
export async function hasEnoughCredits(uid, amount) {
  const balance = await getUserCredits(uid);
  return balance >= amount;
}

/**
 * Get or create user profile with default credits
 * @param {string} uid - User ID
 * @returns {Promise<{credits: number, createdAt: string, updatedAt: string}>}
 */
export async function getOrCreateProfile(uid) {
  if (!uid) {
    throw new Error('User ID is required');
  }

  try {
    const userDocRef = doc(db, 'profiles', uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      const newProfile = {
        credits: DEFAULT_CREDITS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, newProfile);
      return newProfile;
    }

    return userDoc.data();
  } catch (error) {
    console.error('Error getting or creating profile:', error);
    throw error;
  }
}

