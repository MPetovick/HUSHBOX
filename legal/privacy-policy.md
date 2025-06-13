# Política de Privacidad de HushBox

**Última actualización:** 14 de junio de 2025

## 1. Introducción

HushBox ("nosotros", "nuestro", o "la Aplicación") es una aplicación de mensajería segura basada en navegador web. Esta Política de Privacidad explica cómo manejamos su información cuando utiliza nuestro servicio.

## 2. No Recolección de Datos

**HushBox no recopila, almacena ni transmite ningún dato personal o de usuario.** La aplicación funciona completamente en su dispositivo (cliente) sin involucrar servidores externos.

- **Mensajes y Contenido:** Todo el procesamiento de mensajes ocurre localmente en su dispositivo
- **Credenciales:** Las contraseñas y claves de cifrado nunca abandonan su dispositivo
- **Metadatos:** No generamos ni almacenamos metadatos de comunicación

## 3. Almacenamiento Local

La aplicación puede almacenar localmente en su dispositivo:
- Historial de mensajes (opcional, bajo su control)
- Preferencias de configuración
- Certificado de seguridad local

Estos datos:
- Nunca se transmiten externamente
- Pueden borrarse en cualquier momento mediante la función "Limpiar historial"
- Se almacenan cifrados cuando es técnicamente posible

## 4. Uso de la Cámara

La función de escaneo de QR:
- Requiere acceso a su cámara
- Procesa imágenes exclusivamente en su dispositivo
- **No almacena, transmite ni procesa externamente imágenes de la cámara**

## 5. Bibliotecas de Terceros

Utilizamos estas bibliotecas de código abierto:
- **pako:** Compresión de datos ([Política](https://github.com/nodeca/pako))
- **qrcode.js:** Generación de QR ([Política](https://github.com/soldair/node-qrcode))
- **jsQR:** Escaneo de QR ([Política](https://github.com/cozmo/jsQR))
- **jsPDF:** Generación de PDF ([Política](https://github.com/parallax/jsPDF))
- **zxcvbn:** Medición de fortaleza de contraseñas ([Política](https://github.com/dropbox/zxcvbn))

## 6. Enlaces Externos

La aplicación contiene enlaces a:
- Nuestro canal de Telegram
- Nuestra cuenta de Twitter
- Documentación técnica
- Contacto de soporte

Estos sitios externos no son operados por nosotros. Le recomendamos revisar sus políticas de privacidad.

## 7. Seguridad de Datos

Implementamos:
- Cifrado AES-256-GCM con HMAC-SHA256
- Derivación de claves PBKDF2 con alto número de iteraciones
- Borrado seguro de datos sensibles
- Certificado de seguridad HBX-SEC-2025-08

## 8. Cambios a esta Política

Actualizaremos esta política cuando sea necesario. La versión vigente siempre estará disponible en:
`https://hushbox.com/privacy`

## 9. Contacto

Para preguntas sobre privacidad:  
Email: privacy@hushbox.com  
Clave PGP: `0x1A2B3C4D5E6F7890`
