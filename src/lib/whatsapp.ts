export function openWhatsApp(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isPWA = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in window.navigator && (window.navigator as any).standalone === true);

  if (isIOS && isPWA) {
    window.location.href = url;
  } else {
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
