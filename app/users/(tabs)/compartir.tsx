import 'react-native-get-random-values';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Eraser } from 'lucide-react-native';
import * as CryptoJS from 'crypto-js';
import { getUserTargetOptions, saveEncryptedDato, UserTargetOption } from '@/backend/crypt-functions';
import { useTheme } from '@/context/theme';
import { ThemeColors } from '@/constants/colors';

const IngresarDato = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const MAX_TITULO_LENGTH = 80;
  const MAX_CLAVE_LENGTH = 280;

  const [titulo, setTitulo] = useState('');
  const [receptorId, setReceptorId] = useState('');
  const [maxVistas, setMaxVistas] = useState('1');
  const [fechaCaducidad, setFechaCaducidad] = useState('');
  const [fechaCaducidadDate, setFechaCaducidadDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  const formatDateYMD = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCounterColor = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio <= 0.8) return '#15803d';
    if (ratio <= 0.9) return '#ca8a04';
    return '#dc2626';
  };

  const parsedMaxVistasLive = Number.parseInt(maxVistas, 10);
  const vistasFueraDeRango =
    maxVistas.trim().length > 0 &&
    (!Number.isFinite(parsedMaxVistasLive) || parsedMaxVistasLive < 1 || parsedMaxVistasLive > 99);

  const handleMaxVistasChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    setMaxVistas(digitsOnly);
  };

  const handleClearForm = () => {
    setTitulo('');
    setReceptorId('');
    setMaxVistas('1');
    setFechaCaducidad('');
    setFechaCaducidadDate(null);
    setShowDatePicker(false);
    setDato('');
    setTargetSearch('');
    setShowTargets(false);
    setMensaje('');
  };

  const handleClearFormPress = () => {
    const hasContent =
      titulo.trim().length > 0 ||
      receptorId.trim().length > 0 ||
      maxVistas.trim() !== '1' ||
      fechaCaducidad.trim().length > 0 ||
      dato.trim().length > 0 ||
      targetSearch.trim().length > 0;

    if (!hasContent) {
      return;
    }

    if (Platform.OS === 'web') {
      const confirmClear = window.confirm('Se eliminarán los datos capturados. ¿Deseas continuar?');
      if (confirmClear) handleClearForm();
    } else {
      Alert.alert(
        'Limpiar formulario',
        'Se eliminarán los datos capturados. ¿Deseas continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Limpiar',
            style: 'destructive',
            onPress: handleClearForm,
          },
        ]
      );
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }

    if (selectedDate) {
      setFechaCaducidadDate(selectedDate);
      setFechaCaducidad(formatDateYMD(selectedDate));
    }

    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
  };

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

      if (dato.trim().length > MAX_CLAVE_LENGTH) {
        setMensajeTipo('error');
        setMensaje(`La clave no puede superar ${MAX_CLAVE_LENGTH} caracteres.`);
        return;
      }

      if (!receptorId.trim()) {
        setMensajeTipo('error');
        setMensaje('Selecciona un usuario destino antes de guardar.');
        return;
      }

      if (!maxVistas.trim()) {
        setMensajeTipo('error');
        setMensaje('Ingresa la cantidad de visualizaciones permitidas.');
        return;
      }

      if (titulo.trim().length > MAX_TITULO_LENGTH) {
        setMensajeTipo('error');
        setMensaje(`El titulo no puede superar ${MAX_TITULO_LENGTH} caracteres.`);
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

      if (parsedMaxVistas > 99) {
        setMensajeTipo('error');
        setMensaje('La cantidad de visualizaciones no puede ser mayor a 99.');
        return;
      }

      let normalizedCaducidad: string | null = null;
      if (fechaCaducidadDate) {
        normalizedCaducidad = fechaCaducidadDate.toISOString();
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
      setFechaCaducidadDate(null);
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
      <Text style={styles.title}>Compartir Claves</Text>
      <Text style={styles.subtitle}>Configura destino, límite y caducidad.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informacion de la Clave</Text>
        <TextInput
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Titulo (opcional)"
          placeholderTextColor="#94a3b8"
          maxLength={MAX_TITULO_LENGTH}
          style={styles.input}
        />
        <Text style={[styles.charCounter, styles.charCounterAfterTitle, { color: getCounterColor(titulo.length, MAX_TITULO_LENGTH) }]}>
          {titulo.length}/{MAX_TITULO_LENGTH}
        </Text>

        <Text style={styles.sectionTitle}>Destino</Text>
        <Pressable
          style={[
            styles.selectorButton,
            selectedTarget && styles.selectorButtonSelected,
          ]}
          onPress={() => setShowTargets((prev) => !prev)}
        >
          <Text style={styles.selectorButtonText}>
            {selectedTarget
              ? `${selectedTarget.nombre}${selectedTarget.correo ? ` (${selectedTarget.correo})` : ''}`
              : 'Seleccionar usuario destino'}
          </Text>
          <Text style={styles.selectorButtonHint}>{showTargets ? 'Ocultar lista' : 'Ver lista'}</Text>
        </Pressable>

        {showTargets ? (
          <View style={styles.targetsBox}>
            <TextInput
              value={targetSearch}
              onChangeText={setTargetSearch}
              placeholder="Buscar por nombre o correo"
              placeholderTextColor="#94a3b8"
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
            <ScrollView style={styles.targetsList} nestedScrollEnabled>
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
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.rowFields}>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>Cantidad de Vistas</Text>
            <TextInput
              value={maxVistas}
              onChangeText={handleMaxVistasChange}
              placeholder="Vistas"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={2}
              style={styles.input}
            />
            <Text style={[styles.inlineHint, vistasFueraDeRango && styles.inlineHintError]}>
              {vistasFueraDeRango ? 'Solo valores entre 1 y 99.' : 'Rango permitido: 1-99.'}
            </Text>
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>Caducidad</Text>
            <Pressable style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
              <Text style={fechaCaducidad ? styles.dateValueText : styles.datePlaceholderText}>
                {fechaCaducidad || 'Seleccionar fecha'}
              </Text>
            </Pressable>
            <Text style={styles.inlineHint}>Opcional: sin fecha no caduca.</Text>
            {showDatePicker ? (
              <DateTimePicker
                value={fechaCaducidadDate ?? new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            ) : null}
            {fechaCaducidad ? (
              <Pressable onPress={() => {
                setFechaCaducidad('');
                setFechaCaducidadDate(null);
              }}>
                <Text style={styles.dateClearText}>Quitar fecha</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Compartir Clave</Text>
        <TextInput
          value={dato}
          onChangeText={setDato}
          placeholder="Escribe una clave"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={MAX_CLAVE_LENGTH}
          style={styles.input}
        />
        <Text style={[styles.charCounter, { color: getCounterColor(dato.length, MAX_CLAVE_LENGTH) }]}>
          {dato.length}/{MAX_CLAVE_LENGTH}
        </Text>

        <View style={styles.submitRow}>
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitButton, styles.submitButtonGrow, loading && styles.submitButtonDisabled]}
          >
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitText}>Encriptar y Subir</Text>}
          </Pressable>
          <Pressable
            onPress={handleClearFormPress}
            disabled={loading}
            accessibilityLabel="Limpiar formulario"
            style={[styles.clearSideButton, loading && styles.submitButtonDisabled]}
          >
            <Eraser size={16} color="#b91c1c" />
          </Pressable>
        </View>


        {mensaje ? <Text style={[styles.mensaje, mensajeTipo === 'success' ? styles.ok : styles.fail]}>{mensaje}</Text> : null}
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerContent: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.foreground,
    backgroundColor: colors.surface,
    padding: 20,
    shadowColor: colors.text,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: colors.accent,
    fontSize: 15,
  },
  sectionTitle: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.primary,
  },
  input: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.foreground,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  selectorButton: {
    borderWidth: 1,
    borderColor: colors.foreground,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  selectorButtonSelected: {
    backgroundColor: colors.success + '30',
    borderColor: colors.success,
  },
  selectorButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  selectorButtonHint: {
    marginTop: 2,
    color: colors.accent,
    fontSize: 12,
  },
  targetsBox: {
    borderWidth: 1,
    borderColor: colors.foreground,
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: 10,
    maxHeight: 210,
    paddingVertical: 6,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.foreground,
    borderRadius: 10,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 10,
    marginBottom: 6,
    color: colors.text,
  },
  targetHint: {
    fontSize: 12,
    color: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  targetItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.foreground,
  },
  targetsList: {
    maxHeight: 104,
  },
  targetName: {
    color: colors.text,
    fontWeight: '600',
  },
  targetEmail: {
    marginTop: 2,
    color: colors.accent,
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
    color: colors.primary,
  },
  inlineHint: {
    marginTop: -6,
    marginBottom: 10,
    color: colors.accent,
    fontSize: 12,
  },
  inlineHintError: {
    color: colors.danger,
    fontWeight: '600',
  },
  charCounter: {
    marginTop: -8,
    marginBottom: 10,
    alignSelf: 'flex-end',
    fontSize: 11,
    fontWeight: '700',
  },
  charCounterAfterTitle: {
    marginBottom: -15,
  },
  dateInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.foreground,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 6,
    backgroundColor: colors.surface,
  },
  dateValueText: {
    color: colors.text,
  },
  datePlaceholderText: {
    color: colors.accent,
  },
  dateClearText: {
    marginBottom: 6,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: colors.primary,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonGrow: {
    flex: 1,
  },
  clearSideButton: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.background,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  helpTextInline: {
    color: colors.accent,
    fontSize: 11,
    marginTop: -4,
    marginBottom: 8,
  },
  mensaje: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontWeight: '600',
  },
  ok: {
    color: colors.success,
    backgroundColor: colors.success + '20',
  },
  fail: {
    color: colors.danger,
    backgroundColor: colors.danger + '20',
  },
});

export default IngresarDato;
