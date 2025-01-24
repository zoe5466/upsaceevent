// 引入 Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// Firebase 配置
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

const participants = [
"test","宋捷仁","吳源偵","劉佳琪","王佑哲","郭丞哲","鄭彥杰","蕭潼","謝昌志","李建緯","黃鈞暉","史倍思","靼魅伊將","張峻銘","傅雨婷","黃偉嘉","沙威霖","邱豐文","徐子媛","郭子豪","黎國珽","曾心慈","石長澄","李東諺","葉晨曦","陳奕華","黃彥程","姚孟宏","周思妤","江亞桐","廖苑杏","吳國銓","洪朋緯","何佩霖","翁資涵","賴正于","翁維廷","張睿昌","周柏均","陳威宇","楊竣翔","游宗諺","張雨柔","廖英德","黃昱銀","吳思萱","鄧至翔","吳建龍","范子謙","鄭騰森","周聖霖","黃鼎鈞","李韶芯","韋伯瑄","沈柏江","胡玥瑩","陳羿均","劉子緒","王妍婷","黃昱嘉","陳俊良","賴筱薇","朱鑫健","陳世勛","石勝安","林沫玨","楊于萱","蔡宗辰","何貞儀","曾韋齊","唐知妘","李欣彥","文韻絜","詹亦軒","林昱學","葉書維","鄭建良","李潔明","馮弼惠","陳德潁","邱士宥","易瑞","孫孟良","朱芳儀","蕭雅方","郭紫嫻","林瑞苑","林今昇","邱浩翔","李振羽","郭相伶","鄭義騰","曾國豪","劉士緯","黃忻宇","邵怡雯","紀茗仁","邱鴻杰","施孟廷","陳怡如","何俊賢","許倧誠","邱金鈺","劉玨琳","張大偉","周運倫","卓濬哲","彭琬媮","陳宗奕","古欣玄","葉宏章","吳國華","譚瑋儒","曾琮皓","王泊淳","李佩珊","李冠瑢","陳嘉德","王俊傑","呂家瑜","林珮緹","陳韋旗","楊博丞","謝鈞豪","許桀煥","何振志","李建宸","林家鴻","楊俊憲","葉惠晴","曾國昌","周乃光"
];

// 已報到參加者
let checkedIn = [];
let currentUser = null; // 紀錄當前報到的訪客
let reportCounter = 1; // 報到計數器

// 初始化頁面
document.addEventListener("DOMContentLoaded", () => {
  const mainContent = document.getElementById("mainContent");
  const checkInSection = document.getElementById("checkInSection");
  const checkInButton = document.getElementById("checkInButton"); // 取得按鈕元素
  
  if (checkInButton) {
    checkInButton.addEventListener("click", checkIn); // 綁定 checkIn 函數
  }
  if (mainContent) {
    mainContent.style.display = "none"; // 初始隱藏主功能區
  }
  if (checkInSection) {
    checkInSection.style.display = "block"; // 初始顯示報到區
  }

  // 從 Firebase 加載資料
  loadDataFromFirebase();
});

function loadDataFromFirebase() {
  const dbRef = doc(db, "event-data", "data"); // 指定文檔
  getDoc(dbRef).then((snapshot) => {  // 使用 getDoc 來獲取文檔
    const data = snapshot.data(); // 取得文檔的資料
    if (data) {
      // 加載已報到人員和分組資料
      checkedIn = data.checkedIn || [];
      groups.forEach(group => {
        if (data.groups && data.groups[group.name]) {
          group.members = data.groups[group.name].members || [];
          group.count = group.members.length;
        }
      });
      updateCheckedInList();
      updateUncheckedList();
    }
  }).catch((error) => {
    console.error("Error getting document:", error); // 處理錯誤
  });
}
      
// 確保 `checkIn()` 函式在外部調用時可以正確訪問
document.getElementById("checkInButton").addEventListener("click", checkIn);

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

  // 檢查是否已報到過
  const existingUser = checkedIn.find(user => user.name === nameInput);
  if (existingUser) {
    // 如果已經報到過，顯示組別和編號，直接跳到主頁
    checkInMessage.innerText = `您已經報到！組別：${existingUser.group}, 抽獎編號：${existingUser.lotteryNumber}`;
    checkInMessage.style.color = "green";
    updateHeader(existingUser.lotteryNumber, existingUser.group, existingUser.members);
    showMainContent(existingUser.group, existingUser.members);
    return;
  }

  // 進行報到和分組
  assignGroup(nameInput);
}

