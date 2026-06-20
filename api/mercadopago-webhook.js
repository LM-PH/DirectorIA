import { MercadoPagoConfig, Payment } from 'mercadopago';
import admin from 'firebase-admin';

// Initialize Firebase Admin safely
if (!admin.apps.length) {
  try {
    // Check if the service account string is provided
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const serviceAccountParams = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountParams)
      });
    } else {
      console.warn("No FIREBASE_SERVICE_ACCOUNT_BASE64 found. Using default application credentials.");
      admin.initializeApp();
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { type, data } = req.body;
    
    // Sometimes MP sends 'action' instead of 'type' based on topics
    const actionType = type || req.body.action;

    if (actionType === 'payment' && data?.id) {
      const client = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      });
      const paymentClient = new Payment(client);
      
      const paymentInfo = await paymentClient.get({ id: data.id });
      
      const escuelaId = paymentInfo.external_reference;
      if (!escuelaId) {
        console.error('No external_reference (escuelaId) found in payment');
        return res.status(200).send('OK');
      }

      const status = paymentInfo.status;
      const licenseRef = db.collection('licencias').doc(escuelaId);

      if (status === 'approved') {
        const now = new Date();
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 365); // 365 días desde pago aprobado

        await licenseRef.set({
          estado: 'activa',
          tipo: 'pagada',
          fechaCompra: now.toISOString(),
          fechaVencimiento: expirationDate.toISOString(),
          paymentId: data.id,
          paymentStatus: 'approved',
          diasRestantes: 365,
          precio: 1999,
          updatedAt: now.toISOString()
        }, { merge: true });

        console.log(`License updated for school: ${escuelaId}`);
      } else if (status === 'pending') {
        await licenseRef.set({
          paymentId: data.id,
          paymentStatus: 'pending',
          estado: 'pendiente'
        }, { merge: true });
      } else if (status === 'rejected') {
        await licenseRef.set({
          paymentId: data.id,
          paymentStatus: 'rejected'
        }, { merge: true });
      }
    }

    res.status(200).send('Webhook received successfully');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook handler error');
  }
}
