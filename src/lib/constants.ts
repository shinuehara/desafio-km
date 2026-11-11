export const SHIRT_SIZES = ["PP", "P", "M", "G", "GG", "XG"] as const;

/** Maior distância aceita num único registro (evita erro de digitação como "50" em vez de "5,0"). */
export const MAX_KM_PER_ACTIVITY = 60;

/**
 * Compressão das fotos no celular. A foto só precisa mostrar o número de km,
 * então 1280 px e qualidade 0,7 bastam (~100–200 KB por foto).
 */
export const PHOTO_MAX_SIDE_PX = 1280;
export const PHOTO_JPEG_QUALITY = 0.7;

/**
 * Foto do kit: aparece para todo mundo que abre a página do desafio, então precisa ser leve.
 * O navegador do organizador reduz para 1200 px antes de enviar (~100–250 KB).
 */
export const KIT_IMAGE_MAX_SIDE_PX = 1200;
export const KIT_IMAGE_JPEG_QUALITY = 0.8;
export const KIT_IMAGE_MAX_BYTES = 1024 * 1024;

/** Dias depois do fim do desafio em que as fotos são apagadas automaticamente. */
export const PHOTO_RETENTION_DAYS = 30;

/**
 * Tamanho máximo de um arquivo enviado (foto, PDF do regulamento, foto do kit).
 * As funções da Netlify recebem no máximo ~6 MB por requisição; 5 MB deixa folga.
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Tamanho máximo de uma foto depois da compressão no celular (normalmente fica em ~200 KB). */
export const MAX_PHOTO_BYTES = MAX_UPLOAD_BYTES;