// 分配組別並儲存資料
function assignGroup(nameInput) {
  const checkInMessage = document.getElementById("checkInMessage");
  let randomGroup;

  // 隨機分組直到找到未滿 13 人的組別
  do {
    randomGroup = groups[Math.floor(Math.random() * groups.length)];
  } while (randomGroup.count >= 13);

  randomGroup.count++;
  randomGroup.members.push(nameInput);

  // 記錄使用者的組別和編號
  const lotteryNumber = reportCounter++;
  const currentUser = { 
    name: nameInput, 
    group: randomGroup.name, 
    lotteryNumber: lotteryNumber, 
    members: randomGroup.members
  };

  checkedIn.push(currentUser);  // 儲存報到人員資料

  // 更新 Firebase 資料
  const dbRef = doc(db, "event-data", "data");
  setDoc(dbRef, {
    groups: groups,
    checkedIn: checkedIn
  }).then(() => {
    console.log("資料已成功更新！");
  }).catch((error) => {
    console.error("資料更新錯誤：", error);
  });

  // 顯示成功信息
  checkInMessage.innerText = `報到成功！您的組別為：${randomGroup.name}`;
  checkInMessage.style.color = "green";

  // 更新主介面
  updateHeader(lotteryNumber, randomGroup.name, randomGroup.members);
  showMainContent(randomGroup.name, randomGroup.members);

  // 更新已報到和未報到名單
  updateCheckedInList();
  updateUncheckedList();
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
    
// 更新已報到人員名單
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

// 更新未報到人員名單
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

// Firebase 讀取數據並更新頁面
function loadDataFromFirebase() {
  const dbRef = doc(db, "event-data", "data");
  getDoc(dbRef).then((snapshot) => {
    const data = snapshot.data();
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
  }).catch((error) => {
    console.error("Error getting document:", error);
  });
}

// 每30秒刷新留言
setInterval(refreshMessages, 30000);

// 用戶資料
let currentUser = { name: "testUser" };  // 假設用戶名稱為 testUser，實際情況應該來自 Firebase 的認證或其他資料來源

// 綁定提交留言功能
document.getElementById("submitMessageButton").addEventListener("click", submitMessage);

// 提交留言功能
function submitMessage() {
  const message = document.getElementById("messageInput").value.trim();
  const messageDisplay = document.getElementById("messageDisplay");
  const imageInput = document.getElementById("imageInput").files[0];

   if (message || imageInput) {
    const newMessage = document.createElement("div");
    newMessage.classList.add("message-item");

    // 顯示留言者名稱
    const userName = document.createElement("span");
    userName.innerText = `${currentUser.name}: `;
    newMessage.appendChild(userName);  

    // 判斷是否為圖片
    if (imageInput) {
      const imageUrl = URL.createObjectURL(imageInput);
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = "留言圖片";
      image.style.width = "50px"; // 可以根據需要修改大小
      newMessage.appendChild(image);
    } else {
      newMessage.innerText += message;
    }

    // 將新留言插入到顯示區域
    messageDisplay.appendChild(newMessage);

    // 清空留言輸入框和圖片選擇框
    document.getElementById("messageInput").value = "";
    document.getElementById("imageInput").value = "";

    // 更新 Firebase 資料
    const dbRef = doc(db, "event-data", "data");
    updateDoc(dbRef, {
      messages: arrayUnion({
        text: message,
        image: imageInput ? imageUrl : null,
        user: currentUser.name,
        timestamp: new Date()
      })
    });
  }
}

// 刷新留言顯示
function refreshMessages() {
  const dbRef = doc(db, "event-data", "data");
  getDoc(dbRef).then((snapshot) => {
    const data = snapshot.data();
    if (data && data.messages) {
      const messages = data.messages.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10); // 最新的10條消息

      const messageDisplay = document.getElementById("messageDisplay");
      messageDisplay.innerHTML = "";  // 清空現有的留言

      messages.forEach(msg => {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message-item");

        const userName = document.createElement("span");
        userName.innerText = `${msg.user}: `;
        messageElement.appendChild(userName);

        // 如果有圖片
        if (msg.image) {
          const image = document.createElement("img");
          image.src = msg.image;
          image.alt = "留言圖片";
          image.style.width = "50px";
          messageElement.appendChild(image);
        } else {
          messageElement.innerText += msg.text;
        }

        messageDisplay.appendChild(messageElement);
      });
    }
  });
}

