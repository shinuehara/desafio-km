export const SHIRT_SIZES = ["PP", "P", "M", "G", "GG", "XG"] as const;

/** Maior distância aceita num único registro (evita erro de digitação como "50" em vez de "5,0"). */
export const MAX_KM_PER_ACTIVITY = 60;

/** Tamanho máximo de uma foto depois da compressão no celular. */
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
