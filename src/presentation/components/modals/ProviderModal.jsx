import React, { useState, useEffect } from "react";
import { findSuppliers, createSupplier } from "../../../services/providerService";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/CategoriaModal.css"; 

const ModalProvider = ({ show, onClose }) => {
  const [nombre, setNombre] = useState("");
  const [proveedores, setProveedores] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (show) {
      findSuppliers(token)
        .then((data) => setProveedores(data.providers || []))
        .catch((err) => {
          console.error("Error al cargar proveedores:", err);
          setMensaje("Error al cargar proveedores");
        });
    }
  }, [show, token]);

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setMensaje("Por favor ingresa un nombre de proveedor");
      return;
    }

    const existe = proveedores.some(
      (p) => p.name.toLowerCase() === nombre.trim().toLowerCase()
    );

    if (existe) {
      setMensaje("El proveedor ya existe");
      return;
    }

    try {
      await createSupplier(nombre, token);
      setMensaje("Proveedor creado correctamente");
      setTimeout(() => {
        setMensaje("");
        setNombre("");
        onClose();
      }, 1500);
    } catch (error) {
      setMensaje(error.message || "Error al crear proveedor");
    }
  };

  if (!show) return null;

  return (
    <div className="categoria-modal-overlay">
      <div className="categoria-modal">
        {/* Header */}
        <div className="categoria-modal-header">
          <h5>Crear nuevo proveedor</h5>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="categoria-modal-body">
          <input
            type="text"
            className="input-minimal"
            placeholder="Nombre del proveedor"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          {mensaje && <p className="modal-message">{mensaje}</p>}
        </div>

        {/* Footer */}
        <div className="categoria-modal-footer">
          <button className="btn-minimal" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-minimal" onClick={handleGuardar}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalProvider;
