# Desviaciones respecto a las specs del cliente (W-00c)

Regla aplicada: **el texto del cliente se publica tal cual**. Esta tabla recoge todo lo que difiere de las 8 hojas de specs.

Estados:

- **Propuesta (no aplicada):** la web muestra el texto original; el cambio solo se aplica si se aprueba.
- **Aplicada (formato):** no cambia el contenido, solo cómo se presenta. Se revierte si no se aprueba.
- **Texto nuevo (pendiente):** texto que no está en las specs y que la web necesita (navegación, pasos, formulario). Se ve en la web marcado aquí como pendiente de aprobación.

Los cambios aprobados se aplican en `src/i18n/es.json` y se trasladan igual a `en.json` y `ar.json`.

## 1. Propuestas de cambio de texto (no aplicadas)

Ordenadas por prioridad. Las marcadas con ⚠ tienen riesgo legal o de veracidad y conviene decidirlas antes de publicar (W-95).

| # | Sección | Texto original (en la web) | Propuesta | Motivo |
|---|---|---|---|---|
| P-01 ⚠ | Modelos › C › Qué incluye | «**Gestión de Golden Visa:** Coordinación total para la obtención de residencia por inversión.» | «**Orientación sobre vías de residencia:** Coordinación con abogados especializados para analizar las alternativas de residencia en España.» | La Golden Visa (residencia por inversión) dejó de concederse en España el 3 de abril de 2025 (LO 1/2025). Ofrecerla hoy es un servicio que no existe. |
| P-02 ⚠ | FAQ 5 | «…una política de 'cero exposición', garantizando que su identidad y el volumen de sus activos permanezcan en el anonimato absoluto.» | «…una política de 'cero exposición', garantizando la máxima confidencialidad sobre su identidad y el volumen de sus activos.» | Las normas AML/KYC que la propia web promete cumplir (FAQ 3, Servicios) exigen identificar al cliente: «anonimato absoluto» se contradice con eso. |
| P-03 ⚠ | Servicios › Compliance | «…asegurando que el capital entre a España sin alertas legales.» | «…documentando el origen de los fondos para que el capital entre en España con plena trazabilidad.» | «Sin alertas legales» puede leerse como evitar controles. W-30. |
| P-04 ⚠ | Servicios › Ingresos pasivos | «…para generar flujos de caja **constantes** sobre los activos digitales.» | «…para generar flujos de ingresos **recurrentes** sobre los activos digitales.» | «Constantes» sugiere un rendimiento garantizado. W-30, W-95. |
| P-05 ⚠ | Servicios › Custodia | «…para **eliminar** el riesgo de hackeos o pérdida de claves.» | «…para **reducir al mínimo** el riesgo de hackeos o pérdida de claves.» | Ningún sistema elimina el riesgo por completo. W-30, W-95. |
| P-06 ⚠ | Modelos › A › Resultado | «Claridad inmediata y **eliminación** de riesgos legales o técnicos.» | «Claridad inmediata y **reducción** de riesgos legales o técnicos.» | Igual que P-05. W-34. |
| P-07 ⚠ | Modelos › B › Resultado | «**Crecimiento optimizado** del capital con el mínimo **estrés** para el cliente.» | «**Gestión optimizada** del capital con el mínimo **esfuerzo** para el cliente.» | Promete crecimiento. W-34, W-95. |
| P-08 | Modelos › C › Resultado | «Una transición patrimonial **invisible, legalmente blindada** y financieramente optimizada.» | «Una transición patrimonial **discreta, sólida en lo legal** y eficiente en lo financiero.» | «Invisible» choca con la trazabilidad que exige la normativa; «blindada» es una garantía absoluta. W-34. |
| P-09 | FAQ 2 | «Nuestro enfoque es **eliminar** el riesgo de custodia en exchanges centralizados…» | «Nuestro enfoque es **reducir la dependencia de** la custodia en exchanges centralizados…» | Igual que P-05. W-42. |
| P-10 | FAQ 4 | «…coordinamos la presentación de declaraciones (como el modelo 720)…» | «…(como los modelos 720 y 721)…» | El modelo 721 es el que declara las monedas virtuales custodiadas en el extranjero; es el relevante para estos clientes. W-43. |
| P-11 | Aliados › Consultoras fiscales | «…para expatriados y **residentes no habituales** (Ley Beckham, etc.).» | «…para expatriados y **trabajadores desplazados a España** (régimen de impatriados o Ley Beckham).» | «Residente no habitual» es el régimen de Portugal; en España la Ley Beckham es el régimen de impatriados. |
| P-12 | Experiencia › perfil 1 | «Patrimonio Familiar y **Office Management**» | «Patrimonio Familiar y **Family Office Management**» | Parece faltar «Family». |
| P-13 | Modelos › A › Qué incluye | «Sesión de diagnóstico **privado**.» | «Sesión de diagnóstico **privada**.» | Concordancia (la sesión). |
| P-14 | Aliados › Exchanges | «…con la normativa europea y del Golfo» (sin punto final) | «…con la normativa europea y del Golfo.» | Puntuación. |
| P-15 | FAQ 3 | «Sí, es **perfectamente** legal…» | «Sí, es legal…» | Evita un absoluto en un tema regulado. Opcional. |
| P-16 | Modelos › B › Qué incluye | «…las **mejores** estrategias de rentabilidad pasiva.» | «…estrategias de rentabilidad pasiva **adecuadas a su perfil**.» | Superlativo difícil de justificar. Opcional. W-95. |
| P-17 | Modelos (subtítulo) y FAQ (subtítulo) | «Niveles de Intervención → Cómo contratar.» / «Resolución de dudas → Eliminación de miedos.» | Quitar ambos subtítulos o sustituirlos por «Tres niveles de intervención y cómo contratar» / «Respuestas a las dudas más habituales». | Parecen notas internas del documento (objetivo de la sección), no texto para el cliente final. Hoy se muestran tal cual. |

