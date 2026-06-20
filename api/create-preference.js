import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { escuelaId, nombreEscuela, usuarioId, emailDirector } = req.body;

  if (!escuelaId) {
    return res.status(400).json({ error: 'Missing required field: escuelaId' });
  }

  const email = emailDirector || 'director@escuela.com'; // fallback if undefined

  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    });

    const preference = new Preference(client);

    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

    const response = await preference.create({
      body: {
        items: [
          {
            id: 'licencia_anual',
            title: `Licencia DirectorIA - ${nombreEscuela || 'Escuela'}`,
            description: 'Acceso anual a todas las herramientas de DirectorIA',
            unit_price: 1999,
            quantity: 1,
            currency_id: 'MXN',
          },
        ],
        payer: {
          email: email,
        },
        back_urls: {
          success: `${appUrl}/pago-exitoso`,
          failure: `${appUrl}/pago-error`,
          pending: `${appUrl}/pago-pendiente`,
        },
        auto_return: 'approved',
        notification_url: `${appUrl}/api/mercadopago-webhook`,
        external_reference: escuelaId, // Usamos external_reference para identificar la escuela en el webhook
      },
    });

    res.status(200).json({ init_point: response.init_point, id: response.id });
  } catch (error) {
    console.error('Error creating preference:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
