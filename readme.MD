## Steps to follow

Estos serán los pasos que voy a estar siguiendo en el app

#### Logs

1. [x] Crear los logs en local con winston con rotación diaria
2. [x] Archivo de configuración para los logs
3. [x] Enviar los logs a DataDog

#### Configuración de emails

1. Crear un servicio en mi carpeta de modules que envíe emails

- [x] Comprar un dominio: admin@hopta.hn

#### Tokens

- Refresh token ✅

#### Crear esquemas

1. Esquemas tanto de mongodb como de zod

`Esquemas completados`

- [x] Esquema de usuario
- zod: ✅
- mongodb: ✅

- [x] Esquema de la propiedad
- zod: ✅
- mongodb: ✅

#### Seguridad del backend

1. [x] Agregar Rate limit
2. [x] Configurar CORS
3. [x] Tasa de Reintentos en JWT: Implementa un sistema para limitar el número de intentos de verificación fallidos por usuario.

#### Tareas "Más dificiles" (Son un desafío para mi)

- [x] Configurar mi correo electronico para enviar emails sin problemas ✅
- [x] Configurar los logs para enviarlos a DataDog ❎

#### Accesibilidad

- [x] Paginación ✅
- [x] Filtros ✅
- [x] Ordenamiento ✅

# Pendientes ⚠️

Cosas pendientes por hacer en hopta para que esté completa, claro que si hombre.

- [x] Crear templates para enviar emails ✅

#### Pagos

- [x] Realizar pagos con stripe ✅
- [] Realizar pagos con paypal
- [] Realizar pagos con tarjeta de crédito ✅

#### Verificaciones

- Verificar tarjeta de identidad ❎
- Verificar las imágenes que sean de real state con AWS Recognition ✖️
- Aplicar Oauth (LOGUEARSE CON GOOGLE) ✅
- Verificar número de telefóno con código OTP ✅
- Enviar emails de bienvenida a los usuarios con SendGrid ✅

### Búsqueda

- Buscar propiedades con algolia ✅
- Buscar usuarios ✖️

## Pendientes (Frontend)

- Aprender sobre SEO en NextJS

## Pendientes (Backend)

- Hacer un sistema de referidos ❎
- Hacer un sistema de reportes de alquileres ✅
- Enviar emails felicitando a los usuarios que cumplen años ✅
- Sistema de olvidar contraseña ❎
- Subir archivos a S3 ✅

<!-- Guardar el token en las cookies, no entregarle nada al cliente -->

Features adicionales para las propiedades

###### Interior:

- [x] allowPets: Permitir mascotas

###### Costos adicionales:

- [x] utilities_included: ["agua", "luz", "internet"]

###### Seguridad:

- [x] gated_community: boolean (residenciales)

###### Disponibilidad de visitas:

- Lunes a viernes, 10am - 5pm
