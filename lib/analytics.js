import { doc, getDoc, setDoc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { db } from './firebase';

const getStatsDocRef = (uid) => doc(db, 'users', uid, 'stats', 'summary');

export async function ensureStats(uid) {
  const ref = getStatsDocRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      totalChats: 0,
      totalImages: 0,
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
}

export async function trackLogin(uid) {
  if (!uid) return;
  const ref = getStatsDocRef(uid);
  const batch = writeBatch(db);
  batch.set(ref, { lastLogin: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
  await batch.commit();
}

export async function trackChat(uid) {
  if (!uid) return;
  const ref = getStatsDocRef(uid);
  const batch = writeBatch(db);
  batch.set(ref, { totalChats: increment(1), updatedAt: serverTimestamp() }, { merge: true });
  await batch.commit();
}

export async function trackImage(uid) {
  if (!uid) return;
  const ref = getStatsDocRef(uid);
  const batch = writeBatch(db);
  batch.set(ref, { totalImages: increment(1), updatedAt: serverTimestamp() }, { merge: true });
  await batch.commit();
}

export { getStatsDocRef };


