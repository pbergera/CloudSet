import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Login from "./Login";
import Perfil from "./Perfil";
import "./App.css";
import Outfits from "./Outfits";

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
        <button onClick={cerrarSesion} style={{ fontSize: "12px", color: "#888", background: "none", border: "none", cursor: "pointer" }}>
          Cerrar sesión
        </button>
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
                  <option value="camiseta">Camiseta</option>
                  <option value="camisa">Camisa</option>
                  <option value="pantalon">Pantalón</option>
                  <option value="vestido">Vestido</option>
                  <option value="falda">Falda</option>
                  <option value="chaqueta">Chaqueta</option>
                  <option value="abrigo">Abrigo</option>
                  <option value="zapatos">Zapatos</option>
                  <option value="zapatillas">Zapatillas</option>
                  <option value="accesorio">Accesorio</option>
                  <option value="otro">Otro</option>
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
              {prendas.map((p) => (
                <div key={p.id} className="grid-item">
                  <img src={p.foto_url} alt={p.tipo} />
                  <div style={{ padding: "4px 6px", fontSize: "11px", color: "#888", textAlign: "center" }}>
                    <div style={{ fontWeight: "500", color: "#2c2c2a" }}>{p.tipo}</div>
                    <div>{p.color}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {seccion === "outfits" && (
        <Outfits usuario={usuario} prendas={prendas} />
      )}

      {seccion === "viajes" && (
        <div className="seccion">
          <div className="card">
            <h2>Viajes y eventos</h2>
            <p>Planifica tu maleta para cada viaje o evento.</p>
          </div>
        </div>
      )}
    {seccion === "cuenta" && (
        <Perfil usuario={usuario} onCerrarSesion={cerrarSesion} />
      )}
    </div>
  );
}

export default App;