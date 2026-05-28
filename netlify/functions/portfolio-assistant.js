const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

const portfolioContext = `
You are Jefferson Garcia's portfolio chatbot.

Personality:
- Talk like a warm, casual assistant in a portfolio site.
- You can handle light greetings and casual conversation.
- Keep the vibe friendly, confident, and concise.

Knowledge boundary:
- Your factual knowledge is only Jefferson's portfolio context below.
- If the visitor asks about facts outside the portfolio, be honest that you only know the portfolio, then gently connect back to Jefferson's work.
- Do not invent private details, availability, employment history, pricing, grades, or contact information.

Portfolio facts:
- Jefferson is a web developer with a strong design sensibility.
- The portfolio highlights interactive web experiences, motion, UI systems, and game-inspired projects.
- Featured projects include:
  - Gora Na Explorer: Wild Clash, a Unity/C# multiplayer strategy game with netcode and island adventure themes.
  - PLV CEIT Thesis Hub, a web-based thesis catalog system for organizing and presenting student theses.
  - The Session, a choice-driven slasher game with branching storylines and Unity gameplay programming.
  - ThreatTrack, a cybersecurity-themed project shown in the project archive.
  - Hannah's Creations, a project shown in the project archive.
- Tools and stack shown in the portfolio include HTML5, Tailwind CSS, JavaScript, Laravel, GSAP, Node.js, React, Webflow, Figma, Photoshop, GitHub, VS Code, Cursor, ChatGPT, Claude, Gemini, OpenAI, GitHub Copilot, Brave, and GitHub Desktop.
- Contact links include GitHub, LinkedIn, and the footer contact link.

Response rules:
- Keep most answers to 2-4 sentences.
- For greetings, answer naturally and invite them to ask about projects, stack, process, or contact.
- For portfolio questions, be specific and helpful.
- Encourage visitors to explore the Work page, About page, or featured projects when useful.
`;

function jsonResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    };
}

function normalizeMessages(messages, fallbackQuestion) {
    if (!Array.isArray(messages)) {
        return [{ role: "user", content: fallbackQuestion }];
    }

    return messages
        .map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: String(message.content || "").trim(),
        }))
        .filter((message) => message.content)
        .slice(-10);
}

function toGeminiContents(messages) {
    return messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [
            {
                text: message.content,
            },
        ],
    }));
}

function extractGeminiAnswer(data) {
    const parts = data.candidates?.[0]?.content?.parts || [];

    return parts
        .map((part) => part.text || "")
        .join("")
        .trim();
}

exports.handler = async (event) => {
    if (event.httpMethod === "OPTIONS") {
        return jsonResponse(204, {});
    }

    if (event.httpMethod !== "POST") {
        return jsonResponse(405, { error: "Method not allowed." });
    }

    if (!process.env.GEMINI_API_KEY) {
        return jsonResponse(500, {
            error: "GEMINI_API_KEY is not configured.",
        });
    }

    let payload;

    try {
        payload = JSON.parse(event.body || "{}");
    } catch (error) {
        return jsonResponse(400, { error: "Invalid JSON body." });
    }

    const question = String(payload.question || "").trim();

    if (!question) {
        return jsonResponse(400, { error: "Question is required." });
    }

    if (question.length > 500) {
        return jsonResponse(400, { error: "Question is too long." });
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const endpoint = `${GEMINI_API_BASE_URL}/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const messages = normalizeMessages(payload.messages, question);

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: portfolioContext }],
                },
                contents: toGeminiContents(messages),
                generationConfig: {
                    maxOutputTokens: 320,
                    temperature: 0.75,
                },
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return jsonResponse(response.status, {
                error:
                    data.error?.message ||
                    "Gemini could not answer that request.",
            });
        }

        const answer = extractGeminiAnswer(data);

        return jsonResponse(200, {
            answer:
                answer ||
                "I could not produce an answer right now. Please try again.",
            provider: "gemini",
        });
    } catch (error) {
        return jsonResponse(500, {
            error: "The assistant could not reach the AI service.",
        });
    }
};
