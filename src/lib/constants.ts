export const SHIRT_SIZES = ["PP", "P", "M", "G", "GG", "XG"] as const;

/** Maior distância aceita num único registro (evita erro de digitação como "50" em vez de "5,0"). */
export const MAX_KM_PER_ACTIVITY = 60;

/**
 * Compressão das fotos no celular. A foto só precisa mostrar o número de km,
 * então 1280 px e qualidade 0,7 bastam (~100–200 KB por foto).
 */
export const PHOTO_MAX_SIDE_PX = 1280;
export const PHOTO_JPEG_QUALITY = 0.7;

/** Dias depois do fim do desafio em que as fotos são apagadas automaticamente. */
export const PHOTO_RETENTION_DAYS = 30;

/** Tamanho máximo de uma foto depois da compressão no celular. */
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
