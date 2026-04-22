import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { CATEGORIAS } from "./categorias";

function Viajes({ usuario, outfits, prendas, onRefrescarOutfits, onRefrescarViajes }) {
  const [viajes, setViajes] = useState([]);
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [destino, setDestino] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [outfitsSeleccionados, setOutfitsSeleccionados] = useState([]);
  const [viajeAbierto, setViajeAbierto] = useState(null);
  const [viajeEditando, setViajeEditando] = useState(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [destinoEditado, setDestinoEditado] = useState("");
  const [fechaInicioEditada, setFechaInicioEditada] = useState("");
  const [fechaFinEditada, setFechaFinEditada] = useState("");
  const [errorViaje, setErrorViaje] = useState("");
  const [viajeEditandoOutfits, setViajeEditandoOutfits] = useState(null);
  const [outfitsDelViaje, setOutfitsDelViaje] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({});
  const [planesEditados, setPlanesEditados] = useState([]);
  const [tiempoViaje, setTiempoViaje] = useState({});
  const [sugerenciasDestino, setSugerenciasDestino] = useState([]);
  const [buscandoDestino, setBuscandoDestino] = useState(false);
  

  useEffect(() => {
    cargarViajes();
    if (onRefrescarOutfits) onRefrescarOutfits();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarViajes = async () => {
    const { data, error } = await supabase
      .from("viajes")
      .select("*, outfit_viaje(outfit_id)")
      .eq("usuario_id", usuario.id)
      .order("fecha_inicio", { ascending: true });
    if (!error && data) setViajes(data);
  };

  const eliminarViaje = async (id) => {
    await supabase.from("viajes").delete().eq("id", id);
    await cargarViajes();
    if (onRefrescarViajes) onRefrescarViajes();
  };

  const guardarEdicionViaje = async () => {
   if (!nombreEditado) { setErrorViaje("El nombre del viaje es obligatorio."); return; }
   setErrorViaje("");
   await supabase.from("viajes").update({
    nombre: nombreEditado,
    destino: destinoEditado,
    fecha_inicio: fechaInicioEditada || null,
    fecha_fin: fechaFinEditada || null,
    planes: planesEditados
   }).eq("id", viajeEditando.id);
   await cargarViajes();
   setViajeEditando(null);
  };

  const toggleOutfit = (id) => {
    setOutfitsSeleccionados(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const togglePlan = (momento, cantidad, esEdicion = false) => {
    const setter = esEdicion ? setPlanesEditados : setPlanes;
    setter(prev => {
      const existe = prev.find(p => p.momento === momento);
      if (existe) {
        if (cantidad === 0) return prev.filter(p => p.momento !== momento);
        return prev.map(p => p.momento === momento ? { ...p, cantidad } : p);
      }
      if (cantidad <= 0) return prev;
      return [...prev, { momento, cantidad }];
    });
  };

  const toggleSeccion = (viajeId, seccion) => {
    setSeccionesAbiertas(prev => ({
      ...prev,
      [`${viajeId}-${seccion}`]: !prev[`${viajeId}-${seccion}`]
    }));
  };


  const guardarViaje = async () => {
    if (!nombre) { setErrorViaje("El nombre es obligatorio."); return; }
    setErrorViaje("");
    const { error } = await supabase.from("viajes").insert({
      usuario_id: usuario.id,
      nombre,
      destino,
      fecha_inicio: fechaInicio || null,
      fecha_fin: fechaFin || null,
      outfits: outfitsSeleccionados,
      planes: planes
    });
    if (!error) {
      const { data: nuevoViaje } = await supabase
        .from("viajes")
        .select("id")
        .eq("usuario_id", usuario.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (nuevoViaje && outfitsSeleccionados.length > 0) {
        await supabase.from("outfit_viaje").insert(
          outfitsSeleccionados.map(o => ({ outfit_id: o, viaje_id: nuevoViaje.id }))
        );
      }
      await cargarViajes();
      setCreando(false);
      setNombre("");
      setDestino("");
      setFechaInicio("");
      setFechaFin("");
      setPlanes([]);
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

  const outfitsDeViaje = (v) => {
    const ids = (v.outfit_viaje || []).map(r => r.outfit_id);
    const outfitsDirectos = outfits.filter(o => ids.includes(o.id));
    const outfitsVinculados = outfits.filter(o => (o.viajes_ids || []).includes(v.id));
    const todos = [...outfitsDirectos, ...outfitsVinculados];
    return todos.filter((o, i, arr) => arr.findIndex(x => x.id === o.id) === i);
  };

  const obtenerTiempo = async (viaje) => {
    if (!viaje.destino || !viaje.fecha_inicio || tiempoViaje[viaje.id]) return;
  
    try {
      // obtener coordenadas del destino
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(viaje.destino)}&count=1&language=es`);
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) return;
    
      const { latitude, longitude } = geoData.results[0];
    
      // obtener tiempo
      const fechaFin = viaje.fecha_fin || viaje.fecha_inicio;
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&start_date=${viaje.fecha_inicio}&end_date=${fechaFin}`);
      const weatherData = await weatherRes.json();
    
      if (weatherData.daily) {
        setTiempoViaje(prev => ({ ...prev, [viaje.id]: weatherData.daily }));
      }
    } catch (error) {
      console.error("Error obteniendo tiempo:", error);
    }
  };

  const descripcionTiempo = (code) => {
    if (code === 0) return { texto: "Despejado", icono: "☀️" };
    if (code <= 2) return { texto: "Parcialmente nublado", icono: "⛅" };
    if (code <= 3) return { texto: "Nublado", icono: "☁️" };
    if (code <= 67) return { texto: "Lluvia", icono: "🌧️" };
    if (code <= 77) return { texto: "Nieve", icono: "❄️" };
    if (code <= 82) return { texto: "Chubascos", icono: "🌦️" };
    return { texto: "Tormenta", icono: "⛈️" };
  };

  const buscarDestino = async (texto) => {
    setDestino(texto);
    if (texto.length < 3) { setSugerenciasDestino([]); return; }
    setBuscandoDestino(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(texto)}&format=json&limit=5&accept-language=es`);
      const data = await res.json();
      setSugerenciasDestino(data.map(r => r.display_name));
    } catch (e) {
      setSugerenciasDestino([]);
    }
    setBuscandoDestino(false);
  };

  const cargarOutfitsDeViaje = async (viajeId) => {
    const { data } = await supabase
      .from("outfit_viaje")
      .select("outfit_id")
      .eq("viaje_id", viajeId);
    setOutfitsDelViaje(data ? data.map(r => r.outfit_id) : []);
  };

  const guardarOutfitsDeViaje = async () => {
    await supabase.from("outfit_viaje").delete().eq("viaje_id", viajeEditandoOutfits);
    if (outfitsDelViaje.length > 0) {
      await supabase.from("outfit_viaje").insert(
        outfitsDelViaje.map(o => ({ outfit_id: o, viaje_id: viajeEditandoOutfits }))
      );
    }
    await cargarViajes();
    if (onRefrescarOutfits) onRefrescarOutfits();
    setViajeEditandoOutfits(null);
  };


  return (
    <div className="seccion">
      {!creando ? (
        <>
          <div className="card">
            <h2>Mis viajes y eventos</h2>
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
             <div style={{ display: "flex", gap: "10px" }}>
                  <div onClick={() => { setViajeEditando(v); setNombreEditado(v.nombre); setDestinoEditado(v.destino || ""); setFechaInicioEditada(v.fecha_inicio || ""); setFechaFinEditada(v.fecha_fin || ""); setPlanesEditados(v.planes || []); }} style={{ fontSize: "11px", color: "#2c2c2a", cursor: "pointer" }}>Editar</div>
                  <div onClick={async () => { setViajeEditandoOutfits(v.id); await cargarOutfitsDeViaje(v.id); }} style={{ fontSize: "11px", color: "#2c2c2a", cursor: "pointer" }}>Outfits</div>
                  <div onClick={() => eliminarViaje(v.id)} style={{ fontSize: "11px", color: "#cc3333", cursor: "pointer" }}>Eliminar</div>
                </div>
            </div>
            <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>
             {v.destino}
             {v.fecha_inicio && ` · ${new Date(v.fecha_inicio).toLocaleDateString("es-ES")}`}
             {v.fecha_fin && ` → ${new Date(v.fecha_fin).toLocaleDateString("es-ES")}`}
             {diasViaje(v.fecha_inicio, v.fecha_fin) && ` · ${diasViaje(v.fecha_inicio, v.fecha_fin)} días`}
            </div>

              {viajeAbierto === v.id && (
                <div style={{ marginTop: "10px" }}>
                  {v.destino && v.fecha_inicio && (
                    <div style={{ marginBottom: "12px" }}>
                      {!tiempoViaje[v.id] && (
                        <div onClick={() => obtenerTiempo(v)} style={{ fontSize: "12px", color: "#888", cursor: "pointer", padding: "6px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                          🌤️ <span style={{ textDecoration: "underline" }}>Ver tiempo en {v.destino}</span>
                        </div>
                      )}
                      {tiempoViaje[v.id] && (
                        <div style={{ marginBottom: "10px" }}>
                          <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Tiempo en {v.destino}:</p>
                          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                            {tiempoViaje[v.id].time.map((dia, i) => {
                              const { icono } = descripcionTiempo(tiempoViaje[v.id].weathercode[i]);
                              const fecha = new Date(dia).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
                              return (
                                <div key={dia} style={{ textAlign: "center", minWidth: "60px", background: "#f5f5f3", borderRadius: "8px", padding: "8px 4px" }}>
                                  <div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>{fecha}</div>
                                  <div style={{ fontSize: "20px" }}>{icono}</div>
                                  <div style={{ fontSize: "11px", fontWeight: "500", color: "#2c2c2a" }}>{Math.round(tiempoViaje[v.id].temperature_2m_max[i])}°</div>
                                  <div style={{ fontSize: "10px", color: "#aaa" }}>{Math.round(tiempoViaje[v.id].temperature_2m_min[i])}°</div>
                                  <div style={{ fontSize: "9px", color: "#aaa" }}>{tiempoViaje[v.id].precipitation_probability_max[i]}% 💧</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {(() => {
                    const todosOutfits = outfitsDeViaje(v);
                    const planesViaje = v.planes && v.planes.length > 0 ? v.planes.filter(p => p.cantidad > 0) : [];
                    const momentosConPlan = planesViaje.map(p => p.momento);

                    return (
                      <>
                        {planesViaje.map(p => {
                          const outfitsPlan = todosOutfits.filter(o =>
                            (o.momentos && o.momentos.length > 0 ? o.momentos : o.momento ? [o.momento] : []).includes(p.momento)
                          );
                          const cubierto = outfitsPlan.length >= p.cantidad;
                          const abierto = seccionesAbiertas[`${v.id}-${p.momento}`];
                          return (
                            <div key={p.momento} style={{ marginBottom: "8px" }}>
                              <div onClick={() => toggleSeccion(v.id, p.momento)} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "6px 0", borderBottom: "1px solid #f0ede6" }}>
                                <span style={{ fontSize: "13px", flex: 1, fontWeight: "500" }}>{p.momento}</span>
                                <span style={{ fontSize: "12px", color: cubierto ? "#2c2c2a" : "#cc3333", background: cubierto ? "#f1efe8" : "#fff0f0", padding: "2px 8px", borderRadius: "10px" }}>
                                  {outfitsPlan.length}/{p.cantidad}
                                </span>
                                <span style={{ fontSize: "10px", color: "#aaa" }}>{abierto ? "▲" : "▼"}</span>
                              </div>
                              {abierto && (
                                <div style={{ paddingTop: "6px" }}>
                                  {outfitsPlan.length === 0 ? (
                                    <p style={{ fontSize: "12px", color: "#aaa", padding: "4px 0" }}>Sin outfits asignados</p>
                                  ) : outfitsPlan.map(o => (
                                    <div key={o.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid #f0ede6" }}>
                                      <div style={{ display: "flex", gap: "3px" }}>
                                        {(o.prendas || []).slice(0, 3).map(id => {
                                          const prenda = prendas.find(p => p.id === id);
                                          return prenda ? <img key={id} src={prenda.foto_url} alt={prenda.tipo} style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px", border: "1px solid #e0ddd6" }} /> : null;
                                        })}
                                      </div>
                                      <div style={{ fontSize: "13px", fontWeight: "500" }}>{o.nombre}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {todosOutfits.filter(o =>
                          !(o.momentos && o.momentos.length > 0 ? o.momentos : o.momento ? [o.momento] : []).some(m => momentosConPlan.includes(m))
                        ).length > 0 && (
                          <div style={{ marginBottom: "8px" }}>
                            <div onClick={() => toggleSeccion(v.id, "otros")} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "6px 0", borderBottom: "1px solid #f0ede6" }}>
                              <span style={{ fontSize: "13px", flex: 1, fontWeight: "500" }}>Otros</span>
                              <span style={{ fontSize: "10px", color: "#aaa" }}>{seccionesAbiertas[`${v.id}-otros`] ? "▲" : "▼"}</span>
                            </div>
                            {seccionesAbiertas[`${v.id}-otros`] && (
                              <div style={{ paddingTop: "6px" }}>
                                {todosOutfits.filter(o =>
                                  !(o.momentos && o.momentos.length > 0 ? o.momentos : o.momento ? [o.momento] : []).some(m => momentosConPlan.includes(m))
                                ).map(o => (
                                  <div key={o.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid #f0ede6" }}>
                                    <div style={{ display: "flex", gap: "3px" }}>
                                      {(o.prendas || []).slice(0, 3).map(id => {
                                        const prenda = prendas.find(p => p.id === id);
                                        return prenda ? <img key={id} src={prenda.foto_url} alt={prenda.tipo} style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px", border: "1px solid #e0ddd6" }} /> : null;
                                      })}
                                    </div>
                                    <div style={{ fontSize: "13px", fontWeight: "500" }}>{o.nombre}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ marginBottom: "8px" }}>
                          <div onClick={() => toggleSeccion(v.id, "maleta")} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "6px 0", borderBottom: "1px solid #f0ede6" }}>
                            <span style={{ fontSize: "13px", flex: 1, fontWeight: "500" }}>Mi maleta</span>
                            <span style={{ fontSize: "10px", color: "#aaa" }}>{seccionesAbiertas[`${v.id}-maleta`] ? "▲" : "▼"}</span>
                          </div>

                          {seccionesAbiertas[`${v.id}-maleta`] && (
                            <div style={{ paddingTop: "8px" }}>
                              {CATEGORIAS.map(grupo => {
                                const opcionesGrupo = grupo.opciones
                                  ? grupo.opciones
                                  : grupo.subgrupos.flatMap(s => s.opciones ? s.opciones : [s.subgrupo]);
                                const prendasGrupo = [...new Set(todosOutfits.flatMap(o => o.prendas || []))]
                                  .map(id => prendas.find(p => p.id === id))
                                  .filter(p => p && opcionesGrupo.includes(p.tipo));
                                if (prendasGrupo.length === 0) return null;
                                return (
                                  <div key={grupo.grupo} style={{ marginBottom: "12px" }}>
                                    <div style={{ fontSize: "11px", fontWeight: "600", color: "#2c2c2a", letterSpacing: "0.06em", marginBottom: "6px", paddingBottom: "4px", borderBottom: "2px solid #2c2c2a" }}>{grupo.grupo}</div>
                                    {grupo.opciones ? (
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {prendasGrupo.map(prenda => (
                                          <div key={prenda.id} style={{ textAlign: "center" }}>
                                            <img src={prenda.foto_url} alt={prenda.tipo} style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e0ddd6", display: "block" }} />
                                            <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>{prenda.tipo}</div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : grupo.subgrupos.map(s => {
                                      const opcionesS = s.opciones ? s.opciones : [s.subgrupo];
                                      const prendasS = [...new Set(todosOutfits.flatMap(o => o.prendas || []))]
                                        .map(id => prendas.find(p => p.id === id))
                                        .filter(p => p && opcionesS.includes(p.tipo));
                                      if (prendasS.length === 0) return null;
                                      return (
                                        <div key={s.subgrupo} style={{ marginBottom: "8px" }}>
                                          <div style={{ fontSize: "11px", fontWeight: "500", color: "#555", marginBottom: "4px", paddingBottom: "2px", borderBottom: "1px solid #e0ddd6" }}>{s.subgrupo}</div>
                                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                            {prendasS.map(prenda => (
                                              <div key={prenda.id} style={{ textAlign: "center" }}>
                                                <img src={prenda.foto_url} alt={prenda.tipo} style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e0ddd6", display: "block" }} />
                                                <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>{prenda.tipo}</div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                        </div>
                      </>
                    );
                  })()}
                </div>
              )}


          </div>
          ))}

      {viajeEditando && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "1.25rem", width: "300px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "500", marginBottom: "14px" }}>Editar viaje o evento</h2>
            <input type="text" value={nombreEditado} onChange={(e) => setNombreEditado(e.target.value)} placeholder="Nombre" style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }} />
            <input type="text" value={destinoEditado} onChange={(e) => setDestinoEditado(e.target.value)} placeholder="Destino" style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }} />
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px" }}>Desde</label>
                <input type="date" value={fechaInicioEditada} onChange={(e) => setFechaInicioEditada(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px" }}>Hasta</label>
                <input type="date" value={fechaFinEditada} min={fechaInicioEditada} onChange={(e) => setFechaFinEditada(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }} />
              </div>
            </div>
            {errorViaje && <p style={{ fontSize: "13px", color: "#cc3333", marginBottom: "10px" }}>{errorViaje}</p>}
            
            <div style={{ marginBottom: "14px" }}>
              <p style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>Planifica tus conjuntos:</p>
              {["Casual", "Arreglado", "Deportivo", "Noche", "Día", "Playa", "Trabajo", "Formal"].map(m => {
                const plan = planesEditados.find(p => p.momento === m);
                return (
                  <div key={m} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", flex: 1 }}>{m}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div onClick={() => togglePlan(m, (plan?.cantidad || 0) - 1, true)} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid #e0ddd6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px", color: "#888" }}>−</div>
                      <span style={{ fontSize: "14px", fontWeight: "500", minWidth: "20px", textAlign: "center" }}>{plan?.cantidad || 0}</span>
                      <div onClick={() => togglePlan(m, (plan?.cantidad || 0) + 1, true)} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid #e0ddd6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px", color: "#888" }}>+</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={guardarEdicionViaje} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "8px" }}>Guardar</button>
            <button onClick={() => setViajeEditando(null)} style={{ width: "100%", padding: "10px", background: "white", color: "#888", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}
        </>
      ) : (
        <div className="card">
          <h2>Nuevo viaje o evento</h2>
          <input
            type="text"
            placeholder="Nombre (ej: Vacaciones verano)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
          />
          
          <div style={{ position: "relative", marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Destino"
              value={destino}
              onChange={(e) => buscarDestino(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
            />
            {buscandoDestino && <div style={{ fontSize: "12px", color: "#aaa", padding: "4px 12px" }}>Buscando...</div>}
            {sugerenciasDestino.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #e0ddd6", borderRadius: "8px", zIndex: 200, maxHeight: "200px", overflowY: "auto", marginTop: "2px" }}>
                {sugerenciasDestino.map((s, i) => (
                  <div key={i} onClick={() => { setDestino(s); setSugerenciasDestino([]); }}
                    style={{ padding: "8px 12px", fontSize: "13px", cursor: "pointer", borderBottom: "1px solid #f0ede6" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f5f5f3"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

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

          <div style={{ marginBottom: "14px" }}>
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>Planifica tus conjuntos:</p>
            {["Casual", "Arreglado", "Deportivo", "Noche", "Día", "Playa", "Trabajo", "Formal"].map(m => {
              const plan = planes.find(p => p.momento === m);
              return (
                <div key={m} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", flex: 1 }}>{m}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div onClick={() => togglePlan(m, (plan?.cantidad || 0) - 1)} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid #e0ddd6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px", color: "#888" }}>−</div>
                    <span style={{ fontSize: "14px", fontWeight: "500", minWidth: "20px", textAlign: "center" }}>{plan?.cantidad || 0}</span>
                    <div onClick={() => togglePlan(m, (plan?.cantidad || 0) + 1)} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid #e0ddd6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px", color: "#888" }}>+</div>
                  </div>
                </div>
              );
            })}
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

          {errorViaje && <p style={{ fontSize: "13px", color: "#cc3333", marginBottom: "10px" }}>{errorViaje}</p>}
          <button onClick={guardarViaje} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "8px", marginTop: "10px" }}>
            Guardar viaje
          </button>
          <button onClick={() => setCreando(false)} style={{ width: "100%", padding: "10px", background: "white", color: "#888", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      )}
    
      {viajeEditandoOutfits && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "1.25rem", width: "300px", maxHeight: "80vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "500", marginBottom: "14px" }}>Outfits del viaje</h2>
            <p style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>Selecciona los outfits para este viaje:</p>
            {outfits.map(o => (
              <div key={o.id}
                onClick={() => setOutfitsDelViaje(prev => prev.includes(o.id) ? prev.filter(x => x !== o.id) : [...prev, o.id])}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", marginBottom: "6px", border: outfitsDelViaje.includes(o.id) ? "1.5px solid #2c2c2a" : "1px solid #e0ddd6", borderRadius: "8px", cursor: "pointer" }}
              >
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: outfitsDelViaje.includes(o.id) ? "#2c2c2a" : "white", border: "1px solid #2c2c2a", flexShrink: 0 }} />
                <div style={{ display: "flex", gap: "4px", marginRight: "6px" }}>
                  {(o.prendas || []).slice(0, 3).map(id => {
                    const prenda = prendas.find(p => p.id === id);
                    return prenda ? <img key={id} src={prenda.foto_url} alt={prenda.tipo} style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "4px", border: "1px solid #e0ddd6" }} /> : null;
                  })}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "500" }}>{o.nombre}</div>
                  {(o.momentos && o.momentos.length > 0 ? o.momentos : o.momento ? [o.momento] : []).map(m => (
                    <span key={m} style={{ fontSize: "11px", color: "#aaa", marginRight: "4px" }}>{m}</span>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={guardarOutfitsDeViaje} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "8px", marginTop: "8px" }}>Guardar</button>
            <button onClick={() => setViajeEditandoOutfits(null)} style={{ width: "100%", padding: "10px", background: "white", color: "#888", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}
    
    </div>
  );
}

export default Viajes;