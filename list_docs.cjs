const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('/Users/luismiguelponceherrera/Downloads/edu-lm-firebase-adminsdk-fbsvc-6e77faab5c.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function check() {
  const snapshot = await db.collection('schools').get();
  console.log(`Total docs in schools: ${snapshot.size}`);
  process.exit(0);
}

check().catch(console.error);
