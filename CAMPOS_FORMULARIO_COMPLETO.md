# 📋 CAMPOS COMPLETOS PARA FORMULARIO DE AVALÚOS

## 🏘️ CAMPOS COMUNES (RURAL Y URBANO)

```javascript
// Información Básica
const [matricula, setMatricula] = useState('');              // Folio de matrícula inmobiliaria
const [fechaVisita, setFechaVisita] = useState(new Date());  // Fecha en que se realiza la visita
const [departamento, setDepartamento] = useState('');        // Departamento donde se ubica el predio
const [municipio, setMunicipio] = useState('');              // Municipio o ciudad del predio
const [direccion, setDireccion] = useState('');              // Dirección física del predio
const [coordenadasLat, setCoordenadasLat] = useState('');    // Latitud WGS84
const [coordenadasLon, setCoordenadasLon] = useState('');    // Longitud WGS84
const [usoPredioActual, setUsoPredioActual] = useState('');  // Uso observado del predio

// Infraestructura y Servicios
const [infraestructuraServicios, setInfraestructuraServicios] = useState(''); // Servicios públicos disponibles
const [viasAcceso, setViasAcceso] = useState('');            // vías de acceso
const [viasAccesoEstado, setViasAccesoEstado] = useState(''); // Estado de las vías de acceso
const [transporte, setTransporte] = useState('');            // Medios de transporte disponibles
const [perspectivasValorizacion, setPerspectivasValorizacion] = useState(''); // Perspectiva de valorización del sector

// Observaciones
const [observacionesEspeciales, setObservacionesEspeciales] = useState(''); // Notas del perito sobre el entorno o predio
```

---

## 🌾 CAMPOS ESPECÍFICOS RURALES

```javascript
// Identificación
const [actividadPredio, setActividadPredio] = useState(''); // Agrícola, Agroforestal, Industrial etc

// Ubicación
const [vereda, setVereda] = useState('');                    // Vereda o sector del predio

// Infraestructura Rural
const [estadoConservacionConstruccion, setEstadoConservacionConstruccion] = useState(''); // Estado de conservación
const [construcciones, setConstrucciones] = useState('');    // Nombre de construcciones y calidad superficiaria
const [descripcionAccesoPredio, setDescripcionAccesoPredio] = useState(''); // Descripcion de acceso para llegar al predio
const [cuerposAgua, setCuerposAgua] = useState('');          // Cuerpos de agua presentes en el predio

// Ocupación y Urbanismo
const [ocupacionPredio, setOcupacionPredio] = useState('');  // Ocupado, libre, etc.
const [estadoUrbanismo, setEstadoUrbanismo] = useState('');  // Estado del urbanismo en el sector
const [frenteVia, setFrenteVia] = useState('');              // Frente vial observado
const [tipoOcupacion, setTipoOcupacion] = useState('');      // Legal, informal, etc.
const [afectacionesAmbientales, setAfectacionesAmbientales] = useState(''); // Humedales, suelos protegidos, etc.
const [actividadPredominanteSector, setActividadPredominanteSector] = useState(''); // Actividad económica dominante

// Agricultura
const [cultivos, setCultivos] = useState('');                // Especificación si tiene cultivos
const [numeroCultivos, setNumeroCultivos] = useState('');    // Número de cultivos
const [tipoCultivos, setTipoCultivos] = useState('');        // Transitorios, Permanentes
const [servidumbres, setServidumbres] = useState('');        // Tipos de servidumbres evidenciadas
const [areaCultivos, setAreaCultivos] = useState('');        // Área de cultivos
```

---

## 🏙️ CAMPOS ESPECÍFICOS URBANOS

```javascript
// Ubicación Urbana
const [barrio, setBarrio] = useState('');                    // Barrio o sector del predio
const [solucionHabitacional, setSolucionHabitacional] = useState(''); // Vís, Vip, No subsidiado

// Tipología
const [tipoBien, setTipoBien] = useState('');                // Casa, apartamento, etc.
const [estrato, setEstrato] = useState('');                  // Estrato socioeconómico del sector

// Medidas Físicas
const [areaTerreno, setAreaTerreno] = useState('');          // Área total del lote (m2)
const [frenteMetros, setFrenteMetros] = useState('');        // Medida del frente
const [fondoMetros, setFondoMetros] = useState('');          // Medida del fondo

// Construcción
const [estadoConservacionConstruccion, setEstadoConservacionConstruccion] = useState(''); // Estado de conservación
const [edadAproximada, setEdadAproximada] = useState('');    // Edad estimada de la edificación
const [porcentajeAvanceObra, setPorcentajeAvanceObra] = useState(''); // Progreso observado de la obra

// Distribución
const [numeroHabitaciones, setNumeroHabitaciones] = useState(''); // Número de habitaciones
const [numeroBanos, setNumeroBanos] = useState('');          // Número de baños
const [numeroPisos, setNumeroPisos] = useState('');          // Número de pisos observados
const [numeroAscensores, setNumeroAscensores] = useState(''); // Número ascensores
const [numeroGarajes, setNumeroGarajes] = useState('');      // Número de garajes
const [numeroSotanos, setNumeroSotanos] = useState('');      // Número de sótanos

// Materiales y Acabados
const [estructura, setEstructura] = useState('');            // Tipo de estructura
const [fachada, setFachada] = useState('');                  // Material de la fachada
const [cubierta, setCubierta] = useState('');                // Material de la cubierta
const [acabadosGenerales, setAcabadosGenerales] = useState(''); // Descripción de acabados
const [dotacionesComunes, setDotacionesComunes] = useState(''); // Número de torres, piscina, ascensor, etc

// Amenidades
const [garaje, setGaraje] = useState('');                    // Descripción garaje, sencillo, cubierto
const [phOnph, setPhOnph] = useState('');                    // PH O NPH
```

