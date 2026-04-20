import { useState } from "react";
import { supabase } from "./supabase";

function Perfil({ usuario, onCerrarSesion }) {
  const [nombre, setNombre] = useState(usuario.user_metadata?.nombre || "");
  const [guardado, setGuardado] = useState(false);
  const [cambioPassword, setCambioPassword] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [mensajePassword, setMensajePassword] = useState("");
  const [fotoCara, setFotoCara] = useState(null);
  const [fotoCuerpo, setFotoCuerpo] = useState(null);
  const [cargandoFoto, setCargandoFoto] = useState(false);

  useEffect(() => {
   const cargarFotos = async () => {
    const { data } = await supabase.from("usuarios").select("foto_cara, foto_cuerpo").eq("id", usuario.id).single();
    if (data?.foto_cara) setFotoCara(data.foto_cara);
    if (data?.foto_cuerpo) setFotoCuerpo(data.foto_cuerpo);
   };
   cargarFotos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardarNombre = async () => {
    await supabase.auth.updateUser({ data: { nombre } });
    await supabase.from("usuarios").upsert({ id: usuario.id, nombre });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const cambiarPassword = async () => {
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
    if (error) setMensajePassword("Error al cambiar la contraseña");
    else {
      setMensajePassword("Contraseña actualizada correctamente");
      setNuevaPassword("");
      setCambioPassword(false);
    }
    setTimeout(() => setMensajePassword(""), 3000);
  };

  const subirFotoPerfil = async (file, tipo) => {
   setCargandoFoto(true);
   const nombreArchivo = `${usuario.id}_${tipo}`;
   await supabase.storage.from("perfiles").remove([nombreArchivo]);
   const { error } = await supabase.storage.from("perfiles").upload(nombreArchivo, file, { upsert: true });
   if (!error) {
    const { data } = supabase.storage.from("perfiles").getPublicUrl(nombreArchivo);
    if (tipo === "cara") setFotoCara(data.publicUrl + "?t=" + Date.now());
    else setFotoCuerpo(data.publicUrl + "?t=" + Date.now());
    await supabase.from("usuarios").upsert({ id: usuario.id, [`foto_${tipo}`]: data.publicUrl });
   }
   setCargandoFoto(false);
  };

  return (
    <div className="seccion">
      <div className="card">
        <h2>Mi perfil</h2>
        <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "16px" }}>{usuario.email}</p>

        <label style={{ fontSize: "13px", color: "#888", display: "block", marginBottom: "6px" }}>Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
        />
        <button onClick={guardarNombre} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "16px" }}>
          {guardado ? "✓ Guardado" : "Guardar nombre"}
        </button>

        <div style={{ height: "1px", background: "#e0ddd6", marginBottom: "16px" }} />

        <p style={{ fontSize: "14px", fontWeight: "500", marginBottom: "10px" }}>Fotos de perfil</p>
        <p style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>Añade una foto de cara y una de cuerpo entero para recibir sugerencias personalizadas.</p>
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <label style={{ cursor: "pointer" }}>
              <div style={{ width: "100%", aspectRatio: "0.75", borderRadius: "8px", border: "1px dashed #e0ddd6", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f3", marginBottom: "6px" }}>
                {fotoCara ? <img src={fotoCara} alt="cara" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "12px", color: "#aaa" }}>+ Cara</span>}
              </div>
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && subirFotoPerfil(e.target.files[0], "cara")} />
            </label>
            <span style={{ fontSize: "11px", color: "#888" }}>Foto de cara</span>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <label style={{ cursor: "pointer" }}>
              <div style={{ width: "100%", aspectRatio: "0.75", borderRadius: "8px", border: "1px dashed #e0ddd6", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f3", marginBottom: "6px" }}>
                {fotoCuerpo ? <img src={fotoCuerpo} alt="cuerpo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "12px", color: "#aaa" }}>+ Cuerpo</span>}
              </div>
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && subirFotoPerfil(e.target.files[0], "cuerpo")} />
            </label>
            <span style={{ fontSize: "11px", color: "#888" }}>Foto de cuerpo entero</span>
          </div>
        </div>
        {cargandoFoto && <p style={{ fontSize: "12px", color: "#888", marginBottom: "12px" }}>Subiendo foto...</p>}
        
        <div style={{ height: "1px", background: "#e0ddd6", marginBottom: "16px" }} />

        <p style={{ fontSize: "14px", fontWeight: "500", marginBottom: "10px" }}>Contraseña</p>
        
        
        {!cambioPassword ? (
          <button onClick={() => setCambioPassword(true)} style={{ width: "100%", padding: "10px", background: "white", color: "#2c2c2a", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "16px" }}>
            Cambiar contraseña
          </button>
        ) : (
          <>
            <input
              type="password"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              placeholder="Nueva contraseña"
              style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
            />
            <button onClick={cambiarPassword} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "8px" }}>
              Confirmar nueva contraseña
            </button>
            <button onClick={() => setCambioPassword(false)} style={{ width: "100%", padding: "10px", background: "white", color: "#888", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "16px" }}>
              Cancelar
            </button>
          </>
        )}
        {mensajePassword && <p style={{ fontSize: "13px", color: "green", marginBottom: "16px" }}>{mensajePassword}</p>}

        <div style={{ height: "1px", background: "#e0ddd6", marginBottom: "16px" }} />

        <button onClick={onCerrarSesion} style={{ width: "100%", padding: "10px", background: "white", color: "#cc3333", border: "1px solid #cc3333", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default Perfil;