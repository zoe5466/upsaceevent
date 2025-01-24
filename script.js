// 引入 Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDvnb7zYxmaT6bE44PpHpkx5eSL5vfQTyc",
  authDomain: "upsaceevent.firebaseapp.com",
  databaseURL: "https://upsaceevent-default-rtdb.firebaseio.com",
  projectId: "upsaceevent",
  storageBucket: "upsaceevent.firebasestorage.app",
  messagingSenderId: "927813294597",
  appId: "1:927813294597:web:7b868bee2602a9d92b1a6c",
  measurementId: "G-LFGRN0KV0G"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 組別與座位圖
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

// 已報到參加者
let checkedIn = [];
let currentUser = null; // 紀錄當前報到的訪客
let reportCounter = 1; // 報到計數器

// 初始化頁面
document.addEventListener("DOMContentLoaded", () => {
  const mainContent = document.getElementById("mainContent");
  const checkInSection = document.getElementById("checkInSection");

  if (mainContent) {
    mainContent.style.display = "none"; // 初始隱藏主功能區
  }
  if (checkInSection) {
    checkInSection.style.display = "block"; // 初始顯示報到區
  }

  // 從 Firebase 加載資料
  loadDataFromFirebase();
});

// 從 Firebase 加載資料
function loadDataFromFirebase() {
  const dbRef = ref(database, "event-data/");
  onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // 加載已報到人員和分組資料
      checkedIn = data.checkedIn || [];
      groups.forEach(group => {
        if (data.groups && data.groups[group.name]) {
          group.members = data.groups[group.name].members || [];
          group.count = group.members.length;
        }
      });

      // 更新頁面顯示
      updateCheckedInList();
      updateUncheckedList();
    }
  });
}

// 報到功能
function checkIn() {
  const nameInput = document.getElementById("name").value.trim();
  const checkInMessage = document.getElementById("checkInMessage");

  // 檢查名字是否在名單中
  if (!participants.includes(nameInput)) {
    checkInMessage.innerText = "名字不在名單中，請確認！";
    checkInMessage.style.color = "red";
    return;
  }

  // 檢查是否已報到
  if (checkedIn.includes(nameInput)) {
    checkInMessage.innerText = "您已經報到過了！";
    checkInMessage.style.color = "red";
    return;
  }

  // 進行報到和分組
  assignGroup(nameInput);
}

function assignGroup(nameInput) {
  const checkInMessage = document.getElementById("checkInMessage");

  let randomGroup;

  // 隨機分組直到找到未滿 13 人的組別
  do {
    randomGroup = groups[Math.floor(Math.random() * groups.length)];
  } while (randomGroup.count >= 13);

  randomGroup.count++;
  randomGroup.members.push(nameInput);

  checkedIn.push(nameInput);
  currentUser = { 
    name: nameInput, 
    group: randomGroup.name, 
    lotteryNumber: reportCounter++ 
  }; // 紀錄訪客身份

  // 更新 Firebase 資料
  const dbRef = ref(database, "event-data/");
  update(dbRef, {
    [`groups/${randomGroup.name}/members`]: randomGroup.members,
    checkedIn: checkedIn
  });

  // 顯示成功信息
  checkInMessage.innerText = `報到成功！您的組別為：${randomGroup.name}`;
  checkInMessage.style.color = "green";

  // 更新主介面
  updateHeader(currentUser.lotteryNumber, randomGroup.name, randomGroup.members);
  showMainContent(randomGroup.name, randomGroup.members);
}

// 更新報到後的資訊
function updateHeader(lotteryNumber, groupName, groupMembers) {
  document.getElementById("lotteryNumber").innerText = `抽獎編號：${lotteryNumber}`;
  document.getElementById("groupInfo").innerText = `組別：${groupName}`;
  document.getElementById("groupMemberList").innerText = `組員：${groupMembers.join(", ")}`;
}

// 顯示主功能內容
function showMainContent(groupName, groupMembers) {
  const checkInSection = document.getElementById("checkInSection");
  const mainContent = document.getElementById("mainContent");

  if (!checkInSection || !mainContent) {
    console.error("HTML 結構中缺少 checkInSection 或 mainContent！");
    return;
  }

  // 隱藏報到區
  checkInSection.style.display = "none";

  // 顯示主功能區域
  mainContent.style.display = "block";

  // 更新歡迎信息
  const welcomeMessage = document.getElementById("welcomeMessage");
  if (welcomeMessage) {
    welcomeMessage.innerText = `歡迎您！您的組別為：${groupName}`;
  }
}

// 更新已報到人員列表
function updateCheckedInList() {
  const checkedInList = document.getElementById("checkedInList");
  if (!checkedInList) return;

  checkedInList.innerHTML = ""; // 清空列表

  checkedIn.forEach(person => {
    const listItem = document.createElement("li");
    listItem.innerText = person;
    checkedInList.appendChild(listItem);
  });
}

// 更新尚未報到人員列表
function updateUncheckedList() {
  const uncheckedList = document.getElementById("uncheckedList");
  if (!uncheckedList) return;

  uncheckedList.innerHTML = ""; // 清空列表

  participants.forEach(person => {
    if (!checkedIn.includes(person)) {
      const listItem = document.createElement("li");
      listItem.innerText = person;
      uncheckedList.appendChild(listItem);
    }
  });
}


// 提交留言
function submitMessage() {
  const message = document.getElementById("messageInput").value.trim();
  if (message) {
    const messages = document.getElementById("messages");
    if (!messages) return;

    const newMessage = document.createElement("p");
    newMessage.innerText = message;
    messages.appendChild(newMessage);

    // 清空留言輸入框
    document.getElementById("messageInput").value = "";
  }
}
