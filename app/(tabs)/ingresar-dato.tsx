import 'react-native-get-random-values';
import React, { useState } from 'react';
import { View, TextInput, Button as RNButton, Text, StyleSheet } from 'react-native';
import CryptoJS from 'crypto-js';

const IngresarDato = () => {
  const [dato, setDato] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [datoEncriptado, setDatoEncriptado] = useState('');
  const [datoDesencriptado, setDatoDesencriptado] = useState('');


  const handleSubmit = async () => {
    setLoading(true);
    setMensaje('');
    setDatoEncriptado('');
    setDatoDesencriptado('');
    try {
      // Obtener la clave secreta del entorno
      const secretKey = process.env.EXPO_PUBLIC_AES_SECRET_KEY || '';
      if (!secretKey) {
        setMensaje('No se encontró la clave secreta de cifrado.');
        setLoading(false);
        return;
      }
      // Encriptar el dato
      const encrypted = CryptoJS.AES.encrypt(dato, secretKey).toString();
      setDatoEncriptado(encrypted);
      // Desencriptar inmediatamente para mostrar (simulación de flujo receptor)
      const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      setDatoDesencriptado(decrypted);
      // Aquí deberías agregar la lógica para subir el dato encriptado (por ejemplo, a Supabase)
      // await subirDato(encrypted);
      setMensaje('Dato encriptado y listo para subir');
      setDato('');
    } catch (error) {
      setMensaje('Error al encriptar/desencriptar el dato: ' + (error?.message || error));
      console.log('Error encriptando/desencriptando:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingresar Dato</Text>
      <TextInput
        value={dato}
        onChangeText={setDato}
        placeholder="Escribe un dato"
        style={styles.input}
      />
      <RNButton title={loading ? 'Encriptando...' : 'Encriptar y Subir'} onPress={handleSubmit} disabled={loading} />
      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
      {datoEncriptado ? (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: 'bold' }}>Dato encriptado:</Text>
          <Text selectable style={{ fontSize: 12 }}>{datoEncriptado}</Text>
        </View>
      ) : null}
      {datoDesencriptado ? (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: 'bold' }}>Dato desencriptado:</Text>
          <Text selectable style={{ fontSize: 16 }}>{datoDesencriptado}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    maxWidth: 400,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
  },
  mensaje: {
    marginTop: 16,
    color: 'green',
  },
});

export default IngresarDato;
