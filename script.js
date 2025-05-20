const chatForm = document.getElementById("chat-form");
const chatArea = document.getElementById("chat-area");

//メッセージを表示する関数
function addMessage(message, sender = "user") {
    const msg = document.createElement("div");
    msg.className = `message ${sender}`;
    msg.innerText = message;
    chatArea.appendChild(msg);
    chatArea.scrollTop = chatArea.scrollHeight; //自動スクロール
}

//送信イベント
chatForm.addEventListener("submit ", async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, "user"); //ユーザーの入力を表示
    userInput.value = "";

    addMessage("考え中だよ", "bot");//一時メッセージ

    //chatGPTの返事を貰う（後で）
    const response = await getChatGPTReplay(text);

    //考え中を消して、返事を表示
    chattArea.lastChild.remove();
    addMessage(response, "bot");
});

async function getchatGPTReplay(userMessage) {
    const endpoint = "https://api.openai.com/v1/chat/completions";

    const body = {
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: "あなたは共感的でやさしいカウンセラーです。『うんうん』『わかるよ』『つらかったね』など全肯定して励ましてください" },
            { role: "user", content: userMessage }
        ],
        temperature: 0.8
    };

    const res = await fetch(endpoint, {
        method: "post",
        headers: {
            "content-Type": "application/json",
            "Authorization": `Bearer ${OPEN_API_KEY}`
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    return data.choices[0].message.content;
}