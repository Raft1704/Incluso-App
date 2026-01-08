import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Vibration, Alert, Dimensions, SafeAreaView } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [score, setScore] = useState(0);

  // --- LÓGICA SIMÓN DICE ---
  const [simonSeq, setSimonSeq] = useState([]);
  const [userSeq, setUserSeq] = useState([]);
  const [isShowing, setIsShowing] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [isTesting, setIsTesting] = useState(true);
  
  const patterns = [[0, 200], [0, 600], [0, 100, 50, 100]];

  const startSimon = () => {
    setScore(0);
    setUserSeq([]);
    setIsTesting(false);
    setGameActive(true);
    const firstStep = Math.floor(Math.random() * 3);
    const newSeq = [firstStep];
    setSimonSeq(newSeq);
    reproducirSimon(newSeq, 0);
  };

  const reproducirSimon = async (sequence, currentScore) => {
    setIsShowing(true);
    // Dificultad: La velocidad aumenta según el nivel
    const speed = Math.max(300, 900 - (currentScore * 50));
    
    for (const step of sequence) {
      Vibration.vibrate(patterns[step]);
      await new Promise(r => setTimeout(r, speed));
    }
    setIsShowing(false);
    setUserSeq([]);
  };

  const pressSimon = (id) => {
    if (isShowing) return;
    Vibration.vibrate(patterns[id]);

    if (isTesting) return;

    if (gameActive) {
      const nextUserSeq = [...userSeq, id];
      setUserSeq(nextUserSeq);

      if (id !== simonSeq[nextUserSeq.length - 1]) {
        Vibration.vibrate([0, 500]);
        Alert.alert("¡Fin del juego!", `Nivel alcanzado: ${score}`, [
          { text: "Reintentar", onPress: () => startSimon() },
          { text: "Menú", onPress: () => setScreen('menu') }
        ]);
        setGameActive(false);
      } else if (nextUserSeq.length === simonSeq.length) {
        const nextScore = score + 1;
        setScore(nextScore);
        const nextSeq = [...simonSeq, Math.floor(Math.random() * 3)];
        setSimonSeq(nextSeq);
        setTimeout(() => reproducirSimon(nextSeq, nextScore), 1000);
      }
    }
  };

  // --- LÓGICA DESAFÍO MOTRIZ ---
  const [pos, setPos] = useState({ top: height / 2, left: width / 2 - 50 });
  const [timer, setTimer] = useState(100);
  const timerRef = useRef(null);

  const iniciarMotriz = () => {
    setScore(0);
    setScreen('motriz');
    moverFugaz(0);
  };

  const moverFugaz = (currentScore) => {
    // Definimos márgenes para que el botón no se solape con el texto ni se salga
    const marginHeader = 160; 
    const marginFooter = 140;
    const buttonSize = Math.max(65, 110 - (currentScore * 3));

    const nextTop = Math.floor(Math.random() * (height - marginHeader - marginFooter)) + marginHeader;
    const nextLeft = Math.floor(Math.random() * (width - buttonSize - 40)) + 20;
    
    setPos({ top: nextTop, left: nextLeft });
    setTimer(100);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    // El tiempo para tocar se reduce conforme sube el score
    const tickSpeed = Math.max(10, 55 - (currentScore * 2));
    
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          clearInterval(timerRef.current);
          Vibration.vibrate([0, 400]);
          Alert.alert("¡Tiempo agotado!", `Puntos logrados: ${currentScore}`, [{ text: "Volver", onPress: () => setScreen('menu') }]);
          return 0;
        }
        return prev - 1;
      });
    }, tickSpeed);
  };

  const tocarObjetivo = () => {
    Vibration.vibrate(60);
    const nextScore = score + 1;
    setScore(nextScore);
    moverFugaz(nextScore);
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // --- RENDERIZADO ---
  if (screen === 'simon') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Simón Táctil</Text>
        <View style={[styles.statusBadge, { backgroundColor: isTesting ? '#FF9800' : '#4CAF50' }]}>
          <Text style={styles.statusText}>{isTesting ? "MODO PRUEBA: Toca y siente" : `NIVEL: ${score}`}</Text>
        </View>
        
        <View style={styles.grid}>
          {['#FF5252', '#4CAF50', '#2196F3'].map((color, i) => (
            <TouchableOpacity 
              key={i} 
              onPress={() => pressSimon(i)} 
              activeOpacity={0.6}
              style={[styles.btn, { backgroundColor: color, opacity: isShowing ? 0.4 : 1, borderColor: isTesting ? '#fff' : 'transparent', borderWidth: isTesting ? 4 : 0 }]} 
            />
          ))}
        </View>

        {!gameActive && (
          <TouchableOpacity onPress={startSimon} style={styles.startBtn}>
            <Text style={styles.menuText}>EMPEZAR JUEGO</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => {setGameActive(false); setScreen('menu');}}>
          <Text style={styles.back}>VOLVER AL MENÚ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'motriz') {
    return (
      <View style={styles.gameCanvas}>
        <SafeAreaView style={styles.headerMotriz}>
          <Text style={styles.scoreTop}>PUNTOS: {score}</Text>
          <View style={styles.timerContainer}>
            <View style={[styles.timerBar, { width: `${timer}%`, backgroundColor: timer < 30 ? '#FF5252' : '#4CAF50' }]} />
          </View>
        </SafeAreaView>

        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={tocarObjetivo} 
          style={[
            styles.target, 
            { 
              top: pos.top, 
              left: pos.left,
              width: Math.max(65, 110 - (score * 3)),
              height: Math.max(65, 110 - (score * 3))
            }
          ]}
        >
          <Text style={styles.targetText}>TOCAR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exitBtn} onPress={() => {clearInterval(timerRef.current); setScreen('menu');}}>
          <Text style={styles.exitText}>FINALIZAR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Incluso-App</Text>
      <Text style={styles.subtitle}>Desafíos de Sensibilización</Text>
      
      <TouchableOpacity style={styles.menuBtn} onPress={() => {setScore(0); setScreen('simon'); setIsTesting(true);}}>
        <Text style={styles.menuText}>🔈 DESAFÍO AUDITIVO</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.menuBtn, {marginTop: 20, backgroundColor: '#E94E77'}]} onPress={iniciarMotriz}>
        <Text style={styles.menuText}>✋ DESAFÍO MOTRIZ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', padding: 20 },
  gameCanvas: { flex: 1, backgroundColor: '#121212' },
  headerMotriz: { marginTop: 50, alignItems: 'center', paddingHorizontal: 20 },
  scoreTop: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  timerContainer: { height: 12, width: '80%', backgroundColor: '#333', borderRadius: 6, marginTop: 15, overflow: 'hidden' },
  timerBar: { height: '100%' },
  title: { fontSize: 32, color: '#fff', fontWeight: 'bold', marginBottom: 5 },
  subtitle: { color: '#666', marginBottom: 40 },
  statusBadge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 30 },
  statusText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  grid: { flexDirection: 'row', gap: 15, marginBottom: 40 },
  btn: { width: 95, height: 95, borderRadius: 25 },
  target: { position: 'absolute', backgroundColor: '#FF0055', borderRadius: 60, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  targetText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  menuBtn: { backgroundColor: '#333', padding: 25, borderRadius: 15, width: '100%' },
  menuText: { color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 18 },
  startBtn: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, width: 220 },
  back: { color: '#666', marginTop: 40, textDecorationLine: 'underline' },
  exitBtn: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 20 },
  exitText: { color: '#FF5252', fontWeight: 'bold', fontSize: 16 }
});