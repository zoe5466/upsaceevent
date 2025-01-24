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
"test","宋捷仁","吳源偵","劉佳琪","王佑哲","郭丞哲","鄭彥杰","蕭潼","謝昌志","李建緯","黃鈞暉","史倍思","靼魅伊將","張峻銘","傅雨婷","黃偉嘉","沙威霖","邱豐文","徐子媛","郭子豪","黎國珽","曾心慈","石長澄","李東諺","葉晨曦","陳奕華","黃彥程","姚孟宏","周思妤","江亞桐","廖苑杏","吳國銓","洪朋緯","何佩霖","翁資涵","賴正于","翁維廷","張睿昌","周柏均","陳威宇","楊竣翔","游宗諺","張雨柔","廖英德","黃昱銀","吳思萱","鄧至翔","吳建龍","范子謙","鄭騰森","周聖霖","黃鼎鈞","李韶芯","韋伯瑄","沈柏江","胡玥瑩","陳羿均","劉子緒","王妍婷","黃昱嘉","陳俊良","賴筱薇","朱鑫健","陳世勛","石勝安","林沫玨","楊于萱","蔡宗辰","何貞儀","曾韋齊","唐知妘","李欣彥","文韻絜","詹亦軒","林昱學","葉書維","鄭建良","李潔明","馮弼惠","陳德潁","邱士宥","易瑞","孫孟良","朱芳儀","蕭雅方","郭紫嫻","林瑞苑","林今昇","邱浩翔","李振羽","郭相伶","鄭義騰","曾國豪","劉士緯","黃忻宇","邵怡雯","紀茗仁","邱鴻杰","施孟廷","陳怡如","何俊賢","許倧誠","邱金鈺","劉玨琳","張大偉","周運倫","卓濬哲","彭琬媮","陳宗奕","古欣玄","葉宏章","吳國華","譚瑋儒","曾琮皓","王泊淳","李佩珊","李冠瑢","陳嘉德","王俊傑","呂家瑜","林珮緹","陳韋旗","楊博丞","謝鈞豪","許桀煥","何振志","李建宸","林家鴻","楊俊憲","葉惠晴","曾國昌","周乃光"
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
    currentUser = user ? { name: user.displayName || "Anonymous", uid: user.uid } : null;
  });
}


/// 初始化 UI 元素
function initializeUI() {
  document.getElementById("checkInButton").addEventListener("click", checkIn);
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
    const group = groups.find((g) => g.name === existingUser.group);
    showMainContent(existingUser.group, existingUser.lotteryNumber, group.members);
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
  showMainContent(randomGroup.name, lotteryNumber, randomGroup.members);
} catch (error) {
  console.error("資料更新錯誤：", error);
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
  text: messageInput,
  image: imageUrl,
  user: currentUser?.name || "Anonymous",
  timestamp: new Date().toISOString()
};

await updateDoc(doc(db, "event-data", "data"), {
  messages: arrayUnion(message)
});
    console.log("留言提交成功！");
    refreshMessages();
} catch (error) {
  console.error("留言提交失敗：", error);
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
catch (error) {
  console.error("留言提交失敗：", error);
  alert("留言提交失敗，請稍後重試。");
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

// 顯示主功能區
function showMainContent(groupName, lotteryNumber, members) {
  document.getElementById("checkInSection").style.display = "none";
  document.getElementById("mainContent").style.display = "block";
  document.getElementById("lotteryNumber").innerText = `抽獎編號：${lotteryNumber}`;
  document.getElementById("groupInfo").innerText = `組別：${groupName}`;
  document.getElementById("groupMemberList").innerText = `組員：${(members || []).join(", ")}`;
}
