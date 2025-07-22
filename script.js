// script.js
const chatForm = document.getElementById("chat-form");
const chatArea = document.getElementById("chat-area");
const userInput = document.getElementById("user-input");

// メッセージを表示する関数
function addMessage(message, sender = "user") {
    const msg = document.createElement("div");
    msg.className = `message ${sender}`;
    msg.innerText = message;
    chatArea.appendChild(msg);
    chatArea.scrollTop = chatArea.scrollHeight; // 自動スクロール
}

// 送信イベント
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, "user"); // ユーザーの入力を表示
    userInput.value = "";

    addMessage("考え中だよ", "bot"); // 一時メッセージ

    try {
        // Gemini の返事を貰う
        const response = await getGeminiReply(text);

        // 考え中を消して、返事を表示
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
async function getGeminiReply(userMessage) {
    // ★★★ ここを、コンソールで確認した正しいモデル名に書き換える ★★★
    // 例: "gemini-1.0-pro" または "gemini-1.0-pro-latest" など
// script.js の getGeminiReply 関数内

 const CORRECT_MODEL_NAME = "gemini-1.5-flash";

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${CORRECT_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

    // プロンプトエンジニアリング: 全肯定カウンセラーとしての役割を設定
    const prompt = `あなたは共感的でやさしいカウンセラーです。「うんうん」「わかるよ」「つらかったね」など全肯定して励ましてください。ユーザーの悩みは次の通りです。\n\nユーザー: ${userMessage}`;

    const body = {
        contents: [
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ],
        generationConfig: {
            temperature: 0.8 // 応答の創造性を制御 (0.0から1.0)
        },
        safetySettings: [ // 安全性に関する設定（必要に応じて調整）
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

// script.js (一時的に追加するコード)

// ここにあなたのGemini APIキーを貼り付けてください
const GEMINI_API_KEY = "AIzaSyAafVcU0UyfgLvrbGpQBZknzR53HcLXWek";

async function listAvailableModels() {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(endpoint);
        const data = await response.json();

        if (!response.ok) {
            console.error("Error fetching models:", data.error);
            return;
        }

        console.log("=== 利用可能な全モデル ===", data.models);

        const textGenerationModels = data.models.filter(model =>
            model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")
        );

        console.log("=== テキスト生成（generateContent）に対応しているモデル ===", textGenerationModels);

    } catch (error) {
        console.error("モデルリストの取得に失敗しました:", error);
    }
}

listAvailableModels(); // この関数を実行してコンソールに表示させます