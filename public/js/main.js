const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

// Function to add messages to chat
function appendMessage(text, sender) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBody.appendChild(msg);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Function to send message to server
async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  appendMessage(message, 'user');
  chatInput.value = '';

  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    let botText = "";
    if (data.choices?.[0]?.message?.content) {
      botText = data.choices[0].message.content;
    } else if (data.error) {
      botText = "Error: " + data.error;
    } else {
      botText = JSON.stringify(data, null, 2);
    }

    appendMessage(botText, 'bot');
  } catch (err) {
    appendMessage('Error: ' + err.message, 'bot');
  }
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Scroll to latest message whenever window resizes (keyboard pops up)
window.addEventListener('resize', () => {
  chatBody.scrollTop = chatBody.scrollHeight;
});