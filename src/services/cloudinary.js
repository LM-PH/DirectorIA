/**
 * Servicio de subida de archivos directos a Cloudinary usando Unsigned Upload Presets.
 * Evita la necesidad de usar Firebase Storage (ahorrando cargos del plan Blaze).
 */
export const uploadToCloudinary = async (file, folder = 'general') => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dhjpdmydx';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'directoria_preset';
  
  if (!file) {
    throw new Error('No se ha proporcionado ningún archivo para subir.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder); // Organiza las carpetas automáticamente en tu biblioteca de Cloudinary

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error detallado de Cloudinary:', errorData);
      throw new Error(errorData.error?.message || 'Error al subir archivo a Cloudinary.');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      name: file.name,
      type: file.type
    };
  } catch (err) {
    console.error('Error en el servicio de subida a Cloudinary:', err);
    throw err;
  }
};
