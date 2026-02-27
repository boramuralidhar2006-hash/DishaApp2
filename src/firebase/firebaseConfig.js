import { initializeApp } from 'firebase/app';
import { getDatabase }   from 'firebase/database';
import { getStorage }    from 'firebase/storage';

const firebaseConfig = {
  apiKey:            "AIzaSyC3lb5e31eduikkES6oRDenAWfwkkISjjY",
  authDomain:        "dishaapp-2a219.firebaseapp.com",
  databaseURL:       "https://dishaapp-2a219-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "dishaapp-2a219",
  storageBucket:     "dishaapp-2a219.firebasestorage.app",
  messagingSenderId: "1076015766668",
  appId:             "1:1076015766668:web:0c64945a0e5f7c5c162fa9",
  measurementId:     "G-E4003YD44K"
};

const app = initializeApp(firebaseConfig);

export const db      = getDatabase(app);
export const storage = getStorage(app); 