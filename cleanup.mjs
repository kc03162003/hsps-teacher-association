import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCmjHcNVcBnZP6wGZye1cOuwhbgR028gFs",
  authDomain: "alba-a3861.firebaseapp.com",
  projectId: "alba-a3861",
  storageBucket: "alba-a3861.firebasestorage.app",
  messagingSenderId: "133561460813",
  appId: "1:133561460813:web:200fd7c428716872f3d404",
  measurementId: "G-SBLEQDZBZ4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanup() {
  try {
    // 1. Reset active year
    await setDoc(doc(db, "settings", "general"), { activeYear: "115學年度" }, { merge: true });
    console.log("Reset activeYear to 115學年度");

    // 2. Delete test records
    const q = query(collection(db, "teacher_association_forms"), where("year", "==", "116學年度"));
    const snapshot = await getDocs(q);
    
    let count = 0;
    for (const docSnapshot of snapshot.docs) {
      await deleteDoc(docSnapshot.ref);
      count++;
    }
    console.log(`Deleted ${count} test records from 116學年度`);
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

cleanup();
