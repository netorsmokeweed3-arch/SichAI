import asyncio
import os
import threading
from flask import Flask, jsonify
from telethon import TelegramClient, events

app = Flask(__name__)

# Зберігаємо останній знайдений графік у пам'яті сервісу
latest_schedule = {
    "source": "system",
    "text": "Очікування перших даних з Telegram каналів...",
    "date": ""
}

@app.route("/")
def home():
    return "Sich AI Telegram Monitor is active and running!"

@app.route("/get-schedule", methods=["GET"])
def get_schedule():
    return jsonify(latest_schedule)

# Дані твого Telegram додатку
API_ID = 33700593
API_HASH = "9175371e708239d2c7115af22c088001"

TARGET_CHANNELS = ["lviv_svitlo", "yantarnefm24"]
KEYWORDS = ["світло", "відключення", "графік", "черга", "нафтогаз", "аварійне", "електро"]

client = TelegramClient("sich_monitor_session", API_ID, API_HASH)

@client.on(events.NewMessage(chats=TARGET_CHANNELS))
async def handle_new_post(event):
    global latest_schedule
    message_text = event.message.text or ""
    
    if any(keyword in message_text.lower() for keyword in KEYWORDS):
        latest_schedule = {
            "source": event.chat.username,
            "text": message_text,
            "date": str(event.message.date)
        }
        print(f"[!] Оновлено графік з каналу: {event.chat.username}")

async def start_telegram():
    print("Підключення до Telegram...")
    await client.start()
    print("Telegram монітор успішно слухає канали в реальному часі!")
    await client.run_until_disconnected()

def run_telegram_bot():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(start_telegram())

if __name__ == "__main__":
    # Запускаємо Telegram у фоновому потоці
    t = threading.Thread(target=run_telegram_bot, daemon=True)
    t.start()
    
    # Запускаємо Flask-сервер на порті, який виділить Render
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)