## 2. Cambios de formato aplicados (no cambian el contenido)

| # | Dónde | En las specs | En la web | Motivo |
|---|---|---|---|---|
| F-01 | Formulario | Notas de implementación: «(Menú desplegable: …)», «(Campo abierto)», «(Selección única)», «(Campo de texto amplio)», «(Añadir una nota: …)» | No se muestran; se implementan (desplegable, campo abierto, radio, área de texto, nota bajo el correo) | Son instrucciones para quien construye la web. |
| F-02 | Sobre mí, último párrafo del bloque 2; pregunta del formulario | Comilla de cierre suelta: «…ambas jurisdicciones."» / «…en su caso?"» | Sin la comilla suelta | Artefacto del documento. |
| F-03 | Opciones del formulario | Terminan en punto («Inmuebles en la región MENA.») | Sin punto final | Convención de opciones de formulario. |
| F-04 | Títulos | «(Partners: (Red de aliados)», «Formulario de Contacto» + «(Solicitud de Apertura…)», «FAQ:», «Sobre Mí» + «El Puente entre Dos Mundos…» | H1 «Partners: Red de aliados»; H1 «Formulario de Contacto» + subtítulo «Solicitud de Apertura de Relación Profesional»; H1 «Preguntas frecuentes (FAQ)»; H1 «Sobre Mí» + subtítulo | Paréntesis del documento limpiados; cada página necesita un H1 (W-100). |
| F-05 | Inicio, Filosofía, Servicios, Aliados | Títulos de punto con dos puntos («Seguridad Legal:») | Como encabezado sin los dos puntos | Al ir como título, los dos puntos sobran. El texto es el mismo. |
| F-06 | Listas | Viñetas, «A) B) C)», «1. 2. 3.» | Se mantiene la numeración donde las specs numeran (principios, modelos, aliados); las viñetas se muestran como bloques o lista | Diseño. |
| F-07 | Árabe | — | Cifras occidentales 0-9 en toda la versión árabe | Decisión W-92: es lo habitual en banca y web del Golfo y evita mezclar sistemas con importes en dólares. |

## 3. Texto nuevo que no está en las specs (pendiente de aprobación)

