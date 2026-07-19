const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('/Users/luismiguelponceherrera/Downloads/didactia-app-firebase-adminsdk-fbsvc-efd44a2336.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function check() {
  const collections = await db.listCollections();
  console.log('Collections:', collections.map(c => c.id));
  const snap = await db.collection('_admin_users').get().catch(() => ({size: 0}));
  console.log('_admin_users size:', snap.size);
  process.exit(0);
}

check().catch(console.error);
