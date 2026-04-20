import { useState, useEffect } from "react";
import { supabase } from "./supabase";


function Outfits({ usuario, prendas }) {
  const [outfits, setOutfits] = useState([]);
  const [creando, setCreando] = useState(false);
  const [nombreOutfit, setNombreOutfit] = useState("");
  const [eventoOutfit, setEventoOutfit] = useState("");
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [momentoOutfit, setMomentoOutfit] = useState("");

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

  const togglePrenda = (id) => {
    setSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const guardarOutfit = async () => {
    if (!nombreOutfit || seleccionadas.length === 0) return;
    const { error } = await supabase.from("outfits").insert({
      usuario_id: usuario.id,
      nombre: nombreOutfit,
      evento: eventoOutfit || null,
      momento: momentoOutfit || null,
      prendas: seleccionadas
    });
    if (!error) {
      await cargarOutfits();
      setCreando(false);
      setNombreOutfit("");
      setEventoOutfit("");
      setMomentoOutfit("");
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
            <button onClick={() => setCreando(true)} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>
              + Crear outfit
            </button>
          </div>

          {outfits.length === 0 && (
            <div className="card">
              <p>Aún no tienes outfits guardados.</p>
            </div>
          )}

          {outfits.map(o => (
            <div key={o.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <div style={{ fontWeight: "500", fontSize: "14px" }}>{o.nombre}</div>
                <div onClick={() => eliminarOutfit(o.id)} style={{ fontSize: "11px", color: "#cc3333", cursor: "pointer" }}>Eliminar</div>
              </div>
              <div style={{ fontSize: "12px", color: "#888", marginBottom: "10px", display: "flex", gap: "8px" }}>
                {o.evento && <span>{o.evento}</span>}
                {o.momento && <span style={{ background: "#f1efe8", padding: "1px 8px", borderRadius: "10px" }}>{o.momento}</span>}
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {prendasDeOutfit(o.prendas || []).map(p => (
                  <img key={p.id} src={p.foto_url} alt={p.tipo} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e0ddd6" }} />
                ))}
              </div>
            </div>
          ))}
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
          <input
            type="text"
            placeholder="Evento o viaje (opcional)"
            value={eventoOutfit}
            onChange={(e) => setEventoOutfit(e.target.value)}
            style={{ width: "100%", marginBottom: "14px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
          />
          <select
            value={momentoOutfit}
            onChange={(e) => setMomentoOutfit(e.target.value)}
            style={{ width: "100%", marginBottom: "14px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
          >
            <option value="">Momento (opcional)</option>
            <option value="Día">Día</option>
            <option value="Noche">Noche</option>
            <option value="Cena">Cena</option>
            <option value="Playa">Playa</option>
            <option value="Deporte">Deporte</option>
            <option value="Trabajo">Trabajo</option>
            <option value="Casual">Casual</option>
            <option value="Formal">Formal</option>
            <option value="Viaje">Viaje</option>
          </select>
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