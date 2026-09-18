let locks = 0;

export function lockBodyScroll() {
  locks += 1;
  document.body.style.overflow = "hidden";
}

export function unlockBodyScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) document.body.style.overflow = "";
}
