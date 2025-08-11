// Guarda un borrador temporal en sessionStorage
export const setMessageDraft = (text: string) => {
  try { sessionStorage.setItem('messageDraft', text); } catch {}
};

// Lee el borrador y lo borra (consumo único)
export const consumeMessageDraft = (): string => {
  try {
    const t = sessionStorage.getItem('messageDraft') || '';
    if (t) sessionStorage.removeItem('messageDraft');
    return t;
  } catch { return ''; }
};

// (Opcional) guardar el hospital destino
export const setMessageTarget = (hospitalId: string) => {
  try { sessionStorage.setItem('messageTarget', hospitalId); } catch {}
};

// (Opcional) leer y borrar el destino
export const consumeMessageTarget = (): string | null => {
  try {
    const id = sessionStorage.getItem('messageTarget');
    if (id) sessionStorage.removeItem('messageTarget');
    return id;
  } catch { return null; }
};
