import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { soloAdmin, json } from '@/lib/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Admin: sube una foto de producto a Cloudinary (máx. 5 MB) y devuelve su dirección
export const POST = (req: Request) => soloAdmin(req, async () => {
  const datos = await req.formData();
  const archivo = datos.get('file');
  if (!(archivo instanceof File)) return json({ message: 'No se recibió ningún archivo' }, { status: 400 });
  if (!archivo.type.startsWith('image/')) return json({ message: 'Solo se permiten imágenes' }, { status: 400 });
  if (archivo.size > 5 * 1024 * 1024) return json({ message: 'La imagen supera 5 MB' }, { status: 400 });

  const buf = Buffer.from(await archivo.arrayBuffer());
  const r = await new Promise<UploadApiResponse>((ok, mal) => {
    cloudinary.uploader.upload_stream(
      { folder: 'fredys-burger', transformation: [{ width: 800, crop: 'limit', quality: 'auto' }] },
      (err, res) => (err || !res ? mal(err) : ok(res)),
    ).end(buf);
  });
  return { url: r.secure_url, publicId: r.public_id };
});
