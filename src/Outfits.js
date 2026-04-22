import { useState, useEffect } from "react";
import { supabase } from "./supabase";


function Outfits({ usuario, prendas, viajes, onRefrescarViajes }) {
  const [outfits, setOutfits] = useState([]);
  const [creando, setCreando] = useState(false);
  const [nombreOutfit, setNombreOutfit] = useState("");
  const [eventoOutfit, setEventoOutfit] = useState("");
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [outfitEditando, setOutfitEditando] = useState(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [eventoEditado, setEventoEditado] = useState("");
  const [momentoEditado, setMomentoEditado] = useState("");
  const [ordenOutfits, setOrdenOutfits] = useState([]);
  const [momentosOutfit, setMomentosOutfit] = useState([]);
  const [viajesSeleccionados, setViajesSeleccionados] = useState([]);
  const [viajesEditados, setViajesEditados] = useState([]);
  const [prendasEditadas, setPrendasEditadas] = useState([]);
  const [errorOutfit, setErrorOutfit] = useState("");

  useEffect(() => {
    cargarOutfits();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarOutfits = async () => {
    const { data, error } = await supabase
      .from("outfits")
      .select("*")
      .eq("usuario_id", usuario.id)
      .order("created_at", { ascending: false });
    if (!error && data) setOutfits(data);
  };

  const eliminarOutfit = async (id) => {
   await supabase.from("outfits").delete().eq("id", id);
   await cargarOutfits();
  };

  const duplicarOutfit = async (o) => {
   const { error } = await supabase.from("outfits").insert({
    usuario_id: usuario.id,
    nombre: o.nombre + " (copia)",
    evento: o.evento || null,
    momento: o.momento || null,
    prendas: o.prendas || []
   });
   if (!error) await cargarOutfits();
  };

  const guardarEdicionOutfit = async () => {
   await supabase.from("outfits").update({
    nombre: nombreEditado,
    evento: eventoEditado || null,
    momento: Array.isArray(momentoEditado) && momentoEditado.length > 0 ? momentoEditado[0] : momentoEditado || null,
    momentos: Array.isArray(momentoEditado) ? momentoEditado : momentoEditado ? [momentoEditado] : [],
    prendas: prendasEditadas,
   }).eq("id", outfitEditando.id);

   await supabase.from("outfit_viaje").delete().eq("outfit_id", outfitEditando.id);
   if (viajesEditados.length > 0) {
    await supabase.from("outfit_viaje").insert(
      viajesEditados.map(v => ({ outfit_id: outfitEditando.id, viaje_id: v }))
    );
   }

   await cargarOutfits();
   if (onRefrescarViajes) onRefrescarViajes();
   setOutfitEditando(null);
  };

  const togglePrenda = (id) => {
    setSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  
  const guardarOutfit = async () => {
    if (!nombreOutfit) { setErrorOutfit("El nombre del outfit es obligatorio."); return; }
    if (seleccionadas.length === 0) { setErrorOutfit("Selecciona al menos una prenda."); return; }
    setErrorOutfit("");
    const { error } = await supabase.from("outfits").insert({
      usuario_id: usuario.id,
      nombre: nombreOutfit,
      evento: eventoOutfit || null,
      viajes_ids: viajesSeleccionados,
      momento: momentosOutfit.length > 0 ? momentosOutfit[0] : null,
      momentos: momentosOutfit,
      prendas: seleccionadas
    });
    if (!error) {
     await cargarOutfits();
     // vincular a viajes
     if (viajesSeleccionados.length > 0) {
      const { data: nuevoOutfit } = await supabase
        .from("outfits")
        .select("id")
        .eq("usuario_id", usuario.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (nuevoOutfit) {
        await supabase.from("outfit_viaje").insert(
          viajesSeleccionados.map(v => ({ outfit_id: nuevoOutfit.id, viaje_id: v }))
        );
      }
    }
    setCreando(false);
    setNombreOutfit("");
    setEventoOutfit("");
    setMomentosOutfit([]);
    setViajesSeleccionados([]);
    setSeleccionadas([]);
   }
  };

  const prendasDeOutfit = (ids) =>
    prendas.filter(p => ids.includes(p.id));

  return (
    <div className="seccion">
      {!creando ? (
        <>
          <div className="card">
            <h2>Mis outfits</h2>
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>Combina prendas de tu armario y guarda tus looks favoritos.</p>
            <button onClick={() => setCreando(true)} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "12px" }}>
              + Crear outfit
            </button>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
              {["Casual", "Arreglado", "Deportivo", "Noche", "Día", "Playa", "Trabajo", "Formal"].map(m => (
                <span
                  key={m}
                  onClick={() => setOrdenOutfits(prev =>
                    prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
                  )}
                  style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", border: "1px solid #e0ddd6", cursor: "pointer", background: ordenOutfits.includes(m) ? "#2c2c2a" : "white", color: ordenOutfits.includes(m) ? "white" : "#888" }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          {outfits.length === 0 && (
            <div className="card">
              <p>Aún no tienes outfits guardados.</p>
            </div>
          )}

          {outfits.filter(o => ordenOutfits.length === 0 || (o.momentos || [o.momento]).some(m => ordenOutfits.includes(m))).map(o => (
            <div key={o.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <div style={{ fontWeight: "500", fontSize: "14px" }}>{o.nombre}</div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div onClick={async () => {
                    setOutfitEditando(o);
                    setNombreEditado(o.nombre);
                    setEventoEditado(o.evento || "");
                    setMomentoEditado(o.momentos && o.momentos.length > 0 ? o.momentos : o.momento ? [o.momento] : []);
                    setPrendasEditadas(o.prendas || []);
                    const { data: relacionesViajes } = await supabase.from("outfit_viaje").select("viaje_id").eq("outfit_id", o.id);
                    setViajesEditados(relacionesViajes ? relacionesViajes.map(r => r.viaje_id) : []);
                  }} style={{ fontSize: "11px", color: "#2c2c2a", cursor: "pointer" }}>Editar</div>
                  <div onClick={() => duplicarOutfit(o)} style={{ fontSize: "11px", color: "#2c2c2a", cursor: "pointer" }}>Duplicar</div>
                  <div onClick={() => eliminarOutfit(o.id)} style={{ fontSize: "11px", color: "#cc3333", cursor: "pointer" }}>Eliminar</div>
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "#888", marginBottom: "10px", display: "flex", gap: "8px" }}>
                {o.evento && <span>{o.evento}</span>}
                {(o.momentos && o.momentos.length > 0 ? o.momentos : o.momento ? [o.momento] : []).map(m => (
                  <span key={m} style={{ background: "#f1efe8", padding: "1px 8px", borderRadius: "10px", marginRight: "4px" }}>{m}</span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {prendasDeOutfit(o.prendas || []).map(p => (
                  <img key={p.id} src={p.foto_url} alt={p.tipo} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e0ddd6" }} />
                ))}
              </div>
            </div>
          ))}

      {outfitEditando && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "1.25rem", width: "300px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "500", marginBottom: "14px" }}>Editar outfit</h2>
            <input type="text" value={nombreEditado} onChange={(e) => setNombreEditado(e.target.value)} placeholder="Nombre del outfit" style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }} />
            <div style={{ marginBottom: "14px" }}>
              <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Momento (opcional):</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {["Casual", "Arreglado", "Deportivo", "Noche", "Día", "Playa", "Trabajo", "Formal"].map(m => (
                  <span key={m} onClick={() => setMomentoEditado(prev => Array.isArray(prev) ? (prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]) : [m])}
                    style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", border: "1px solid #e0ddd6", cursor: "pointer", background: (Array.isArray(momentoEditado) ? momentoEditado : [momentoEditado]).includes(m) ? "#2c2c2a" : "white", color: (Array.isArray(momentoEditado) ? momentoEditado : [momentoEditado]).includes(m) ? "white" : "#888" }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Prendas del outfit:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                {prendasEditadas.map(id => {
                  const p = prendas.find(x => x.id === id);
                  return p ? (
                    <div key={id} style={{ position: "relative" }}>
                      <img src={p.foto_url} alt={p.tipo} style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e0ddd6" }} />
                      <div onClick={() => setPrendasEditadas(prev => prev.filter(x => x !== id))}
                        style={{ position: "absolute", top: "-4px", right: "-4px", width: "16px", height: "16px", borderRadius: "50%", background: "#cc3333", color: "white", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        ×
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
              <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Añadir prendas:</p>
              <div className="grid">
                {prendas.filter(p => !prendasEditadas.includes(p.id)).map(p => (
                  <div key={p.id} onClick={() => setPrendasEditadas(prev => [...prev, p.id])}
                    style={{ cursor: "pointer", borderRadius: "8px", overflow: "hidden", border: "1px solid #e0ddd6" }}>
                    <img src={p.foto_url} alt={p.tipo} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            </div>

            {viajes && viajes.length > 0 && (
              <div style={{ marginBottom: "14px" }}>
                <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Vincular a viaje (opcional):</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {viajes.map(v => (
                    <span key={v.id} onClick={() => setViajesEditados(prev => prev.includes(v.id) ? prev.filter(x => x !== v.id) : [...prev, v.id])}
                      style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", border: "1px solid #e0ddd6", cursor: "pointer", background: viajesEditados.includes(v.id) ? "#2c2c2a" : "white", color: viajesEditados.includes(v.id) ? "white" : "#888" }}>
                      {v.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <button onClick={guardarEdicionOutfit} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "8px" }}>Guardar</button>
            <button onClick={() => setOutfitEditando(null)} style={{ width: "100%", padding: "10px", background: "white", color: "#888", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}
        </>
      ) : (
        <div className="card">
          <h2>Nuevo outfit</h2>
          <input
            type="text"
            placeholder="Nombre del outfit"
            value={nombreOutfit}
            onChange={(e) => setNombreOutfit(e.target.value)}
            style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
          />
          

          {viajes && viajes.length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Vincular a viaje (opcional):</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {viajes.map(v => (
                  <span key={v.id} onClick={() => setViajesSeleccionados(prev => prev.includes(v.id) ? prev.filter(x => x !== v.id) : [...prev, v.id])}
                    style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", border: "1px solid #e0ddd6", cursor: "pointer", background: viajesSeleccionados.includes(v.id) ? "#2c2c2a" : "white", color: viajesSeleccionados.includes(v.id) ? "white" : "#888" }}>
                    {v.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom: "14px" }}>
            <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Momento (opcional):</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {["Casual", "Arreglado", "Deportivo", "Noche", "Día", "Playa", "Trabajo", "Formal"].map(m => (
                <span key={m} onClick={() => setMomentosOutfit(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                  style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", border: "1px solid #e0ddd6", cursor: "pointer", background: momentosOutfit.includes(m) ? "#2c2c2a" : "white", color: momentosOutfit.includes(m) ? "white" : "#888" }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "#888", marginBottom: "10px" }}>Selecciona las prendas:</p>
          <div className="grid" style={{ marginBottom: "14px" }}>
            {prendas.map(p => (
              <div
                key={p.id}
                onClick={() => togglePrenda(p.id)}
                style={{ cursor: "pointer", borderRadius: "8px", overflow: "hidden", border: seleccionadas.includes(p.id) ? "2px solid #2c2c2a" : "1px solid #e0ddd6" }}
              >
                <img src={p.foto_url} alt={p.tipo} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />
                <div style={{ padding: "3px 4px", fontSize: "10px", textAlign: "center", color: "#888" }}>{p.tipo}</div>
              </div>
            ))}
          </div>
          {errorOutfit && <p style={{ fontSize: "13px", color: "#cc3333", marginBottom: "10px" }}>{errorOutfit}</p>}
          <button onClick={guardarOutfit} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "8px" }}>
            Guardar outfit
          </button>
          <button onClick={() => setCreando(false)} style={{ width: "100%", padding: "10px", background: "white", color: "#888", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

export default Outfits;