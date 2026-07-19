const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('/Users/luismiguelponceherrera/Downloads/edu-lm-firebase-adminsdk-fbsvc-6e77faab5c.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkUsers() {
  const snapshot = await db.collection('_admin_users').get();
  console.log(`Total users in _admin_users: ${snapshot.size}`);
  snapshot.forEach(doc => {
    let ts = doc.data().fechaRegistro;
    let fecha = 'No date';
    if (ts && ts.toDate) fecha = ts.toDate();
    console.log(doc.id, '=>', doc.data().email, '|', doc.data().nombre, '|', fecha);
  });
  process.exit(0);
}

checkUsers().catch(console.error);
