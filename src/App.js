import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Login from "./Login";
import Perfil from "./Perfil";
import "./App.css";
import Outfits from "./Outfits";
import Viajes from "./Viajes";
import { CATEGORIAS, TODAS_CATEGORIAS } from "./categorias";

function App() {
  const [seccion, setSeccion] = useState("perfil");
  const [prendas, setPrendas] = useState([]);
  const [estilos, setEstilos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [prendaPrevia, setPrendaPrevia] = useState(null);
  const [tipoPrenda, setTipoPrenda] = useState("");
  const [colorPrenda, setColorPrenda] = useState("");
  const [outfitsList, setOutfitsList] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroColor, setFiltroColor] = useState("");
  const [prendaEditando, setPrendaEditando] = useState(null);
  const [tipoEditado, setTipoEditado] = useState("");
  const [colorEditado, setColorEditado] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null);
      setCargandoSesion(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (usuario) {
      cargarPrendas();
      cargarPerfil();
      cargarOutfits();
    }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [usuario]);

  const cargarPrendas = async () => {
    const { data, error } = await supabase
      .from("prendas")
      .select("*")
      .eq("usuario_id", usuario.id)
      .order("created_at", { ascending: false });
    if (!error && data) setPrendas(data);
  };

  const cargarPerfil = async () => {
  const { data } = await supabase
    .from("usuarios")
    .select("estilos")
    .eq("id", usuario.id)
    .single();
  if (data?.estilos) setEstilos(data.estilos);
};

const cargarOutfits = async () => {
  const { data, error } = await supabase
    .from("outfits")
    .select("*")
    .eq("usuario_id", usuario.id);
  if (!error && data) setOutfitsList(data);
};

const guardarEstilos = async (nuevosEstilos) => {
  await supabase
    .from("usuarios")
    .upsert({ id: usuario.id, estilos: nuevosEstilos });
};

  const toggleEstilo = (estilo) => {
  const nuevos = estilos.includes(estilo)
    ? estilos.filter((e) => e !== estilo)
    : [...estilos, estilo];
  setEstilos(nuevos);
  guardarEstilos(nuevos);
};

const seleccionarFoto = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  setPrendaPrevia({ file, url });
  setTipoPrenda("");
  setColorPrenda("");
  analizarPrendaConIA(file);
};

const analizarPrendaConIA = async (file) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = async () => {
    const base64 = reader.result.split(",")[1];
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.REACT_APP_GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "Analiza esta prenda de ropa. Responde SOLO en formato JSON con estos campos: tipo (uno de: camiseta, camisa, pantalon, vestido, falda, chaqueta, abrigo, zapatos, zapatillas, accesorio, otro), color (color principal en español, una palabra). Ejemplo: {\"tipo\":\"camiseta\",\"color\":\"azul\"}" },
                { inline_data: { mime_type: file.type, data: base64 } }
              ]
            }]
          })
        }
      );
      const data = await response.json();
      console.log("Respuesta Gemini:", JSON.stringify(data));
      if (!data.candidates || !data.candidates[0]) {
        console.error("Sin candidatos en respuesta:", data);
        return;
      }
      const texto = data.candidates[0].content.parts[0].text;
      const limpio = texto.replace(/```json|```/g, "").trim();
      const resultado = JSON.parse(limpio);
      if (resultado.tipo) setTipoPrenda(resultado.tipo);
      if (resultado.color) setColorPrenda(resultado.color);
    } catch (error) {
      console.error("Error analizando con IA:", error);
    }
  };
};

