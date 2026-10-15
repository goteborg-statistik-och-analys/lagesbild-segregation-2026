(() => {
  'use strict';
  const root = document.documentElement;
  document.addEventListener('keydown', event => {
    if (['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      root.classList.add('keyboard-navigation');
    }
  }, true);
  document.addEventListener('pointerdown', () => root.classList.remove('keyboard-navigation'), true);
})();
