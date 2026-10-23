import asyncio
import os
import threading
import io
from flask import Flask, jsonify
from telethon import TelegramClient, events
from PIL import Image
import pytesseract

app = Flask(__name__)

# Глобальний стан хабу (світло + безпека)
hub_data = {
    "schedule": {
        "source": "system",
        "text": "Очікування перших даних з Telegram каналів...",
        "date": ""
    },
    "security": {
        "alertActive": False,
        "region": "Новояворівськ / Львівська обл.",
        "message": "Ситуація стабільна. У регіоні тривоги немає.",
        "nationwideSummary": "Моніторинг регіонів України активний...",
        "timestamp": ""
    }
}

@app.route("/")
def home():
    return "Sich AI Monitor & Security Hub is active!"

@app.route("/get-schedule", methods=["GET"])
def get_schedule():
    return jsonify(hub_data)

# Telegram дані
API_ID = 33700593
API_HASH = "9175371e708239d2c7115af22c088001"

POWER_CHANNELS = ["lviv_svitlo", "yantarnefm24"]
SECURITY_CHANNELS = ["vanek_nn", "air_alert_ua", "monitorwithuss"] # Моніторингові канали тривог
ALL_CHANNELS = list(set(POWER_CHANNELS + SECURITY_CHANNELS))

POWER_KEYWORDS = ["світло", "відключення", "графік", "черга", "нафтогаз", "аварійне", "електро"]
LOCAL_DANGER_KEYWORDS = ["львів", "яворів", "новояворівськ", "область", "пуск", "ракета на львів", "дрон на львів"]

client = TelegramClient("sich_monitor_session", API_ID, API_HASH)

@client.on(events.NewMessage(chats=ALL_CHANNELS))
async def handle_new_post(event):
    global hub_data
    message_text = event.message.text or ""
    chat_username = event.chat.username or "channel"
    extracted_from_image = ""

    # Обробка картинок (OCR)
    if event.message.photo:
        try:
            photo_bytes = await event.message.download_media(bytes)
            image = Image.open(io.BytesIO(photo_bytes))
            extracted_from_image = pytesseract.image_to_string(image, lang='ukr+eng').strip()
        except Exception as e:
            print(f"[!] Помилка OCR: {e}")

    full_text = f"{message_text}\n{extracted_from_image}".lower()

    # 1. Перевірка на графіки світла
    if chat_username in POWER_CHANNELS or any(kw in full_text for kw in POWER_KEYWORDS):
        display_text = f"📷 [Фото-графік]\n{extracted_from_image}" if event.message.photo and not message_text else f"{message_text}\n{extracted_from_image}".strip()
        hub_data["schedule"] = {
            "source": chat_username,
            "text": display_text if display_text else "Отримано нове зображення.",
            "date": str(event.message.date)
        }
        print(f"[!] Оновлено графік світла з @{chat_username}")

    # 2. Перевірка безпеки та тривог (Цифровий Ангел)
    if any(kw in full_text for kw in ["тривога", "вибух", "удар", "ракета", "бпла", "шахед", "львів"]):
        is_local_threat = any(loc in full_text for loc in LOCAL_DANGER_KEYWORDS)
        
        hub_data["security"] = {
            "alertActive": is_local_threat,
            "region": "Новояворівськ / Львівська обл." if is_local_threat else "Україна (Загальний моніторинг)",
            "message": f"[{chat_username}]: {message_text[:300]}...",
            "nationwideSummary": f"Останнє зведення (@{chat_username}): {message_text[:200]}...",
            "timestamp": str(event.message.date)
        }
        if is_local_threat:
            print(f"[!] УВАГА! Загроза для регіону зафіксована в @{chat_username}")

async def start_telegram():
    print("Підключення до Telegram монітора безпеки та енергії...")
    await client.start()
    print("Telegram монітор успішно слухає всі канали!")
    await client.run_until_disconnected()

def run_telegram_bot():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(start_telegram())

if __name__ == "__main__":
    t = threading.Thread(target=run_telegram_bot, daemon=True)
    t.start()
    
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)