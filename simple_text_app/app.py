from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Text Toolkit | Premium AI Utilities</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #6366f1;
            --accent: #a855f7;
            --bg: #0f172a;
            --card: rgba(30, 41, 59, 0.7);
        }
        
        body {
            font-family: 'Outfit', sans-serif;
            background: radial-gradient(circle at top left, #1e1b4b, #0f172a);
            color: #f8fafc;
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            width: 100%;
            max-width: 800px;
            background: var(--card);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        h1 {
            font-size: 2.5rem;
            font-weight: 600;
            margin-bottom: 8px;
            background: linear-gradient(to right, #818cf8, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        p.subtitle {
            color: #94a3b8;
            margin-bottom: 32px;
        }

        textarea {
            width: 100%;
            height: 200px;
            background: rgba(15, 23, 42, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 20px;
            color: #f1f5f9;
            font-family: 'Outfit', sans-serif;
            font-size: 1.1rem;
            resize: none;
            outline: none;
            transition: border-color 0.3s;
            box-sizing: border-box;
            margin-bottom: 24px;
        }

        textarea:focus {
            border-color: var(--primary);
        }

        .controls {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            margin-bottom: 32px;
        }

        button {
            padding: 12px 20px;
            border-radius: 12px;
            border: none;
            background: rgba(99, 102, 241, 0.1);
            color: #818cf8;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid rgba(99, 102, 241, 0.2);
        }

        button:hover {
            background: var(--primary);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
        }

        .result-area {
            background: rgba(15, 23, 42, 0.8);
            border-radius: 16px;
            padding: 24px;
            min-height: 60px;
            border-left: 4px solid var(--accent);
        }

        .result-label {
            font-weight: 600;
            color: var(--accent);
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.1em;
            margin-bottom: 8px;
        }

        #output {
            color: #e2e8f0;
            line-height: 1.6;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Text Toolkit</h1>
        <p class="subtitle">Premium utilities for quick text manipulation</p>
        
        <textarea id="input" placeholder="Paste your text here..."></textarea>
        
        <div class="controls">
            <button onclick="process('upper')">UPPERCASE</button>
            <button onclick="process('lower')">lowercase</button>
            <button onclick="process('reverse')">Reverse</button>
            <button onclick="process('count')">Analytics</button>
            <button onclick="testTrivia()" style="background: rgba(168, 85, 247, 0.1); color: #c084fc; border-color: rgba(168, 85, 247, 0.2);">TEST CLOUD AI</button>
        </div>

        <div class="result-area">
            <div class="result-label">Result</div>
            <div id="output">Output will appear here...</div>
        </div>
    </div>

    <script>
        async function testTrivia() {
            const input = document.getElementById('input').value;
            const output = document.getElementById('output');
            output.textContent = "⏳ Contacting Hugging Face Space...";
            
            try {
                const response = await fetch('/test-trivia', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: input })
                });
                const data = await response.json();
                if (data.success) {
                    output.innerHTML = `<span style="color: #4ade80">✅ SUCCESS:</span>\\n\\n${data.response}`;
                } else {
                    output.innerHTML = `<span style="color: #f87171">❌ FAILED:</span>\\n\\n${data.error}`;
                }
            } catch (err) {
                output.textContent = "Error: " + err.message;
            }
        }
        async function process(action) {
            const text = document.getElementById('input').value;
            if (!text) return;

            const response = await fetch('/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, action })
            });
            const data = await response.json();
            document.getElementById('output').textContent = data.result;
        }
    </script>
</body>
</html>
"""

@app.route('/process', methods=['POST'])
def process():
    data = request.json
    text = data.get('text', '')
    action = data.get('action', '')
    
    if action == 'upper':
        result = text.upper()
    elif action == 'lower':
        result = text.lower()
    elif action == 'reverse':
        result = text[::-1]
    elif action == 'count':
        words = len(text.split())
        chars = len(text)
        result = f"Analyzed Data:\\n\\nWords: {words}\\nCharacters: {chars}\\nSentences: {text.count('.') + text.count('!') + text.count('?')}"
    else:
        result = text
        
    return jsonify({'result': result})

import requests

@app.route('/test-trivia', methods=['POST'])
def test_trivia():
    import time
    user_prompt = request.json.get('prompt')
    
    # Use user prompt if provided, otherwise a dynamic default
    if user_prompt and user_prompt.strip():
        prompt = user_prompt
    else:
        prompt = f"Generate 1 unique and diverse Bible trivia question. Random seed: {time.time()}"
        
    api_url = "https://lennoxkk-trivia-model.hf.space/api/generate_trivia"
    payload = {"prompt": prompt}
    try:
        res = requests.post(api_url, json=payload, timeout=20)
        if res.status_code == 200:
            return jsonify(res.json())
        return jsonify({"success": False, "error": f"API Error: {res.status_code}", "raw": res.text})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 7860))
    app.run(debug=True, host='0.0.0.0', port=port)
