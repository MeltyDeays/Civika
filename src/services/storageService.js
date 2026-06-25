import { supabase } from "../core/supabaseClient";

const BUCKET_FOTOS = "fotos";

/**
 * Comprime una imagen en el navegador al porcentaje de calidad especificado.
 */
export const compressImage = (file, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    // Si no es imagen, no comprimir
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Mantener proporciones
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        
        // Convertir a JPEG con la calidad especificada (ej. 0.8)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Error al comprimir la imagen"));
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Sube un archivo a Supabase Storage (bucket: fotos).
 * Retorna la URL pública del archivo subido.
 */
export const uploadFile = async (bucket, file, folder = "denuncias") => {
  const bucketFinal = bucket || BUCKET_FOTOS;
  // Comprimir imagen a 80% de calidad antes de subir
  const compressedFile = await compressImage(file, 0.8);
  
  const fileExt = "jpg"; // Al comprimir, siempre forzamos jpg
  const fileName = `${folder}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucketFinal)
    .upload(fileName, compressedFile);

  if (error) {
    throw new Error(`Error subiendo archivo: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketFinal)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
};

/**
 * Sube una imagen al bucket fotos.
 */
export const uploadEvidencia = async (file) => {
  return uploadFile(BUCKET_FOTOS, file);
};
