function applyPosture(type) {
  if (type === 'folded') {
    document.documentElement.dataset.posture = 'folded';
  } else {
    delete document.documentElement.dataset.posture;
  }
}

if ('devicePosture' in navigator && navigator.devicePosture) {
  applyPosture(navigator.devicePosture.type);
  navigator.devicePosture.addEventListener('change', () => {
    applyPosture(navigator.devicePosture.type);
  });
}
