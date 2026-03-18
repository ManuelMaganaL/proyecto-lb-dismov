import 'react-native-get-random-values';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as CryptoJS from 'crypto-js';
import { getUserTargetOptions, saveEncryptedDato, UserTargetOption } from '@/backend/user-functions';

const IngresarDato = () => {
  const [titulo, setTitulo] = useState('');
  const [receptorId, setReceptorId] = useState('');
  const [maxVistas, setMaxVistas] = useState('1');
  const [fechaCaducidad, setFechaCaducidad] = useState('');
  const [dato, setDato] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [targetOptions, setTargetOptions] = useState<UserTargetOption[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [showTargets, setShowTargets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mensajeTipo, setMensajeTipo] = useState<'success' | 'error'>('success');

  useEffect(() => {
    async function loadTargets() {
      setLoadingTargets(true);
      const { data, error } = await getUserTargetOptions();
      if (data) {
        setTargetOptions(data);
      }
      if (error) {
        setMensajeTipo('error');
        setMensaje(`No se pudieron cargar usuarios: ${error}`);
      }
      setLoadingTargets(false);
    }

    loadTargets();
  }, []);

  const selectedTarget = useMemo(
    () => targetOptions.find((item) => item.id === receptorId) ?? null,
    [receptorId, targetOptions]
  );

  const filteredTargets = useMemo(() => {
    const q = targetSearch.trim().toLowerCase();
    if (!q) return targetOptions;
    return targetOptions.filter((item) => {
      const nombre = item.nombre.toLowerCase();
      const correo = (item.correo ?? '').toLowerCase();
      return nombre.includes(q) || correo.includes(q);
    });
  }, [targetOptions, targetSearch]);

  useEffect(() => {
    if (!mensaje) return;
    const timeout = setTimeout(() => {
      setMensaje('');
    }, 3500);

    return () => clearTimeout(timeout);
  }, [mensaje]);


  const handleSubmit = async () => {
    setLoading(true);
    setMensaje('');
    try {
      if (!dato.trim()) {
        setMensajeTipo('error');
        setMensaje('Ingresa una clave antes de continuar.');
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
      const parsedMaxVistas = Number.parseInt(maxVistas, 10);

      if (!Number.isFinite(parsedMaxVistas) || parsedMaxVistas <= 0) {
        setMensajeTipo('error');
        setMensaje('La cantidad de vistas debe ser mayor a 0.');
        return;
      }

      let normalizedCaducidad: string | null = null;
      if (fechaCaducidad.trim()) {
        const candidate = new Date(fechaCaducidad.trim());
        if (Number.isNaN(candidate.getTime())) {
          setMensajeTipo('error');
          setMensaje('Fecha de caducidad inválida. Usa formato YYYY-MM-DD');
          return;
        }
        normalizedCaducidad = candidate.toISOString();
      }

      const { success, error } = await saveEncryptedDato(
        encrypted,
        normalizedTitulo,
        receptorId,
        parsedMaxVistas,
        normalizedCaducidad
      );
      if (!success) {
        setMensajeTipo('error');
        setMensaje(`Cifrado correcto, pero no se pudo guardar: ${error}`);
        return;
      }

      setMensajeTipo('success');
      setMensaje('Clave encriptada y guardada.');
      setTitulo('');
      setReceptorId('');
      setMaxVistas('1');
      setFechaCaducidad('');
      setDato('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado';
      setMensajeTipo('error');
      setMensaje('Error al encriptar/desencriptar la clave: ' + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.containerContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.heroCard}>
        <Text style={styles.title}>Ingresar Claves</Text>
        <Text style={styles.subtitle}>Configura destino, limite y caducidad.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informacion de la Clave</Text>
        <TextInput
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Titulo (opcional)"
          style={styles.input}
        />

        <Text style={styles.sectionTitle}>Destino</Text>
        <Pressable style={styles.selectorButton} onPress={() => setShowTargets((prev) => !prev)}>
          <Text style={styles.selectorButtonText}>
            {selectedTarget
              ? `Destino: ${selectedTarget.nombre}${selectedTarget.correo ? ` (${selectedTarget.correo})` : ''}`
              : 'Seleccionar usuario destino'}
          </Text>
          <Text style={styles.selectorButtonHint}>{showTargets ? 'Ocultar' : 'Ver lista'}</Text>
        </Pressable>

        {showTargets ? (
          <View style={styles.targetsBox}>
            <TextInput
              value={targetSearch}
              onChangeText={setTargetSearch}
              placeholder="Buscar por nombre o correo"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.searchInput}
            />
            {loadingTargets ? <Text style={styles.targetHint}>Cargando usuarios...</Text> : null}
            {!loadingTargets && targetOptions.length === 0 ? (
              <Text style={styles.targetHint}>No hay usuarios visibles para seleccionar.</Text>
            ) : null}
            {!loadingTargets && targetOptions.length > 0 && filteredTargets.length === 0 ? (
              <Text style={styles.targetHint}>Sin resultados para esa busqueda.</Text>
            ) : null}
            {filteredTargets.map((option) => (
              <Pressable
                key={option.id}
                style={styles.targetItem}
                onPress={() => {
                  setReceptorId(option.id);
                  setShowTargets(false);
                  setTargetSearch('');
                }}
              >
                <Text style={styles.targetName}>{option.nombre}</Text>
                {option.correo ? <Text style={styles.targetEmail}>{option.correo}</Text> : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.rowFields}>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>Visualizaciones</Text>
            <TextInput
              value={maxVistas}
              onChangeText={setMaxVistas}
              placeholder="Vistas"
              keyboardType="number-pad"
              style={styles.input}
            />
            <Text style={styles.inlineHint}>Cantidad de Vistas.</Text>
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>Caducidad</Text>
            <TextInput
              value={fechaCaducidad}
              onChangeText={setFechaCaducidad}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <Text style={styles.inlineHint}>Sin fecha, no se caduca.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Compartir Clave</Text>
        <TextInput
          value={dato}
          onChangeText={setDato}
          placeholder="Escribe una clave"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        >
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitText}>Encriptar y Subir</Text>}
        </Pressable>

        <View style={styles.helpPanel}>
          <Text style={styles.helpText}>Si no seleccionas usuario, se guardará para ti mismo.</Text>
          <Text style={styles.helpText}>La fecha acepta formato YYYY-MM-DD.</Text>
        </View>

        {mensaje ? <Text style={[styles.mensaje, mensajeTipo === 'success' ? styles.ok : styles.fail]}>{mensaje}</Text> : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerContent: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 18,
    paddingBottom: 28,
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0b1220',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 2,
    color: '#334155',
    lineHeight: 20,
  },
  sectionTitle: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#0f766e',
  },
  input: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  selectorButton: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  selectorButtonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  selectorButtonHint: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 12,
  },
  targetsBox: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    marginBottom: 10,
    maxHeight: 210,
    paddingVertical: 6,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 10,
    marginBottom: 6,
  },
  targetHint: {
    fontSize: 12,
    color: '#64748b',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  targetItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#bfdbfe',
  },
  targetName: {
    color: '#0f172a',
    fontWeight: '600',
  },
  targetEmail: {
    marginTop: 2,
    color: '#334155',
    fontSize: 12,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#0f766e',
  },
  inlineHint: {
    marginTop: -6,
    marginBottom: 10,
    color: '#475569',
    fontSize: 12,
  },
  submitButton: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: '#0f766e',
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  helpPanel: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#ecfeff',
    borderWidth: 1,
    borderColor: '#a5f3fc',
  },
  helpText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
  },
  mensaje: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontWeight: '600',
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
