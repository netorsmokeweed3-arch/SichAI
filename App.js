import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { Audio } from 'expo-av';
import { APP_CONFIG } from './src/config';

export default function App() {
  const [hubState, setHubState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('home');

  // Тумблери для Агента Живлення
  const [ecoMode, setEcoMode] = useState(false);
  const [autoSaver, setAutoSaver] = useState(true);

  // Функція для відтворення звукового попередження
  const playAlertSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/alert.mp3'), // Можна додати свій аудіофайл або використовувати системний дзвінок
        { shouldPlay: true }
      );
      await sound.playAsync();
    } catch (e) {
      console.log("Аудіо-сигнал не відтворено (файл відсутній або симулятор):", e);
    }
  };

  const refreshHub = async () => {
    try {
      const response = await fetch('https://sichai.onrender.com/get-schedule');
      const backendData = await response.json();

      // Якщо бекенд передає активну тривогу для регіону
      if (backendData?.security?.alertActive) {
        playAlertSound();
      }

      setHubState({
        battery: { 
          shouldSavePower: ecoMode, 
          reason: ecoMode ? "Увімкнено режим максимального збереження енергії хабу." : "Акумулятор хабу працює стабільно в автономному режимі." 
        },
        power: { 
          isOnline: true, 
          message: backendData?.schedule?.text ? `Оновлення з Telegram: ${backendData.schedule.text}` : "Черга 4.1 (Новояворівськ): дані оновлюються..." 
        },
        security: backendData?.security || { 
          alertActive: false, 
          message: "Ситуація стабільна. Тривоги у регіоні немає.",
          nationwideSummary: "Всі регіони під контролем ППО."
        },
        schedule: backendData?.schedule,
        lastUpdated: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.log('Помилка підключення до Render:', error);
      setHubState({
        battery: { shouldSavePower: true, reason: "Немає зв'язку з хмарним агентом." },
        power: { isOnline: false, message: "Помилка завантаження графіків із сервера." },
        security: { alertActive: false, message: "Локальний режим роботи.", nationwideSummary: "Мережа недоступна." },
        schedule: null,
        lastUpdated: new Date().toLocaleTimeString()
      });
    }
    setLoading(false);
  };

  useEffect(() => { 
    refreshHub(); 
    const interval = setInterval(refreshHub, 30000); // Оновлення кожні 30 сек
    return () => clearInterval(interval);
  }, [ecoMode]);

  // ЕКРАН: АГЕНТ ЖИВЛЕННЯ
  if (currentScreen === 'battery') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')}>
            <Text style={styles.backButton}>← Назад до Хабу</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🔋 Агент Живлення</Text>
          <Text style={styles.subtitle}>Керування автономністю хабу</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Режими роботи акумулятора</Text>
            <Text style={styles.messageText}>Налаштуйте параметри енергоспоживання для тривалої роботи хабу.</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingText}>Режим збереження енергії (Eco)</Text>
              <Switch value={ecoMode} onValueChange={(val) => { setEcoMode(val); refreshHub(); }} trackColor={{ false: '#333', true: '#4CAF50' }}/>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingText}>Автоматичний захист батареї</Text>
              <Switch value={autoSaver} onValueChange={setAutoSaver} trackColor={{ false: '#333', true: '#4CAF50' }}/>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ЕКРАН: ПОТОЧНИЙ ГРАФІК
  if (currentScreen === 'schedule' || currentScreen === 'power') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')}>
            <Text style={styles.backButton}>← Назад до Хабу</Text>
          </TouchableOpacity>
          <Text style={styles.title}>⚡ Енерго-Агент & Графік</Text>
          <Text style={styles.subtitle}>Новояворівськ (Черга 4.1)</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📡 Останні дані з Telegram</Text>
            <Text style={styles.messageText}>
              {hubState?.schedule?.text || 'Немає свіжих даних із каналів.'}
            </Text>
            <Text style={[styles.timestamp, {marginTop: 15}]}>Джерело: @{hubState?.schedule?.source || 'системний кеш'}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ЕКРАН: ЦИФРОВИЙ АНГЕЛ (БЕЗПЕКА ТА УДАРИ ПО УКРАЇНІ)
  if (currentScreen === 'security') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')}>
            <Text style={styles.backButton}>← Назад до Хабу</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🛡️ Цифровий Ангел</Text>
          <Text style={styles.subtitle}>Моніторинг загроз по Україні та регіону</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.card, hubState?.security?.alertActive && styles.cardAlertRed]}>
            <Text style={styles.cardTitle}>🚨 Статус для Львівщини / Новояворівська</Text>
            <Text style={styles.messageText}>{hubState?.security?.message || 'Ситуація стабільна.'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>🗺️ Загальноукраїнське зведення</Text>
            <Text style={styles.messageText}>{hubState?.security?.nationwideSummary || 'Інформація оновлюється з моніторингових каналів...'}</Text>
            <Text style={[styles.timestamp, {marginTop: 15}]}>Останнє оновлення: {hubState?.security?.timestamp || 'щойно'}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ГОЛОВНИЙ ЕКРАН ХАБУ
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
            {/* Агент Живлення */}
            <TouchableOpacity onPress={() => setCurrentScreen('battery')}>
              <View style={[styles.card, hubState.battery.shouldSavePower && styles.cardAlert]}>
                <View style={styles.badgeContainer}>
                  <View style={[styles.dot, { backgroundColor: hubState.battery.shouldSavePower ? '#FF9800' : '#4CAF50' }]} />
                  <Text style={styles.badgeText}>{hubState.battery.shouldSavePower ? 'Захист батареї увімкнено' : 'Живлення в нормі'}</Text>
                </View>
                <Text style={styles.cardTitle}>🔋 Агент Живлення ➔</Text>
                <Text style={styles.messageText}>{hubState.battery.reason}</Text>
              </View>
            </TouchableOpacity>

            {/* Поточний графік */}
            <TouchableOpacity onPress={() => setCurrentScreen('schedule')}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📡 Поточний графік (Новояворівськ) ➔</Text>
                <Text style={styles.messageText}>
                  {hubState.schedule?.text || 'Очікування свіжих даних із Telegram-каналу...'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Енерго-Агент */}
            <TouchableOpacity onPress={() => setCurrentScreen('power')}>
              <View style={styles.card}>
                <View style={styles.badgeContainer}>
                  <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.badgeText}>Слідкування за мережею активне</Text>
                </View>
                <Text style={styles.cardTitle}>⚡ Енерго-Агент ➔</Text>
                <Text style={styles.messageText}>{hubState.power.message}</Text>
              </View>
            </TouchableOpacity>

            {/* Цифровий Ангел */}
            <TouchableOpacity onPress={() => setCurrentScreen('security')}>
              <View style={[styles.card, hubState.security.alertActive && styles.cardAlertRed]}>
                <View style={styles.badgeContainer}>
                  <View style={[styles.dot, { backgroundColor: hubState.security.alertActive ? '#F44336' : '#2196F3' }]} />
                  <Text style={styles.badgeText}>{hubState.security.alertActive ? 'УВАГА: Загроза у регіоні!' : 'Регіон безпечний'}</Text>
                </View>
                <Text style={styles.cardTitle}>🛡️ Цифровий Ангел ➔</Text>
                <Text style={styles.messageText}>{hubState.security.message}</Text>
              </View>
            </TouchableOpacity>

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
  backButton: { color: '#4CAF50', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  content: { padding: 20 },
  card: { width: '100%', backgroundColor: '#1E1E1E', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  cardAlert: { borderColor: '#FF9800', backgroundColor: '#261C14' },
  cardAlertRed: { borderColor: '#F44336', backgroundColor: '#3A1515' },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  badgeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  messageText: { color: '#ccc', fontSize: 15, lineHeight: 22 },
  timestamp: { color: '#666', fontSize: 12, textAlign: 'center', marginBottom: 10 },
  button: { backgroundColor: '#2E7D32', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, borderTopWidth: 1, borderTopColor: '#2a2a2a', paddingTop: 15 },
  settingText: { color: '#fff', fontSize: 15, flex: 1, marginRight: 10 }
});