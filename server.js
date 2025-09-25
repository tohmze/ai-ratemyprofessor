import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";

const app = express(); // Initialize Express app first

// Serve static front-end files from 'public' folder
app.use(express.static(path.join(path.resolve(), "public")));

app.use(cors());
app.use(express.json());

// Use environment variable for security
const INFERENCE_KEY = process.env.INFERENCE_KEY;
const INFERENCE_URL = "https://us.inference.heroku.com";

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await fetch(`${INFERENCE_URL}/v1/agents/heroku`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${INFERENCE_KEY}`,
        "X-Forwarded-Proto": "https",
      },
      body: JSON.stringify({
        model: "claude-3-7-sonnet",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Always respond in clean, plain text. Do NOT include Markdown symbols like #, ##, *, **, or `.`. Just write normal sentences with proper punctuation and full stops."
          },
          { role: "user", content: userMessage }
        ],
        tools: [
          { type: "mcp", name: "get_rate_my_professor_data" }
        ]
      }),
    });

    const text = await response.text();
    const lines = text.split("\n");
    let toolJSON = null;

    for (const line of lines) {
      if (line.startsWith("data:")) {
        const jsonStr = line.replace("data:", "").trim();
        if (jsonStr && jsonStr !== "[DONE]") {
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed?.choices?.[0]?.message?.content) {
              toolJSON = parsed;
            }
          } catch (e) {
            // Ignore invalid JSON chunks
          }
        }
      }
    }

    if (!toolJSON) {
      toolJSON = { error: "No MCP tool data received" };
    }

    res.json(toolJSON);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});