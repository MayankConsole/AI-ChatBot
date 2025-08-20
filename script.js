const Container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const themeToggleBtn = document.querySelector("#theme-toggle-btn");

// API setup
const API_KEY=YOUR_GEMINI_API_KEY_HERE;
const API_URL=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}
`;

let userMessage = "";
let typingInterval, controller;
const chatHistory = [];
const userData = {message: "", file: {} };

const createMsgElement = (content, ...classes ) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

const scrollToBottom = ()=> Container.scrollTo({top: Container.scrollHeight, behavior: "smooth"});

// simulate typing effect for bot responses
const typingEffect= (text , textElement , botMsgDiv) =>{
    textElement.textContent="";
    const words = text.split(" ");
    let wordIndex=0;
    // Set an interval to type each word
    typingInterval = setInterval(()=>{
        if(wordIndex<words.length){
            textElement.textContent+= (wordIndex === 0 ? "":" ")+words[wordIndex++];
            document.body.classList.add("bot-responding");
            scrollToBottom();
        }else{
            clearInterval(typingInterval);
            botMsgDiv.classList.remove("loading");
            document.body.classList.remove("bot-responding");
        }
    },40)
}

const generateResposnse= async(botMsgDiv)=>{
    const textElement = botMsgDiv.querySelector(".message-text");
    controller = new AbortController();

    chatHistory.length = 0;

    chatHistory.push({
        role: "user",
        parts: [{ text: userMessage}]
    })

    try{
        // send the chat history to the API to get a response 
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json",
                "X-Goog-Api-Key": API_KEY
            },
            body: JSON.stringify({contents: chatHistory }),
            signal: controller.signal
        });

        const data =await response.json();
        if(!response.ok) throw new Error(data.error.message);

        const responseText = data.candidates[0].content.parts[0].text.replace(/\*([^*]+)\*\*/g, "$1").trim();
        typingEffect(responseText, textElement,botMsgDiv)
        

    }catch(error){
        console.log(error)
    }
}

// handle the form submissiom
const handleFormSubmit = (e) => {
    e.preventDefault();
    userMessage = promptInput.value.trim();
    

    if (!userMessage || document.body.classList.contains("bot-responding")) return;

    promptInput.value="";
    userData.message = userMessage;
    document.body.classList.add("bot-responding", "chats-active");

    // Generate user Message HTML and add in the chats container
    const userMsgHTML = `<p class="message-text"></p>`;
    const userMsgDiv = createMsgElement(userMsgHTML, "user-message")

    userMsgDiv.querySelector(".message-text").textContent = userMessage;
    chatsContainer.appendChild(userMsgDiv);
    scrollToBottom();

    setTimeout(() => {

        // generate bot message HTML and add in the chats container after 600ms    
        const botMsgHTML = `<img src="bot_logo.svg" class="avatar"><p class="message-text">Thinking..</p>`;
        const botMsgDiv = createMsgElement(botMsgHTML, "bot-message","loading")
        chatsContainer.appendChild(botMsgDiv);
        scrollToBottom();
        generateResposnse(botMsgDiv);
    }, 600)
}

// stop Bot response
document.querySelector("#stop-response-btn").addEventListener("click",()=>{
    userData.file = {};
    controller?.abort();
    clearInterval(typingInterval);
    controller= null;
    const loadingMsg = chatsContainer.querySelector(".bot-message.loading");
    if (loadingMsg) {
        loadingMsg.classList.remove("loading");
    }

    document.body.classList.remove("bot-responding");
})

// Toggle dark/light theme
themeToggleBtn.addEventListener("click", () => {
  const isLightTheme = document.body.classList.toggle("light-theme");
  localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
  themeToggleBtn.textContent = isLightTheme ? "dark_mode" : "light_mode";
});

// Set initial theme from local storage
const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme", isLightTheme);
themeToggleBtn.textContent = isLightTheme ? "dark_mode" : "light_mode";


// Handle suggestions click
document.querySelectorAll(".suggestions-item").forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    promptInput.value = suggestion.querySelector(".text").textContent;
    promptForm.dispatchEvent(new Event("submit"));
  });
});

// delete all chat
document.querySelector("#delete-chats-btn").addEventListener("click",()=>{
    chatHistory.length=0;
    chatsContainer.innerHTML = "";
    document.body.classList.remove("bot-responding");
})

promptForm.addEventListener("submit", handleFormSubmit);