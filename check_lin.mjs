import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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

async function run() {
  const q = query(collection(db, 'teacher_association_forms'), where('name', '==', '林玉琴'));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.log('No user found with name 林玉琴.');
    process.exit(0);
  }

  const results = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    results.push({
      id: doc.id,
      name: data.name,
      totalFee: data.totalFee,
      paidAmount: data.paidAmount,
      transferDate: data.transferDate,
      accountLastFive: data.accountLastFive,
      paymentReportSource: data.paymentReportSource,
      reportedAt: data.reportedAt,
      isReconciled: data.isReconciled,
      createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString('zh-TW') : ''
    });
  });

  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

run().catch(console.error);
