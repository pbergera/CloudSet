import { useState } from "react";
import { supabase } from "./supabase";

function Estilista({ usuario, prendas, outfits, viajes }) {
  const [mensajes, setMensajes] = useState([
    { role: "assistant", text: "¡Hola! Soy tu estilista personal. Conozco tu armario y tus outfits. Puedo ayudarte a elegir qué ponerte, hacer la maleta para un viaje, o decirte qué te falta en el armario. ¿En qué te ayudo?" }
  ]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);

  const contexto = () => {
    const prendasTexto = prendas.map(p => `- ID:${p.id} ${p.tipo}${p.colores?.length > 0 ? ` (${p.colores.join(", ")})` : p.color ? ` (${p.color})` : ""}${p.momentos?.length > 0 ? ` [${p.momentos.join(", ")}]` : p.momento ? ` [${p.momento}]` : ""}`).join("\n");
    const outfitsTexto = outfits.map(o => `- ID:${o.id} ${o.nombre}${o.momentos?.length > 0 ? ` [${o.momentos.join(", ")}]` : o.momento ? ` [${o.momento}]` : ""} prendas:[${(o.prendas || []).join(",")}]`).join("\n");
    const viajesTexto = viajes.map(v => `- ID:${v.id} ${v.nombre}${v.destino ? ` en ${v.destino}` : ""}${v.fecha_inicio ? ` del ${new Date(v.fecha_inicio).toLocaleDateString("es-ES")}` : ""}${v.fecha_fin ? ` al ${new Date(v.fecha_fin).toLocaleDateString("es-ES")}` : ""}`).join("\n");

    return `Eres una estilista personal experta y amigable. Conoces el armario de la usuaria al detalle y das consejos personalizados basados en sus prendas reales.

ARMARIO (${prendas.length} prendas):
${prendasTexto || "Sin prendas"}

OUTFITS GUARDADOS (${outfits.length}):
${outfitsTexto || "Sin outfits"}

VIAJES Y EVENTOS (${viajes.length}):
${viajesTexto || "Sin viajes"}

Responde SIEMPRE en este formato exacto:
TEXTO: [tu respuesta en español, cercana y práctica, referenciando prendas reales]
ACCIONES: [JSON array con acciones sugeridas, o [] si no hay acciones]

Las acciones posibles son:
- Crear outfit: {"tipo":"crear_outfit","nombre":"nombre del outfit","prendas":["id1","id2"],"momentos":["Día"]}
- Crear viaje: {"tipo":"crear_viaje","nombre":"nombre viaje","destino":"ciudad","fecha_inicio":"YYYY-MM-DD","fecha_fin":"YYYY-MM-DD","outfits":["id1","id2"]}

Ejemplo de respuesta:
TEXTO: Para una cena informal te recomiendo combinar tu blazer negro con los vaqueros azules.
ACCIONES: [{"tipo":"crear_outfit","nombre":"Cena informal","prendas":["id-blazer","id-vaqueros"],"momentos":["Noche"]}]`;
  };

  const ejecutarAccion = async (accion) => {
    if (accion.tipo === "crear_outfit") {
      const { error } = await supabase.from("outfits").insert({
        usuario_id: usuario.id,
        nombre: accion.nombre,
        prendas: accion.prendas,
        momentos: accion.momentos || [],
        momento: accion.momentos?.[0] || null
      });
      if (!error) {
        setMensajes(prev => [...prev, { role: "assistant", text: `✅ Outfit "${accion.nombre}" creado correctamente. Puedes verlo en la pestaña Outfits.` }]);
      }

    } else if (accion.tipo === "crear_viaje") {
      const { data: nuevoViaje, error } = await supabase.from("viajes").insert({
        usuario_id: usuario.id,
        nombre: accion.nombre,
        destino: accion.destino || null,
        fecha_inicio: accion.fecha_inicio || null,
        fecha_fin: accion.fecha_fin || null,
        outfits: accion.outfits || []
      }).select().single();
      if (!error && nuevoViaje && accion.outfits?.length > 0) {
        await supabase.from("outfit_viaje").insert(
          accion.outfits.map(o => ({ outfit_id: o, viaje_id: nuevoViaje.id }))
        );
      }
      if (!error) {
        setMensajes(prev => [...prev, { role: "assistant", text: `✅ Viaje "${accion.nombre}" creado correctamente. Puedes verlo en la pestaña Viajes.` }]);
      }
    }
  };

  const enviar = async () => {
    if (!input.trim() || cargando) return;
    const pregunta = input.trim();
    setInput("");
    setMensajes(prev => [...prev, { role: "user", text: pregunta }]);
    setCargando(true);

    try {
      const historial = mensajes
        .filter(m => !m.acciones)
        .map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.text }]
        }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.REACT_APP_GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: contexto() }] },
            contents: [...historial, { role: "user", parts: [{ text: pregunta }] }]
          })
        }
      );
      const data = await response.json();
      const respuestaCompleta = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // parsear texto y acciones
      const textoMatch = respuestaCompleta.match(/TEXTO:([\s\S]*?)(?=ACCIONES:|$)/);
      const accionesMatch = respuestaCompleta.match(/ACCIONES:\s*(\[[\s\S]*\])/);

      const texto = textoMatch ? textoMatch[1].trim() : respuestaCompleta.replace(/ACCIONES:\s*\[[\s\S]*\]/, "").trim();
      let acciones = [];
      if (accionesMatch) {
        try {
          acciones = JSON.parse(accionesMatch[1]);
        } catch (e) {
          acciones = [];
        }
      }

      setMensajes(prev => [...prev, { role: "assistant", text: texto, acciones }]);
    } catch (error) {
      setMensajes(prev => [...prev, { role: "assistant", text: "Ha ocurrido un error. Inténtalo de nuevo." }]);
    }
    setCargando(false);
  };

  return (
    <div className="seccion" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      <div className="card" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
        <h2>Estilista ✨</h2>
        <p style={{ fontSize: "13px", color: "#888", marginBottom: "4px" }}>Tu asistente personal conoce tu armario y te ayuda a combinar outfits.</p>
        {mensajes.map((m, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role === "user" ? "#2c2c2a" : "#f5f5f3",
                color: m.role === "user" ? "white" : "#2c2c2a",
                fontSize: "13px", lineHeight: "1.5", whiteSpace: "pre-wrap"
              }}>
                {m.text}
              </div>
            </div>
            {m.acciones && m.acciones.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px", paddingLeft: "4px" }}>
                {m.acciones.map((accion, j) => (
                  <button key={j} onClick={() => ejecutarAccion(accion)}
                    style={{ padding: "6px 14px", background: "white", border: "1px solid #2c2c2a", borderRadius: "20px", fontSize: "12px", cursor: "pointer", color: "#2c2c2a" }}>
                    {accion.tipo === "crear_outfit" ? `+ Crear outfit "${accion.nombre}"` : `+ Crear viaje "${accion.nombre}"`}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {cargando && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "#f5f5f3", fontSize: "13px", color: "#aaa" }}>
              Pensando...
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "10px", padding: "0 4px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          placeholder="Pregúntame algo sobre tu armario..."
          style={{ flex: 1, padding: "10px 14px", border: "1px solid #e0ddd6", borderRadius: "24px", fontSize: "14px", outline: "none" }}
        />
        <button onClick={enviar} disabled={cargando}
          style={{ padding: "10px 18px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "24px", fontSize: "14px", cursor: "pointer" }}>
          →
        </button>
      </div>
    </div>
  );
}

export default Estilista;