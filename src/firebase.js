import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC3Pzttuh4vBXErie5KrU4kF6--TJFTxcM",
  authDomain: "toan-hoc-game.firebaseapp.com",
  databaseURL: "https://toan-hoc-game-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "toan-hoc-game",
  storageBucket: "toan-hoc-game.firebasestorage.app",
  messagingSenderId: "1086037209284",
  appId: "1:1086037209284:web:3848539f9e4eaa8b29d991"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
