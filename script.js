// 引入 Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyDvnb7zYxmaT6bE44PpHpkx5eSL5vfQTyc",
  authDomain: "upsaceevent.firebaseapp.com",
  databaseURL: "https://upsaceevent-default-rtdb.firebaseio.com",
  projectId: "upsaceevent",
  storageBucket: "upsaceevent.appspot.com",
  messagingSenderId: "927813294597",
  appId: "1:927813294597:web:7b868bee2602a9d92b1a6c",
  measurementId: "G-LFGRN0KV0G"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// 組別與參加者資料
const groups = [
  { name: "紅中", image: "red_center.jpg", count: 0, members: [] },
  { name: "白板", image: "white_board.jpg", count: 0, members: [] },
  { name: "發財", image: "green_fortune.jpg", count: 0, members: [] },
  { name: "東風", image: "east_wind.jpg", count: 0, members: [] },
  { name: "南風", image: "south_wind.jpg", count: 0, members: [] },
  { name: "西風", image: "west_wind.jpg", count: 0, members: [] },
  { name: "北風", image: "north_wind.jpg", count: 0, members: [] },
  { name: "一萬", image: "one_ten_thousand.jpg", count: 0, members: [] },
  { name: "六筒", image: "six_circle.jpg", count: 0, members: [] },
  { name: "八條", image: "eight_stripe.jpg", count: 0, members: [] }
];

const participants = [
  "test", "宋捷仁", "吳源偵", "劉佳琪", "王佑哲", // ... 剩餘參加者資料
];

let checkedIn = [];
let currentUser = null; // 紀錄目前登入用戶
let reportCounter = 1;

// 初始化頁面
document.addEventListener("DOMContentLoaded", () => {
  setupAuthListener();
  initializeUI();
});

// 設置用戶認證監聽器
function setupAuthListener() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = { name: user.displayName || "Anonymous", uid: user.uid };
    } else {
      currentUser = null;
      console.log("未登入用戶");
    }
  });
}

// 初始化 UI 元素
function initializeUI() {
  document.getElementById("checkInButton").addEventListener("click", checkIn);
  document.getElementById("submitMessageButton").addEventListener("click", submitMessage);
  loadDataFromFirebase();
}

// 從 Firebase 加載資料
async function loadDataFromFirebase() {
  try {
    const snapshot = await getDoc(doc(db, "event-data", "data"));
    const data = snapshot.data();

    if (data) {
      checkedIn = data.checkedIn || [];
      groups.forEach((group) => {
        const groupData = data.groups?.[group.name];
        if (groupData) {
          group.members = groupData.members || [];
          group.count = group.members.length;
        }
      });

      updateCheckedInList();
      updateUncheckedList();
    }
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// 報到功能
async function checkIn() {
  const nameInput = document.getElementById("name").value.trim();
  const checkInMessage = document.getElementById("checkInMessage");

  if (!participants.includes(nameInput)) {
    checkInMessage.innerText = "名字不在名單中，請確認！";
    checkInMessage.style.color = "red";
    return;
  }

  const existingUser = checkedIn.find((user) => user.name === nameInput);
  if (existingUser) {
    // 已報到用戶顯示功能區
    checkInMessage.innerText = `您已經報到！組別：${existingUser.group}, 抽獎編號：${existingUser.lotteryNumber}`;
    checkInMessage.style.color = "green";

    // 確保更新 UI
    showMainContent(existingUser.group, groups.find(g => g.name === existingUser.group)?.members || []);
    return;
  }

  // 未報到用戶執行分配組別邏輯
  await assignGroup(nameInput);
}

// 分配組別
async function assignGroup(nameInput) {
  const checkInMessage = document.getElementById("checkInMessage");
  let randomGroup;

  do {
    randomGroup = groups[Math.floor(Math.random() * groups.length)];
  } while (randomGroup.count >= 13);

  randomGroup.count++;
  randomGroup.members.push(nameInput);

  const lotteryNumber = reportCounter++;
  const newUser = { name: nameInput, group: randomGroup.name, lotteryNumber };

  checkedIn.push(newUser);

  try {
    await updateDoc(doc(db, "event-data", "data"), {
      [`groups.${randomGroup.name}.members`]: arrayUnion(nameInput),
      [`groups.${randomGroup.name}.count`]: randomGroup.count,
      checkedIn: arrayUnion(newUser)
    });

    checkInMessage.innerText = `報到成功！您的組別為：${randomGroup.name}`;
    checkInMessage.style.color = "green";
    showMainContent(randomGroup.name, randomGroup.members);
    updateCheckedInList();
    updateUncheckedList();
  } catch (error) {
    console.error("資料更新錯誤：", error);
  }
}

// 提交留言
async function submitMessage() {
  const messageInput = document.getElementById("messageInput").value.trim();
  const imageInput = document.getElementById("imageInput").files[0];

  if (!messageInput && !imageInput) return;

  let imageUrl = null;

  if (imageInput) {
    const storageRef = ref(storage, `messages/${Date.now()}_${imageInput.name}`);
    await uploadBytes(storageRef, imageInput);
    imageUrl = await getDownloadURL(storageRef);
  }

  const message = {
    text: messageInput || null,
    image: imageUrl,
    user: currentUser?.name || "Anonymous",
    timestamp: new Date().toISOString()
  };

  try {
    await updateDoc(doc(db, "event-data", "data"), {
      messages: arrayUnion(message)
    });
    console.log("留言提交成功！");
    refreshMessages();
  } catch (error) {
    console.error("留言提交失敗：", error);
  }
}

// 刷新留言
async function refreshMessages() {
  try {
    const snapshot = await getDoc(doc(db, "event-data", "data"));
    const data = snapshot.data();
    const messages = data?.messages || [];

    const messageDisplay = document.getElementById("messageDisplay");
    messageDisplay.innerHTML = "";

    messages.slice(-10).forEach((msg) => {
      const messageElement = document.createElement("div");
      messageElement.classList.add("message-item");

      const userName = document.createElement("span");
      userName.innerText = `${msg.user}: `;
      messageElement.appendChild(userName);

      if (msg.image) {
        const image = document.createElement("img");
        image.src = msg.image;
        image.alt = "留言圖片";
        image.style.width = "50px";
        messageElement.appendChild(image);
      } else if (msg.text) {
        messageElement.innerText += msg.text;
      }

      messageDisplay.appendChild(messageElement);
    });
  } catch (error) {
    console.error("留言刷新失敗：", error);
  }
}

// 更新已報到人員
function updateCheckedInList() {
  const checkedInList = document.getElementById("checkedInList");
  checkedInList.innerHTML = checkedIn.map((user) => `<li>${user.name}</li>`).join("");
}

// 更新未報到人員
function updateUncheckedList() {
  const uncheckedList = document.getElementById("uncheckedList");
  const unchecked = participants.filter((name) => !checkedIn.some((user) => user.name === name));
  uncheckedList.innerHTML = unchecked.map((name) => `<li>${name}</li>`).join("");
}

// 顯示功能區內容
function showMainContent(groupName, members) {
  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = `
    <h2>歡迎來到功能區！</h2>
    <p>您的組別是：${groupName}</p>
    <p>當前組別成員：${members.join(", ")}</p>
  `;
  mainContent.style.display = "block";
}
