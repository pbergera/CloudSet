import { useState, useEffect } from "react";
import { supabase } from "./supabase";

function Viajes({ usuario, outfits, prendas, onRefrescarOutfits }) {
  const [viajes, setViajes] = useState([]);
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [destino, setDestino] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [outfitsSeleccionados, setOutfitsSeleccionados] = useState([]);
  const [viajeAbierto, setViajeAbierto] = useState(null);

  useEffect(() => {
    cargarViajes();
    if (onRefrescarOutfits) onRefrescarOutfits();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarViajes = async () => {
    const { data, error } = await supabase
      .from("viajes")
      .select("*")
      .eq("usuario_id", usuario.id)
      .order("fecha_inicio", { ascending: true });
    if (!error && data) setViajes(data);
  };

  const eliminarViaje = async (id) => {
   await supabase.from("viajes").delete().eq("id", id);
   await cargarViajes();
  };

  const toggleOutfit = (id) => {
    setOutfitsSeleccionados(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const guardarViaje = async () => {
    if (!nombre || !destino) return;
    const { error } = await supabase.from("viajes").insert({
      usuario_id: usuario.id,
      nombre,
      destino,
      fecha_inicio: fechaInicio || null,
      fecha_fin: fechaFin || null,
      outfits: outfitsSeleccionados
    });
    if (!error) {
      await cargarViajes();
      setCreando(false);
      setNombre("");
      setDestino("");
      setFechaInicio("");
      setFechaFin("");
      setOutfitsSeleccionados([]);
    }
  };

  const diasViaje = (inicio, fin) => {
    if (!inicio || !fin) return null;
    const d1 = new Date(inicio);
    const d2 = new Date(fin);
    const dias = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    return dias;
  };

  const outfitsDeViaje = (ids) =>
    outfits.filter(o => (ids || []).includes(o.id));

  return (
    <div className="seccion">
      {!creando ? (
        <>
          <div className="card">
            <h2>Mis viajes</h2>
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>Planifica tu maleta para cada viaje o evento asignando outfits.</p>
            <button onClick={() => setCreando(true)} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>
              + Nuevo viaje o evento
            </button>
          </div>

          {viajes.length === 0 && (
            <div className="card">
              <p>Aún no tienes viajes planificados.</p>
            </div>
          )}

          {viajes.map(v => (
           <div key={v.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
             <div style={{ fontWeight: "500", fontSize: "14px", cursor: "pointer" }} onClick={() => setViajeAbierto(viajeAbierto === v.id ? null : v.id)}>{v.nombre}</div>
             <div onClick={() => eliminarViaje(v.id)} style={{ fontSize: "11px", color: "#cc3333", cursor: "pointer" }}>Eliminar</div>
            </div>
            <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>
             {v.destino}
             {v.fecha_inicio && ` · ${new Date(v.fecha_inicio).toLocaleDateString("es-ES")}`}
             {v.fecha_fin && ` → ${new Date(v.fecha_fin).toLocaleDateString("es-ES")}`}
             {diasViaje(v.fecha_inicio, v.fecha_fin) && ` · ${diasViaje(v.fecha_inicio, v.fecha_fin)} días`}
            </div>

              {viajeAbierto === v.id && (
                <div style={{ marginTop: "10px" }}>
                  <p style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>Outfits asignados:</p>
                  {outfitsDeViaje(v.outfits).length === 0 ? (
                    <p style={{ fontSize: "12px", color: "#aaa" }}>Sin outfits asignados</p>
                  ) : (
                    outfitsDeViaje(v.outfits).map(o => (
                    <div key={o.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid #f0ede6" }}>
                      <div style={{ display: "flex", gap: "3px" }}>
                        {(o.prendas || []).slice(0, 3).map(id => {
                          const prenda = prendas.find(p => p.id === id);
                          return prenda ? <img key={id} src={prenda.foto_url} alt={prenda.tipo} style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px", border: "1px solid #e0ddd6" }} /> : null;
                        })}
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "500" }}>{o.nombre}</div>
                        {o.evento && <div style={{ color: "#aaa", fontSize: "11px" }}>{o.evento}</div>}
                      </div>
                    </div>
                  ))
                  )}
                </div>
              )}
            </div>
          ))}
        </>
      ) : (
        <div className="card">
          <h2>Nuevo viaje</h2>
          <input
            type="text"
            placeholder="Nombre (ej: Vacaciones verano)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
          />
          <input
            type="text"
            placeholder="Destino"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
          />
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px" }}>Desde</label>
              <input
                type="date"
                value={fechaInicio}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => { setFechaInicio(e.target.value); if (fechaFin && e.target.value > fechaFin) setFechaFin(""); }}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px" }}>Hasta</label>
              <input
                type="date"
                value={fechaFin}
                min={fechaInicio || new Date().toISOString().split("T")[0]}
                onChange={(e) => setFechaFin(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
              />
            </div>
          </div>

          {outfits.length > 0 && (
            <>
              <p style={{ fontSize: "13px", color: "#888", marginBottom: "10px" }}>Asignar outfits:</p>
              {outfits.map(o => (
                <div
                  key={o.id}
                  onClick={() => toggleOutfit(o.id)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", marginBottom: "6px", border: outfitsSeleccionados.includes(o.id) ? "1.5px solid #2c2c2a" : "1px solid #e0ddd6", borderRadius: "8px", cursor: "pointer" }}
                >
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: outfitsSeleccionados.includes(o.id) ? "#2c2c2a" : "white", border: "1px solid #2c2c2a", flexShrink: 0 }} />
                  <div style={{ display: "flex", gap: "4px", marginRight: "6px" }}>
                    {(o.prendas || []).slice(0, 3).map(id => {
                      const prenda = prendas.find(p => p.id === id);
                      return prenda ? <img key={id} src={prenda.foto_url} alt={prenda.tipo} style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "4px", border: "1px solid #e0ddd6" }} /> : null;
                    })}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "500" }}>{o.nombre}</div>
                    {o.evento && <div style={{ fontSize: "11px", color: "#aaa" }}>{o.evento}</div>}
                    {o.momento && <div style={{ fontSize: "11px", color: "#aaa" }}>{o.momento}</div>}
                  </div>
                </div>
              ))}
            </>
          )}

          <button onClick={guardarViaje} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "8px", marginTop: "10px" }}>
            Guardar viaje
          </button>
          <button onClick={() => setCreando(false)} style={{ width: "100%", padding: "10px", background: "white", color: "#888", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

export default Viajes;