| # | Dónde | Texto (ES) | Por qué hace falta |
|---|---|---|---|
| N-01 | Ofertas de trabajo | «En este momento no hay ofertas de trabajo abiertas. Si su perfil encaja en el ámbito financiero, legal o tecnológico entre Oriente Medio y Europa, puede enviar su candidatura a empleo@saidsalim.com.» | Las specs solo traen el título (W-45). El correo usa el dominio provisional (W-02). |
| N-02 | Modelos › Cómo contratar | 6 pasos: Solicitud · Evaluación en 48-72 horas · Sesión de diagnóstico privada · Acuerdo de confidencialidad (NDA) · Propuesta · Inicio, con una frase cada uno | W-33. Los pasos salen de textos del cliente (post-envío y FAQ 5); «Propuesta» e «Inicio» son nuevos. |
| N-03 | Contacto › panel lateral | «Qué pasa después» (3 frases), «Confidencialidad» (frase de la FAQ 5), «Otras vías de contacto» | W-64. Reutiliza frases del cliente salvo los títulos. |
| N-04 | Final de cada página | «¿Hablamos de su patrimonio?» / «Complete la solicitud y analizaré personalmente la viabilidad de su caso.» / «Siguiente: …» | W-53. |
| N-05 | Botones | «Solicitar evaluación», «Solicitar una evaluación», «Solicitar este modelo», «Enviar solicitud» | Llamadas a la acción. |
| N-06 | Menú | «Filosofía», «Modelos», «Aliados», «FAQ», «Ofertas de trabajo» (pie) | Versiones cortas de los títulos del cliente para que quepa el menú (W-50, W-75). |
| N-07 | Modelos › C | Etiqueta «Más completo» | W-65. |
| N-08 | Servicios | «Incluido en: Consultoría Estratégica / Gestión de Patrimonio / Solución "Puente Integral"» bajo cada servicio | W-74. **La correspondencia servicio → modelo es una propuesta nuestra y debe validarla el cliente.** |
| N-09 | Formulario | Campos nuevos: «Teléfono (opcional)» (para WhatsApp/Signal/Telegram) y «Modelo de interés» (W-52); títulos de bloque «Sus datos» y «Su perfil patrimonial»; mensajes de error | W-52, W-79, W-84, W-85. |
| N-10 | Formulario | Información básica de protección de datos (responsable, finalidad, legitimación, destinatarios, derechos) y casilla de aceptación | W-83. Borrador: debe validarlo el abogado. |
| N-11 | Páginas legales | Aviso legal, privacidad y cookies en ES, EN y AR | W-03. Borradores redactados con IA; faltan NIF, domicilio, datos registrales, autorizaciones y proveedor del formulario. |
| N-12 | Portada › mapa | Pie «De Oriente Medio a la Unión Europea» y etiquetas «España», «Golfo» | W-72. |
| N-13 | Títulos y descripciones de cada página | Derivados del texto del cliente (ver `pages.*.title` y `description`) | W-89. |
| N-14 | Cabecera en árabe | Nombre de la marca en árabe: «سالم كابيتال» | W-93. Transliteración; el cliente debe confirmar cómo quiere escribir su marca en árabe. |
| N-15 | Asistente de preguntas (todas las páginas) | Botón «¿Preguntas?», presentación, aviso «Asistente automático. No es asesoramiento financiero, legal ni fiscal personalizado. No guardamos lo que escribe.» y respuestas breves propias: saludo, agradecimiento, tarifas («La web no publica tarifas: dependen del modelo de colaboración y de cada caso…»), mínimo («…a partir de 500.000 $», deducido del formulario), cómo contactar, residencia («coordinamos con abogados especializados», en línea con P-01), idiomas y las frases que introducen la lista de servicios y de modelos. El resto de respuestas son textos literales del cliente (FAQ, servicios, modelos, aliados…). | Petición del 12/11/2026. **El cliente debe validar estas respuestas**, sobre todo tarifas, mínimo e idiomas. Se editan en `assistant.intents` de cada idioma. |

## 4. Notas legales para el abogado (no son cambios de texto)

- **Servicios regulados.** «Gestión Activa: rebalanceo mensual de la cartera», la gestión de criptoactivos por cuenta del cliente y el asesoramiento sobre instrumentos financieros pueden requerir autorización: como proveedor de servicios de criptoactivos (CASP) según el reglamento europeo MiCA y, para instrumentos financieros, de la CNMV. Si existe, el número de autorización debe figurar en el aviso legal (campo «Autorizaciones administrativas»). Si no existe, conviene revisar la redacción de los modelos B y C.
- **Credenciales.** «Directivos de fondos soberanos» y «familias prominentes» se han restaurado (W-25). Son afirmaciones que un cliente o un regulador puede pedir que se acrediten.
- **Promesas de resultado.** Las propuestas P-02 a P-09 y P-15, P-16 reducen afirmaciones absolutas («eliminar», «invisible», «anonimato absoluto», «constantes»).
