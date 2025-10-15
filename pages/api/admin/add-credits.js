import { db } from '../../../lib/firebase';
import { doc, setDoc, getDoc, increment, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, credits, reason } = req.body;

    if (!userId || !credits) {
      return res.status(400).json({ error: 'Missing userId or credits' });
    }

    // Update credits in profile
    const profileRef = doc(db, 'profiles', userId);
    
    // Check if profile exists, if not create it
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      await setDoc(profileRef, {
        credits: credits,
        displayName: '',
        bio: '',
        profilePic: '',
        createdAt: serverTimestamp()
      });
    } else {
      // Add credits to existing balance
      await setDoc(profileRef, {
        credits: increment(credits)
      }, { merge: true });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully added ${credits} credits`,
      reason: reason || 'Manual credit addition'
    });
  } catch (error) {
    console.error('Error adding credits:', error);
    return res.status(500).json({
      error: 'Failed to add credits',
      details: error.message,
    });
  }
}
