// script.js (chat.html で読み込まれるファイル)

const chatForm = document.getElementById("chat-form");
const chatArea = document.getElementById("chat-area");
const userInput = document.getElementById("user-input");
const currentCategoryDisplay = document.getElementById("current-category");

// カテゴリ変更機能の要素
const changeCategoryButton = document.getElementById("change-category-button");
const categorySelectionModal = document.getElementById("category-selection-modal");
const modalButtons = document.querySelectorAll(".modal-button");
const closeModalButton = document.getElementById("close-modal");

// URLからカテゴリを取得し、初期値を設定
const urlParams = new URLSearchParams(window.location.search);
let currentCategory = urlParams.get('category'); // letに変更

// カテゴリ名を表示するためのマッピング
const categoryNames = {
    "health": "健康の悩み",
    "ambition": "夢や将来の悩み",
    "relation": "人間関係の悩み",
    "money": "お金の悩み"
};

const initialMessage = currentCategory ? 
    `承知しました。${categoryNames[currentCategory]}についてですね。` : 
    'どんなお悩みでも、私が肯定的に受け止めます！';

// ページ読み込み時に最初のメッセージと現在のカテゴリを表示
window.addEventListener('load', () => {
    addMessage(initialMessage, 'bot');
    if (currentCategory) {
        currentCategoryDisplay.innerText = `現在の相談：${categoryNames[currentCategory]}`;
    }
});

// メッセージを表示する関数
function addMessage(message, sender = "user") {
    const msg = document.createElement("div");
    msg.className = `message ${sender}`;
    msg.innerText = message;
    chatArea.appendChild(msg);
    chatArea.scrollTop = chatArea.scrollHeight; 
}

// 送信イベント
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, "user"); 
    userInput.value = "";

    addMessage("考え中だよ", "bot");

    try {
        const response = await getGeminiReply(text, currentCategory); 

        if (chatArea.lastChild && chatArea.lastChild.innerText === "考え中だよ") {
            chatArea.lastChild.remove();
        }
        addMessage(response, "bot");
    } catch (error) {
        console.error("Gemini API の呼び出し中にエラーが発生しました:", error);
        if (chatArea.lastChild && chatArea.lastChild.innerText === "考え中だよ") {
            chatArea.lastChild.remove();
        }
        addMessage("ごめんね、うまくお話できないみたい。もう一度試してくれる？", "bot");
    }
});

// Gemini からの返答を取得する関数
async function getGeminiReply(userMessage, category) { 
    const CORRECT_MODEL_NAME = "gemini-1.5-flash";

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${CORRECT_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `あなたは共感的でやさしいカウンセラーです。ユーザーは現在、**${categoryNames[category]}**に関する悩みを持っています。どんな悩みも否定せず、ただ受け入れ、共感し、温かい言葉で励ますことに徹してください。アドバイスや解決策は一切提示せず、ユーザーの感情に寄り添い、安心感を与えることに集中してください。ユーザーの悩みは次の通りです。\n\nユーザー: ${userMessage}`;

    const body = {
        contents: [
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ],
        generationConfig: {
            temperature: 0.8
        },
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_NONE"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE"
            }
        ]
    };

    const res = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorData = await res.json();
        console.error("Gemini API エラーレスポンス:", errorData);
        throw new Error(`Gemini API エラー: ${res.status} ${res.statusText} - ${errorData.error ? errorData.error.message : '不明なエラー'}`);
    }

    const data = await res.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
    } else {
        console.warn("Gemini API から予期せぬ応答構造が返されました:", data);
        return "ごめんね、うまく理解できなかったみたい。";
    }
}



// モーダル表示
changeCategoryButton.addEventListener('click', () => {
    categorySelectionModal.classList.add('active');
});

// モーダルを閉じる
closeModalButton.addEventListener('click', () => {
    categorySelectionModal.classList.remove('active');
});

// モーダル内のボタン選択
modalButtons.forEach(button => {
    button.addEventListener('click', () => {
        // すでに選択されているボタンがあれば、スタイルをリセット
        modalButtons.forEach(btn => btn.classList.remove('selected'));
        
        // 新しいボタンに「選択済み」スタイルを追加
        button.classList.add('selected');
        
        // カテゴリを更新
        currentCategory = button.dataset.value;
        
        // カテゴリ名を表示する要素を更新
        currentCategoryDisplay.innerText = `現在の相談：${categoryNames[currentCategory]}`;

        // モーダルを閉じる
        categorySelectionModal.classList.remove('active');

        // チャットにメッセージを追加
        addMessage(`相談のカテゴリを「${categoryNames[currentCategory]}」に変更しました。`, "bot");
    });
});