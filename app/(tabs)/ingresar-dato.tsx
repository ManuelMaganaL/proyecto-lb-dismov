import 'react-native-get-random-values';
import { useState } from 'react';
import { View, TextInput, Button as RNButton, Text, StyleSheet } from 'react-native';
import * as CryptoJS from 'crypto-js';
import { saveEncryptedDato } from '@/backend/user-functions';

const IngresarDato = () => {
  const [titulo, setTitulo] = useState('');
  const [dato, setDato] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mensajeTipo, setMensajeTipo] = useState<'success' | 'error'>('success');


  const handleSubmit = async () => {
    setLoading(true);
    setMensaje('');
    try {
      if (!dato.trim()) {
        setMensajeTipo('error');
        setMensaje('Ingresa un dato antes de continuar.');
        return;
      }

      // Obtener la clave secreta del entorno
      const secretKey = process.env.EXPO_PUBLIC_AES_SECRET_KEY || '';
      if (!secretKey) {
        setMensajeTipo('error');
        setMensaje('No se encontró la clave secreta de cifrado.');
        return;
      }

      // Encriptar el dato
      const encrypted = CryptoJS.AES.encrypt(dato, secretKey).toString();

      const normalizedTitulo = titulo.trim() || 'Clave compartida';
      const { success, error } = await saveEncryptedDato(encrypted, normalizedTitulo);
      if (!success) {
        setMensajeTipo('error');
        setMensaje(`Cifrado correcto, pero no se pudo guardar: ${error}`);
        return;
      }

      setMensajeTipo('success');
      setMensaje('Dato encriptado y guardado en Supabase.');
      setTitulo('');
      setDato('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado';
      setMensajeTipo('error');
      setMensaje('Error al encriptar/desencriptar el dato: ' + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Nuevo dato cifrado</Text>
        <Text style={styles.subtitle}>Se cifra localmente y luego se guarda en Supabase.</Text>

        <TextInput
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Titulo (opcional)"
          style={styles.input}
        />
        <TextInput
          value={dato}
          onChangeText={setDato}
          placeholder="Escribe un dato"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <RNButton title={loading ? 'Encriptando...' : 'Encriptar y Subir'} onPress={handleSubmit} disabled={loading} />
        {mensaje ? <Text style={[styles.mensaje, mensajeTipo === 'success' ? styles.ok : styles.fail]}>{mensaje}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 14,
    color: '#334155',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    marginBottom: 12,
  },
  mensaje: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  ok: {
    color: '#065f46',
    backgroundColor: '#d1fae5',
  },
  fail: {
    color: '#991b1b',
    backgroundColor: '#fee2e2',
  },
});

export default IngresarDato;
