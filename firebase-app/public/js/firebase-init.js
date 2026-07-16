// Firebase SDK'yı başlatır; menu.js ve admin.js buradan alır.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

export const app = initializeApp(window.FIREBASE_CONFIG);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Yerel geliştirme/test: adrese ?emu eklenirse emülatörlere bağlanır
if (new URLSearchParams(location.search).has('emu')) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}