const guardarPrenda = async () => {
  if (!prendaPrevia) return;
  setCargando(true);

  const nombreArchivo = `${usuario.id}/${Date.now()}_${prendaPrevia.file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("prendas")
    .upload(nombreArchivo, prendaPrevia.file);

  if (uploadError) {
    console.error("Error subiendo foto:", uploadError);
    setCargando(false);
    return;
  }

  const { data: urlData } = supabase.storage
    .from("prendas")
    .getPublicUrl(nombreArchivo);

  const { error: dbError } = await supabase
    .from("prendas")
    .insert({
      foto_url: urlData.publicUrl,
      tipo: tipoPrenda || "sin clasificar",
      color: colorPrenda || "sin color",
      usuario_id: usuario.id
    });

  if (!dbError) {
    await cargarPrendas();
    setPrendaPrevia(null);
  }
  setCargando(false);
};

const eliminarPrenda = async (id, foto_url) => {
  const nombreArchivo = foto_url.split("/prendas/")[1];
  await supabase.storage.from("prendas").remove([nombreArchivo]);
  await supabase.from("prendas").delete().eq("id", id);
  await cargarPrendas();
};

const guardarEdicion = async () => {
  await supabase
    .from("prendas")
    .update({ tipo: tipoEditado, color: colorEditado })
    .eq("id", prendaEditando.id);
  await cargarPrendas();
  setPrendaEditando(null);
};

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setPrendas([]);
  };

  if (cargandoSesion) return <div className="app"><p style={{padding:"2rem", color:"#888"}}>Cargando...</p></div>;
  if (!usuario) return <Login onLogin={() => {}} />;

  return (
    <div className="app">
      <div className="header">
        <span className="logo">CloudSet</span>
      </div>

      <div className="nav">
      {["perfil", "armario", "outfits", "viajes", "cuenta"].map((s) => (
          <button
            key={s}
            className={`nav-btn ${seccion === s ? "active" : ""}`}
            onClick={() => setSeccion(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {seccion === "perfil" && (
        <div className="seccion">
          <div className="card">
            <h2>Tu perfil de estilo</h2>
            <p style={{fontSize:"12px", color:"#aaa", marginBottom:"8px"}}>{usuario.email}</p>
            <p>Selecciona los estilos con los que te identificas:</p>
            <div className="tags">
              {["Casual", "Minimalista", "Clásico", "Boho", "Deportivo", "Formal"].map((e) => (
                <span
                  key={e}
                  className={`tag ${estilos.includes(e) ? "tag-active" : ""}`}
                  onClick={() => toggleEstilo(e)}
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

{seccion === "armario" && (
        <div className="seccion">
          <div className="card">
            <h2>Mi armario</h2>
           <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ flex: 1, padding: "7px 10px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "13px" }}>
              <option value="">Todos los tipos</option>
              {CATEGORIAS.map(g => (
                <optgroup key={g.grupo} label={g.grupo}>
                  {g.opciones.map(o => <option key={o} value={o}>{o}</option>)}
                </optgroup>
              ))}
            </select>
            <input type="text" placeholder="Color..." value={filtroColor} onChange={(e) => setFiltroColor(e.target.value)} style={{ flex: 1, padding: "7px 10px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "13px" }} />
          </div>
            {!prendaPrevia ? (
              <label className="upload-btn">
                + Añadir prenda
                <input type="file" accept="image/*" onChange={seleccionarFoto} hidden />
              </label>
            ) : (
              <div>
                <img src={prendaPrevia.url} alt="prenda" style={{ width: "100%", borderRadius: "8px", marginBottom: "12px" }} />
                <select value={tipoPrenda} onChange={(e) => setTipoPrenda(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}>
                  <option value="">Tipo de prenda...</option>
                  {CATEGORIAS.map(g => (
                    <optgroup key={g.grupo} label={g.grupo}>
                      {g.opciones.map(o => <option key={o} value={o}>{o}</option>)}
                    </optgroup>
                  ))}
                </select>
                <input type="text" placeholder="Color (ej: azul, negro...)" value={colorPrenda} onChange={(e) => setColorPrenda(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }} />
                <button onClick={guardarPrenda} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "8px" }}>
                  {cargando ? "Guardando..." : "Guardar prenda"}
                </button>
                <button onClick={() => setPrendaPrevia(null)} style={{ width: "100%", padding: "10px", background: "white", color: "#888", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "16px" }}>
                  Cancelar
                </button>
              </div>
            )}
            {prendas.length === 0 && !prendaPrevia && (
              <p>Aún no tienes prendas. ¡Añade la primera!</p>
            )}
            <div className="grid">
              {prendas
                .filter(p => !filtroTipo || p.tipo === filtroTipo)
                .filter(p => !filtroColor || p.color?.toLowerCase().includes(filtroColor.toLowerCase()))
                .map((p) => (
                <div key={p.id} className="grid-item">
                  <img src={p.foto_url} alt={p.tipo} />
                  <div style={{ padding: "4px 6px", fontSize: "11px", color: "#888", textAlign: "center" }}>
                    <div style={{ fontWeight: "500", color: "#2c2c2a" }}>{p.tipo}</div>
                    <div>{p.color}</div>
                  </div>
                  <div style={{ display: "flex", borderTop: "1px solid #f0ede6" }}>
                    <div onClick={() => { setPrendaEditando(p); setTipoEditado(p.tipo); setColorEditado(p.color); }} style={{ flex: 1, padding: "4px", fontSize: "11px", color: "#2c2c2a", textAlign: "center", cursor: "pointer" }}>Editar</div>
                    <div style={{ width: "1px", background: "#f0ede6" }} />
                    <div onClick={() => eliminarPrenda(p.id, p.foto_url)} style={{ flex: 1, padding: "4px", fontSize: "11px", color: "#cc3333", textAlign: "center", cursor: "pointer" }}>Eliminar</div>
                  </div>
                </div>
              ))}
            </div>

            {prendaEditando && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
                <div style={{ background: "white", borderRadius: "12px", padding: "1.25rem", width: "300px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: "500", marginBottom: "14px" }}>Editar prenda</h2>
                  <select value={tipoEditado} onChange={(e) => setTipoEditado(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}>
                    <option value="">Tipo de prenda...</option>
                    {CATEGORIAS.map(g => (
                      <optgroup key={g.grupo} label={g.grupo}>
                        {g.opciones.map(o => <option key={o} value={o}>{o}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <input type="text" value={colorEditado} onChange={(e) => setColorEditado(e.target.value)} placeholder="Color" style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }} />
                  <button onClick={guardarEdicion} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "8px" }}>Guardar</button>
                  <button onClick={() => setPrendaEditando(null)} style={{ width: "100%", padding: "10px", background: "white", color: "#888", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {seccion === "outfits" && (
        <Outfits usuario={usuario} prendas={prendas} />
      )}

    {seccion === "viajes" && (
        <Viajes usuario={usuario} outfits={outfitsList} prendas={prendas} />
      )}

    {seccion === "cuenta" && (
        <Perfil usuario={usuario} onCerrarSesion={cerrarSesion} />
      )}
    </div>
  );
}

export default App;