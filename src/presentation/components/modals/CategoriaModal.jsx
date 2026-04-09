import React, { useState } from "react";
import { createCategory } from "../../../services/categoryservice";
import "../../../styles/CategoriaModal.css"; 

const CategoriaModal = ({ show, onClose }) => {
  const [nombre, setNombre] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setMensaje("Por favor ingresa un nombre de categoría");
      return;
    }

    try {
      setLoading(true);
      setMensaje(null);

      await createCategory(nombre.trim());

      setMensaje("Categoría creada correctamente");
      setNombre("");

      setTimeout(() => {
        onClose(); 
        setMensaje(null);
      }, 1000);

    } catch (error) {
      console.error("Error al crear categoría:", error);
      setMensaje("No se pudo crear la categoría. Verifica si ya existe.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
   <div className="categoria-modal-overlay">
  <div className="categoria-modal">
    <div className="categoria-modal-header">
      <h5>Crear nueva categoría</h5>
      <button type="button" className="close-btn" onClick={onClose}>
        ✕
      </button>
    </div>

    <div className="categoria-modal-body">
      <input
        type="text"
        className="input-minimal"
        placeholder="Ej: Elementos"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      {mensaje && <p className="modal-message">{mensaje}</p>}
    </div>

    <div className="categoria-modal-footer">
      <button className="btn-minimal" onClick={onClose}>
        Cancelar
      </button>
      <button
        className="btn-minimal"
        onClick={handleGuardar}
        disabled={loading}
      >
        {loading ? "Guardando..." : "Guardar"}
      </button>
    </div>
  </div>
</div>

  );
};

export default CategoriaModal;
