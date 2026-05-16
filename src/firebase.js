import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCwR6oaxgL0dwg9bi40alv14cnjKo0UasI",
  authDomain: "strikegraph-cceb9.firebaseapp.com",
  databaseURL: "https://strikegraph-cceb9-default-rtdb.firebaseio.com",
  projectId: "strikegraph-cceb9",
  storageBucket: "strikegraph-cceb9.firebasestorage.app",
  messagingSenderId: "536567981300",
  appId: "1:536567981300:web:87ed61b8f93dcdf1eaeaa1"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
