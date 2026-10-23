import asyncio
import os
import threading
import io
from flask import Flask, jsonify
from telethon import TelegramClient, events
from PIL import Image
import pytesseract

app = Flask(__name__)

# Зберігаємо останній знайдений графік у пам'яті сервісу
latest_schedule = {
    "source": "system",
    "text": "Очікування перших даних з Telegram каналів...",
    "date": ""
}

@app.route("/")
def home():
    return "Sich AI Telegram Monitor is active and running with OCR!"

@app.route("/get-schedule", methods=["GET"])
def get_schedule():
    return jsonify(latest_schedule)

# Дані твого Telegram додатку
API_ID = 33700593
API_HASH = "9175371e708239d2c7115af22c088001"

TARGET_CHANNELS = ["lviv_svitlo", "yantarnefm24"]
KEYWORDS = ["світло", "відключення", "графік", "черга", "нафтогаз", "аварійне", "електро", "годин"]

client = TelegramClient("sich_monitor_session", API_ID, API_HASH)

@client.on(events.NewMessage(chats=TARGET_CHANNELS))
async def handle_new_post(event):
    global latest_schedule
    message_text = event.message.text or ""
    extracted_from_image = ""

    # Перевіряємо, чи є в повідомленні картинка (фото)
    if event.message.photo:
        try:
            print("[*] Знайдено картинку у повідомленні, завантажуємо для OCR...")
            photo_bytes = await event.message.download_media(bytes)
            image = Image.open(io.BytesIO(photo_bytes))
            
            # Розпізнаємо текст (українська + англійська)
            extracted_from_image = pytesseract.image_to_string(image, lang='ukr+eng').strip()
            print(f"[OCR] Успішно розпізнано текст з картинки.")
        except Exception as e:
            print(f"[!] Помилка розпізнавання картинки: {e}")

    # Об'єднуємо текст із поста та текст, знайдений на картинці
    full_content = f"{message_text}\n{extracted_from_image}".strip()

    # Перевіряємо на ключові слова або якщо це картинка (картинки у цих каналах зазвичай містять графіки)
    if event.message.photo or any(keyword in full_content.lower() for keyword in KEYWORDS):
        display_text = f"📷 [Фото-графік]\n{extracted_from_image}" if event.message.photo and not message_text else full_content
        
        chat_username = event.chat.username or "channel"
        latest_schedule = {
            "source": chat_username,
            "text": display_text if display_text else "Отримано нове зображення графіку без підпису.",
            "date": str(event.message.date)
        }
        print(f"[!] Оновлено графік (з картинкою або ключовим словом) з каналу: {chat_username}")

async def start_telegram():
    print("Підключення до Telegram...")
    await client.start()
    print("Telegram монітор успішно слухає канали в реальному часі з підтримкою OCR!")
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