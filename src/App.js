import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Login from "./Login";
import Perfil from "./Perfil";
import "./App.css";
import Outfits from "./Outfits";
import Viajes from "./Viajes";
import SelectorCategoria from "./SelectorCategoria";
import { TODAS_CATEGORIAS } from "./categorias";

function App() {
  const [seccion, setSeccion] = useState("armario");
  const [prendas, setPrendas] = useState([]);
  const [estilos, setEstilos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [prendaPrevia, setPrendaPrevia] = useState(null);
  const [tipoPrenda, setTipoPrenda] = useState("");
  const [coloresPrenda, setColoresPrenda] = useState([]);
  const [outfitsList, setOutfitsList] = useState([]);
  const [prendaEditando, setPrendaEditando] = useState(null);
  const [tipoEditado, setTipoEditado] = useState("");
  const [coloresEditados, setColoresEditados] = useState([]);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [ordenarPor, setOrdenarPor] = useState("categoria");
  const [momentosPrenda, setMomentosPrenda] = useState([]);
  const [momentosEditados, setMomentosEditados] = useState([]);
  const [filtroColorActivo, setFiltroColorActivo] = useState([]);
  const [filtroMomentoActivo, setFiltroMomentoActivo] = useState([]);
  const [filtroCategoriaActivo, setFiltroCategoriaActivo] = useState([]);

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
    .select("estilos, foto_cara, nombre")
    .eq("id", usuario.id)
    .single();
   if (data?.estilos) setEstilos(data.estilos);
   if (data?.foto_cara) setFotoPerfil(data.foto_cara);
   if (data?.nombre) setNombreUsuario(data.nombre);
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
  setColoresPrenda([]);
  setMomentosPrenda([]);
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
      if (resultado.color) setColoresPrenda([resultado.color]);
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
      color: coloresPrenda.length > 0 ? coloresPrenda.join(", ") : "sin color",
      colores: coloresPrenda,
      momento: momentosPrenda.length > 0 ? momentosPrenda[0] : null,
      momentos: momentosPrenda,
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
    .update({ tipo: tipoEditado, color: coloresEditados.length > 0 ? coloresEditados.join(", ") : "sin color", colores: coloresEditados, momento: momentosEditados.length > 0 ? momentosEditados[0] : null, momentos: momentosEditados })
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
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "11px", fontWeight: "500", color: "#aaa", letterSpacing: "0.12em", textTransform: "uppercase" }}>CloudSet</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "22px", fontWeight: "500", color: "#2c2c2a" }}>
              {nombreUsuario ? `¡Hola, ${nombreUsuario}!` : "¡Hola!"}
            </div>
          </div>
          <div onClick={() => setSeccion("cuenta")} style={{ width: "44px", height: "44px", borderRadius: "50%", overflow: "hidden", border: "1px solid #e0ddd6", cursor: "pointer", background: "#f5f5f3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {fotoPerfil ? <img src={fotoPerfil} alt="perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "13px", color: "#888" }}>Yo</span>}
          </div>
        </div>
      </div>

      <div className="nav">
      {["armario", "outfits", "viajes"].map((s) => (
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
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>Añade tus prendas para crear outfits y planificar tus viajes.</p>
           <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            <select value={ordenarPor} onChange={(e) => setOrdenarPor(e.target.value)} style={{ flex: 1, padding: "7px 10px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "13px" }}>
              <option value="categoria">Por categoría</option>
              <option value="momento">Por momento</option>
              <option value="color">Por color</option>
            </select>
          </div>
            {!prendaPrevia ? (
              <label className="upload-btn">
                + Añadir prenda
                <input type="file" accept="image/*" onChange={seleccionarFoto} hidden />
              </label>
            ) : (
              <div>
                <img src={prendaPrevia.url} alt="prenda" style={{ width: "100%", borderRadius: "8px", marginBottom: "12px" }} />
                <SelectorCategoria value={tipoPrenda} onChange={setTipoPrenda} placeholder="Tipo de prenda..." />
                <div style={{ marginBottom: "10px" }}>
                  <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Color (selecciona o escribe):</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
                    {["Negro", "Blanco", "Gris", "Beige", "Marron", "Rojo", "Rosa", "Naranja", "Amarillo", "Verde", "Azul", "Morado", "Dorado", "Plateado", "Estampado"].map(c => (
                      <span key={c} onClick={() => setColoresPrenda(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                        style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", border: "1px solid #e0ddd6", cursor: "pointer", background: coloresPrenda.includes(c) ? "#2c2c2a" : "white", color: coloresPrenda.includes(c) ? "white" : "#888" }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Momento (opcional):</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {["Casual", "Arreglado", "Deportivo", "Noche", "Día", "Playa", "Trabajo", "Formal"].map(m => (
                      <span key={m} onClick={() => setMomentosPrenda(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                        style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", border: "1px solid #e0ddd6", cursor: "pointer", background: momentosPrenda.includes(m) ? "#2c2c2a" : "white", color: momentosPrenda.includes(m) ? "white" : "#888" }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
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

            {ordenarPor === "categoria" && (() => {
              const grupos = {};
              prendas.forEach(p => {
                const clave = p.tipo || "Sin categoría";
                if (!grupos[clave]) grupos[clave] = [];
                grupos[clave].push(p);
              });
              const ordenadas = [
                ...TODAS_CATEGORIAS.filter(c => grupos[c]),
                ...Object.keys(grupos).filter(g => !TODAS_CATEGORIAS.includes(g))
              ];
              const toggleCategoria = (cat) => {
                setFiltroCategoriaActivo(prev =>
                  prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                );
              };
              const categoriasMostradas = filtroCategoriaActivo.length > 0
                ? ordenadas.filter(c => filtroCategoriaActivo.includes(c))
                : ordenadas;
              return (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                    {ordenadas.map(c => (
                      <span
                        key={c}
                        onClick={() => toggleCategoria(c)}
                        style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", border: "1px solid #e0ddd6", cursor: "pointer", background: filtroCategoriaActivo.includes(c) ? "#2c2c2a" : "white", color: filtroCategoriaActivo.includes(c) ? "white" : "#888" }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  {categoriasMostradas.map(grupo => (
                    <div key={grupo} style={{ marginBottom: "16px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "500", color: "#aaa", letterSpacing: "0.08em", marginBottom: "8px", paddingBottom: "4px", borderBottom: "1px solid #f0ede6" }}>{grupo}</div>
                      <div className="grid">
                        {grupos[grupo].map(p => (
                          <div key={p.id} className="grid-item">
                            <img src={p.foto_url} alt={p.tipo} />
                            <div style={{ display: "flex", borderTop: "1px solid #f0ede6" }}>
                              <div onClick={() => { setPrendaEditando(p); setTipoEditado(p.tipo); setColoresEditados(p.colores || []); setMomentosEditados(p.momentos || []); }} style={{ flex: 1, padding: "4px", fontSize: "11px", color: "#2c2c2a", textAlign: "center", cursor: "pointer" }}>Editar</div>
                              <div style={{ width: "1px", background: "#f0ede6" }} />
                              <div onClick={() => eliminarPrenda(p.id, p.foto_url)} style={{ flex: 1, padding: "4px", fontSize: "11px", color: "#cc3333", textAlign: "center", cursor: "pointer" }}>Eliminar</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}

            {ordenarPor === "momento" && (() => {
              const momentos = ["Casual", "Arreglado", "Deportivo", "Noche", "Día", "Playa", "Trabajo", "Formal", "Sin momento"];
              const toggleMomento = (momento) => {
                setFiltroMomentoActivo(prev =>
                  prev.includes(momento) ? prev.filter(m => m !== momento) : [...prev, momento]
                );
              };
              const momentosMostrados = filtroMomentoActivo.length > 0
                ? momentos.filter(m => filtroMomentoActivo.includes(m))
                : momentos;
              return (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                    {momentos.map(m => (
                      <span
                        key={m}
                        onClick={() => toggleMomento(m)}
                        style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", border: "1px solid #e0ddd6", cursor: "pointer", background: filtroMomentoActivo.includes(m) ? "#2c2c2a" : "white", color: filtroMomentoActivo.includes(m) ? "white" : "#888" }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  {momentosMostrados.map(momento => {
                    const items = prendas.filter(p => (p.momento || "Sin momento") === momento);
                    if (items.length === 0) return null;
                    return (
                      <div key={momento} style={{ marginBottom: "16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "500", color: "#aaa", letterSpacing: "0.08em", marginBottom: "8px", paddingBottom: "4px", borderBottom: "1px solid #f0ede6" }}>{momento}</div>
                        <div className="grid">
                          {items.map(p => (
                            <div key={p.id} className="grid-item">
                              <img src={p.foto_url} alt={p.tipo} />
                              <div style={{ display: "flex", borderTop: "1px solid #f0ede6" }}>
                                <div onClick={() => { setPrendaEditando(p); setTipoEditado(p.tipo); setColoresEditados(p.colores || []); setMomentosEditados(p.momentos || []); }} style={{ flex: 1, padding: "4px", fontSize: "11px", color: "#2c2c2a", textAlign: "center", cursor: "pointer" }}>Editar</div>
                                <div style={{ width: "1px", background: "#f0ede6" }} />
                                <div onClick={() => eliminarPrenda(p.id, p.foto_url)} style={{ flex: 1, padding: "4px", fontSize: "11px", color: "#cc3333", textAlign: "center", cursor: "pointer" }}>Eliminar</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            })()}

            {ordenarPor === "color" && (() => {
              const colores = {};
              prendas.forEach(p => {
                const clave = p.color && p.color !== "sin color" ? p.color : "Sin color";
                if (!colores[clave]) colores[clave] = [];
                colores[clave].push(p);
              });
              const coloresDisponibles = Object.keys(colores).sort();
              const toggleColor = (color) => {
                setFiltroColorActivo(prev =>
                  prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
                );
              };
              const coloresMostrados = filtroColorActivo.length > 0
                ? Object.entries(colores).filter(([c]) => filtroColorActivo.includes(c))
                : Object.entries(colores);
              return (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                    {coloresDisponibles.map(c => (
                      <span
                        key={c}
                        onClick={() => toggleColor(c)}
                        style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", border: "1px solid #e0ddd6", cursor: "pointer", background: filtroColorActivo.includes(c) ? "#2c2c2a" : "white", color: filtroColorActivo.includes(c) ? "white" : "#888" }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  {coloresMostrados.map(([color, items]) => (
                    <div key={color} style={{ marginBottom: "16px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "500", color: "#aaa", letterSpacing: "0.08em", marginBottom: "8px", paddingBottom: "4px", borderBottom: "1px solid #f0ede6" }}>{color}</div>
                      <div className="grid">
                        {items.map(p => (
                          <div key={p.id} className="grid-item">
                            <img src={p.foto_url} alt={p.tipo} />
                            <div style={{ display: "flex", borderTop: "1px solid #f0ede6" }}>
                              <div onClick={() => { setPrendaEditando(p); setTipoEditado(p.tipo); setColoresEditados(p.colores || []); setMomentosEditados(p.momentos || []); }} style={{ flex: 1, padding: "4px", fontSize: "11px", color: "#2c2c2a", textAlign: "center", cursor: "pointer" }}>Editar</div>
                              <div style={{ width: "1px", background: "#f0ede6" }} />
                              <div onClick={() => eliminarPrenda(p.id, p.foto_url)} style={{ flex: 1, padding: "4px", fontSize: "11px", color: "#cc3333", textAlign: "center", cursor: "pointer" }}>Eliminar</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}
                

            {prendaEditando && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
                <div style={{ background: "white", borderRadius: "12px", padding: "1.25rem", width: "300px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: "500", marginBottom: "14px" }}>Editar prenda</h2>
                  <SelectorCategoria value={tipoEditado} onChange={setTipoEditado} placeholder="Tipo de prenda..." />
                  <div style={{ marginBottom: "10px" }}>
                    <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Color:</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {["Negro", "Blanco", "Gris", "Beige", "Marron", "Rojo", "Rosa", "Naranja", "Amarillo", "Verde", "Azul", "Morado", "Dorado", "Plateado", "Estampado"].map(c => (
                        <span key={c} onClick={() => setColoresEditados(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                          style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", border: "1px solid #e0ddd6", cursor: "pointer", background: coloresEditados.includes(c) ? "#2c2c2a" : "white", color: coloresEditados.includes(c) ? "white" : "#888" }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Momento:</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {["Casual", "Arreglado", "Deportivo", "Noche", "Día", "Playa", "Trabajo", "Formal"].map(m => (
                        <span key={m} onClick={() => setMomentosEditados(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                          style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", border: "1px solid #e0ddd6", cursor: "pointer", background: momentosEditados.includes(m) ? "#2c2c2a" : "white", color: momentosEditados.includes(m) ? "white" : "#888" }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
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
        <Viajes usuario={usuario} outfits={outfitsList} prendas={prendas} onRefrescarOutfits={cargarOutfits} />
      )}

    {seccion === "cuenta" && (
     <Perfil usuario={usuario} onCerrarSesion={cerrarSesion} onEstilosActualizados={(url) => { setFotoPerfil(url); cargarPerfil(); }} />
    )}
    </div>
  );
}

export default App;