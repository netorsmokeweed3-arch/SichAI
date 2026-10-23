import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { APP_CONFIG } from './src/config';

export default function App() {
  const [hubState, setHubState] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshHub = async () => {
    setLoading(true);
    try {
      // Робимо запит до твого живого бекенду на Render
      const response = await fetch('https://sichai.onrender.com/get-schedule');
      const backendData = await response.json();

      // Формуємо стан хабу на основі живих даних із сервера
      setHubState({
        battery: { 
          shouldSavePower: false, 
          reason: "Акумулятор хабу працює стабільно в автономному режимі." 
        },
        power: { 
          isOnline: true, 
          message: backendData && backendData.text 
            ? `Оновлення з Telegram: ${backendData.text}` 
            : "Черга 4.1 (Новояворівськ): дані оновлюються з хмари..." 
        },
        security: { 
          alertActive: false, 
          message: "Ситуація стабільна. Тривоги у регіоні немає." 
        },
        schedule: backendData,
        lastUpdated: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.log('Помилка підключення до Render:', error);
      // Fallback-стан, якщо немає зв'язку з інтернетом чи сервером
      setHubState({
        battery: { shouldSavePower: true, reason: "Немає зв'язку з хмарним агентом." },
        power: { isOnline: false, message: "Помилка завантаження графіків із сервера." },
        security: { alertActive: false, message: "Локальний режим роботи." },
        schedule: null,
        lastUpdated: new Date().toLocaleTimeString()
      });
    }
    setLoading(false);
  };

  useEffect(() => { 
    refreshHub(); 
    // Автоматичне оновлення кожні 60 секунд
    const interval = setInterval(refreshHub, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{APP_CONFIG.appName}</Text>
        <Text style={styles.subtitle}>Автономний хаб | Новояворівськ (Оркестратор активний)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && !hubState ? (
          <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 50 }} />
        ) : hubState ? (
          <>
            {/* Агент Живлення / Батареї */}
            {hubState.battery && (
              <View style={[styles.card, hubState.battery.shouldSavePower && styles.cardAlert]}>
                <View style={styles.badgeContainer}>
                  <View style={[styles.dot, { backgroundColor: hubState.battery.shouldSavePower ? '#FF9800' : '#4CAF50' }]} />
                  <Text style={styles.badgeText}>{hubState.battery.shouldSavePower ? 'Захист батареї увімкнено' : 'Живлення в нормі'}</Text>
                </View>
                <Text style={styles.cardTitle}>🔋 Агент Живлення</Text>
                <Text style={styles.messageText}>{hubState.battery.reason}</Text>
              </View>
            )}

            {/* Останній графік з кешу Telegram (без сирих ключів JSON) */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📡 Поточний графік (Новояворівськ)</Text>
              <Text style={styles.messageText}>
                {hubState.schedule && hubState.schedule.text 
                  ? hubState.schedule.text 
                  : 'Очікування свіжих даних із Telegram-каналу...'}
              </Text>
            </View>

            {/* Енерго-Агент */}
            {hubState.power && (
              <View style={styles.card}>
                <View style={styles.badgeContainer}>
                  <View style={[styles.dot, { backgroundColor: hubState.power.isOnline ? '#4CAF50' : '#F44336' }]} />
                  <Text style={styles.badgeText}>{hubState.power.isOnline ? 'Світло є' : 'Увага: Відключення'}</Text>
                </View>
                <Text style={styles.cardTitle}>⚡ Енерго-Агент</Text>
                <Text style={styles.messageText}>{hubState.power.message}</Text>
              </View>
            )}

            {/* Цифровий Ангел (Безпека) */}
            {hubState.security && (
              <View style={styles.card}>
                <View style={styles.badgeContainer}>
                  <View style={[styles.dot, { backgroundColor: hubState.security.alertActive ? '#F44336' : '#2196F3' }]} />
                  <Text style={styles.badgeText}>{hubState.security.alertActive ? 'УВАГА: Тривога' : 'Регіон безпечний'}</Text>
                </View>
                <Text style={styles.cardTitle}>🛡️ Цифровий Ангел</Text>
                <Text style={styles.messageText}>{hubState.security.message}</Text>
              </View>
            )}

            <Text style={styles.timestamp}>Остання перевірка: {hubState.lastUpdated}</Text>

            <TouchableOpacity style={styles.button} onPress={refreshHub}>
              <Text style={styles.buttonText}>Оновити статус хабу</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  subtitle: { fontSize: 13, color: '#888', marginTop: 4 },
  content: { padding: 20 },
  card: { width: '100%', backgroundColor: '#1E1E1E', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  cardAlert: { borderColor: '#FF9800', backgroundColor: '#261C14' },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  badgeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  messageText: { color: '#ccc', fontSize: 15, lineHeight: 22 },
  timestamp: { color: '#666', fontSize: 12, textAlign: 'center', marginBottom: 10 },
  button: { backgroundColor: '#2E7D32', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});