export function openWhatsApp(url: string) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isPWA = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in window.navigator && (window.navigator as any).standalone === true);

  if (isMobile) {
    // Em dispositivos móveis, o protocolo nativo evita o bloqueio de escopo do PWA 
    // e o erro de tela branca do iOS.
    let deepLink = url;
    if (url.includes('wa.me/')) {
      // Extrai o telefone e o texto da URL https://wa.me/PHONE?text=TEXT
      const parts = url.split('wa.me/');
      const afterDomain = parts[1] || ''; // ex: "5511999?text=oi" ou "?text=oi"
      
      const phonePart = afterDomain.split('?')[0]; // "5511999" ou ""
      const textPart = url.includes('?text=') ? url.split('?text=')[1] : '';
      
      if (phonePart) {
        deepLink = `whatsapp://send?phone=${phonePart}&text=${textPart}`;
      } else {
        deepLink = `whatsapp://send?text=${textPart}`;
      }
    }
    
    if (isIOS && isPWA) {
      // No iOS PWA, location.assign com esquema nativo é a única forma 100% segura
      window.location.assign(deepLink);
    } else {
      // Para Android ou Safari normal, tentamos o scheme, com fallback rápido
      window.location.href = deepLink;
      
      // Fallback pra web caso não tenha o app instalado
      setTimeout(() => {
        // Se a página ainda estiver ativa, o app não abriu
        if (document.hasFocus()) {
           window.open(url, '_blank');
        }
      }, 1000);
    }
  } else {
    // Desktop: abre normal em nova aba
    window.open(url, '_blank');
  }
}