---

## 🎯 ESTRUCTURA RECOMENDADA PARA EL FORMULARIO

### **Paso 1: Selector de Tipo de Avalúo**
```javascript
const [tipoAvaluo, setTipoAvaluo] = useState('urbano'); // 'urbano' o 'rural'
```

### **Paso 2: Secciones del Formulario**

#### **A. Información Básica (Siempre visible)**
- Matrícula
- Fecha visita
- Departamento
- Municipio
- Dirección / Barrio / Vereda (según tipo)
- Coordenadas GPS

#### **B. Características del Predio (Según tipo)**

**Si es URBANO:**
- Estrato
- Tipo de bien
- Área terreno
- Frente y fondo
- Número habitaciones, baños, pisos, garajes
- Estructura, fachada, cubierta
- Estado conservación
- Edad aproximada
- % avance obra

**Si es RURAL:**
- Actividad del predio
- Vereda
- Construcciones
- Cultivos (si/no)
- Tipo cultivos
- Número cultivos
- Área cultivos
- Cuerpos de agua
- Afectaciones ambientales

#### **C. Infraestructura (Siempre visible)**
- Servicios públicos
- Vías de acceso
- Estado vías
- Transporte
- Perspectivas valorización

#### **D. Observaciones (Siempre visible)**
- Uso actual
- Ocupación
- Observaciones especiales del perito

---

## 💾 ESTRUCTURA DE DATOS PARA GUARDAR

```javascript
const formularioCompleto = {
  // Metadata
  id: `FORM_${Date.now()}`,
  casoId: asignacionId,
  peritoId: peritoId,
  tipo: tipoAvaluo, // 'urbano' o 'rural'
  fechaCreacion: new Date().toISOString(),
  sincronizado: false,

  // Datos comunes
  datosBasicos: {
    matricula,
    fechaVisita,
    departamento,
    municipio,
    direccion,
    coordenadas: { lat: coordenadasLat, lon: coordenadasLon }
  },

  // Datos específicos (solo se llenan los correspondientes)
  datosUrbanos: tipoAvaluo === 'urbano' ? {
    barrio,
    estrato,
    tipoBien,
    areaTerreno,
    frenteMetros,
    fondoMetros,
    numeroHabitaciones,
    numeroBanos,
    numeroPisos,
    numeroGarajes,
    numeroAscensores,
    numeroSotanos,
    estructura,
    fachada,
    cubierta,
    estadoConservacion,
    edadAproximada,
    porcentajeAvanceObra,
    acabadosGenerales,
    dotacionesComunes,
    garaje,
    phOnph
  } : null,

  datosRurales: tipoAvaluo === 'rural' ? {
    actividadPredio,
    vereda,
    construcciones,
    estadoConservacion,
    descripcionAcceso,
    cuerposAgua,
    cultivos,
    numeroCultivos,
    tipoCultivos,
    areaCultivos,
    servidumbres,
    afectacionesAmbientales,
    actividadPredominanteSector
  } : null,

  // Infraestructura (común)
  infraestructura: {
    serviciosPublicos: infraestructuraServicios,
    viasAcceso,
    viasAccesoEstado,
    transporte,
    perspectivasValorizacion
  },

  // Observaciones
  observaciones: {
    usoPredioActual,
    ocupacionPredio,
    estadoUrbanismo,
    frenteVia,
    tipoOcupacion,
    observacionesEspeciales
  }
};
```

---

## 📱 IMPLEMENTACIÓN EN REACT NATIVE

### **Opción 1: Un solo formulario con campos condicionales**
```javascript
{tipoAvaluo === 'urbano' && (
  <View>
    {/* Campos urbanos */}
  </View>
)}

{tipoAvaluo === 'rural' && (
  <View>
    {/* Campos rurales */}
  </View>
)}
```

### **Opción 2: Dos componentes separados**
```javascript
// FormularioUrbano.js
// FormularioRural.js

{tipoAvaluo === 'urbano' ? <FormularioUrbano /> : <FormularioRural />}
```

---

## ⚡ PRÓXIMOS PASOS

1. ✅ Decidir estructura: ¿Un formulario con condicionales o dos separados?
2. ✅ Implementar validaciones por campo
3. ✅ Agregar ayudas/tooltips para cada campo
4. ✅ Implementar guardado automático (borrador)
5. ✅ Agregar cámara para fotos de evidencia
6. ✅ Implementar firma digital del perito

---

## 📊 TABLA DE VALIDACIONES SUGERIDAS

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| matricula | TEXT | ✅ | Alfanumérico |
| fechaVisita | DATE | ✅ | No futuro |
| departamento | SELECT | ✅ | Lista departamentos |
| municipio | SELECT | ✅ | Lista municipios |
| coordenadasLat | NUMBER | ✅ | -90 a 90 |
| coordenadasLon | NUMBER | ✅ | -180 a 180 |
| areaTerreno | NUMBER | ❌ | > 0 |
| numeroHabitaciones | INT | ❌ | 0-99 |
| estrato | INT | ✅ (urbano) | 1-6 |

---

**Total campos**: ~60 campos entre rural y urbano
**Tiempo estimado implementación**: 3-4 horas
**Prioridad para MVP**: MEDIA (el formulario básico ya funciona)

¿Quieres que implemente esto ahora o prefieres probarlo primero con el formulario básico actual?
