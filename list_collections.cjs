const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('/Users/luismiguelponceherrera/Downloads/edu-lm-firebase-adminsdk-fbsvc-6e77faab5c.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function check() {
  const collections = await db.listCollections();
  console.log('Collections:', collections.map(c => c.id));
  process.exit(0);
}

check().catch(console.error);
