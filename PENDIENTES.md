# CloudSet - Hoja de ruta

---

## 🗄️ BACKEND & BASE DE DATOS

### ✅ Hecho
- Supabase configurado con tablas: usuarios, prendas, outfits, viajes
- Login y registro de usuarios
- Cada usuario ve solo sus datos
- Storage buckets: prendas y perfiles
- Políticas de acceso configuradas
- Columnas: estilos, foto_cara, foto_cuerpo, momento en outfits
- RLS activado en tabla viajes

### 🔧 Pendiente
- Añadir RLS a todas las tablas antes de lanzamiento público
- Activar cuenta de pago en Google AI para producción (límite actual: 1€/mes)

---

## 🤖 INTELIGENCIA ARTIFICIAL

### ✅ Hecho
- IA con Gemini 2.5 Flash reconoce tipo y color automáticamente al subir foto

### 🔧 Pendiente
- Escanear etiqueta de prenda para identificar artículo original
- Escanear prenda física y mostrar imagen oficial de tienda (Zara, H&M...)
- Probador virtual: superponer prenda sobre foto de perfil
- Integración con app de clima para sugerir outfits según destino y fechas
- Recomendaciones de prendas nuevas basadas en el armario

---

## 👗 ARMARIO

### ✅ Hecho
- Añadir prendas con foto
- Clasificación automática con IA (tipo y color)
- Tipo y color visibles debajo de cada foto
- Editar prendas (tipo y color)
- Eliminar prendas
- Filtros por tipo y color
- Categorías ampliadas con grupos (Armario / Zapatos & Accesorios)
- Prendas sin color muestran "—"
- el color y el tipo de prenda no es necesario que aparezca debajo de la prenda, porque estarán clasificados por eso.
- Ampliar categorías: más tipos de accesorios
- Las prendas aparezcan ordenadas por categorías, pero haya un desplegable que permita, o bien ordenarlas por categorías, o bien ordenarlas por estilo (Casual, Arreglado, Deportivo, Noche, Día, etc. Lo que hemos llamado "Momento" en Outfits")
- las prendas tienen que poder tener un "momento" al subirlas
- al editar una prenda, poder editar el momento

### 🔧 Pendiente
- Editar prendas del armario desde el modal de edición de outfit
- en los filtros, poder filtrar también por color (es decir, dentro de "Por color", un submenú que permita escribir o seleccionar un único o varios colores).
- si ordenamos por "momento", tener un submenú que permita elegir un momento o varios
- ordenar las prendas en el orden que habíamos previsto, mostrando tipo "PRENDAS" -> subgrupos con posibilidad de desplegable
- tener un submenú dentro de "ordenar por categoría" que permita ver solo una categoría

---

## 👔 OUTFITS

### ✅ Hecho
- Crear outfits seleccionando prendas del armario
- Asignar evento y momento (día, noche, cena, playa...)
- Ver miniaturas de prendas en cada outfit
- Editar nombre, evento y momento de un outfit
- Eliminar outfits

### 🔧 Pendiente
- Editar prendas dentro de un outfit ya creado (añadir, quitar, cambiar)
- al crear nuevo Outfit, en "Evento o viaje (opcional)", poder elegir un Viaje de la pestaña Viajes.
- Ordenar los outftis por su categoría (Día, Noche, etc)


---

## ✈️ VIAJES

### ✅ Hecho
- Crear viajes con nombre, destino y fechas validadas
- Asignar outfits a un viaje con miniaturas
- Vista de maleta: miniaturas de todas las prendas únicas del viaje
- Editar nombre, destino y fechas de un viaje
- Eliminar viajes
- Outfits se refrescan automáticamente al entrar en viajes

### 🔧 Pendiente
- Editar outfits asignados a un viaje (añadir, quitar, cambiar)
- Organizar outfits dentro del viaje por tipo de plan

---

## 👤 PERFIL & CUENTA

### ✅ Hecho
- Nombre de usuario guardado
- Fotos de perfil: cara y cuerpo entero
- Estilos favoritos guardados por usuario
- Cambiar contraseña
- Cerrar sesión
- Foto de perfil visible en el header/avatar
- Borrar la pestaña "Perfil" y "Cuenta".
- Añadir nombre en el header
- Al clicar en el avatar del header, que te lleve a la pestaña "Cuenta" que tiene los datos de nombre, cambiar contraseña, cerrar sesión, y estilos con los que te identificas
- Mejorar la cabecera
- Elegir la página inicial

### 🔧 Pendiente


---

## 💰 MONETIZACIÓN & SOCIAL

### 🚀 Por desarrollar
- Compartir prendas entre amigas
- Recomendaciones de prendas enlazadas a tiendas con código de afiliado
- Suscripción premium para funciones avanzadas
- Conexión con cuentas de tiendas (Inditex...) para importar compras automáticamente
- Notificación "has comprado esto, ¿añadirlo a tu armario?"
- Acuerdos directos con marcas para integración oficial

---

## 💡 IDEAS FUTURAS

- Lookbook compartido / comunidad
- Estadísticas del armario (prendas más usadas, colores dominantes...)
- Alertas de rebajas en prendas similares a las tuyas
- Versión nativa iOS/Android con Capacitor

---

## 🛠️ TÉCNICO

### ✅ Hecho
- App publicada en Vercel con despliegue automático desde GitHub
- Límite de gasto Gemini configurado a 1€/mes

### 🔧 Pendiente
- Mover carpeta del proyecto fuera de OneDrive (Windows trabajo)
- Añadir RLS a todas las tablas restantes antes de lanzamiento público