import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Login from "./Login";
import "./App.css";

function App() {
  const [seccion, setSeccion] = useState("perfil");
  const [prendas, setPrendas] = useState([]);
  const [estilos, setEstilos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

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

  const añadirPrenda = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCargando(true);

    const nombreArchivo = `${usuario.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("prendas")
      .upload(nombreArchivo, file);

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
      .insert({ foto_url: urlData.publicUrl, tipo: "sin clasificar", usuario_id: usuario.id });

    if (!dbError) await cargarPrendas();
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
        {["perfil", "armario", "outfits", "viajes"].map((s) => (
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
            <label className="upload-btn">
              {cargando ? "Subiendo..." : "+ Añadir prenda"}
              <input type="file" accept="image/*" onChange={añadirPrenda} hidden />
            </label>
            {prendas.length === 0 && (
              <p>Aún no tienes prendas. ¡Añade la primera!</p>
            )}
            <div className="grid">
              {prendas.map((p) => (
                <div key={p.id} className="grid-item">
                  <img src={p.foto_url} alt="prenda" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {seccion === "outfits" && (
        <div className="seccion">
          <div className="card">
            <h2>Mis outfits</h2>
            <p>Aquí podrás crear y guardar combinaciones de tu armario.</p>
          </div>
        </div>
      )}

      {seccion === "viajes" && (
        <div className="seccion">
          <div className="card">
            <h2>Viajes y eventos</h2>
            <p>Planifica tu maleta para cada viaje o evento.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;