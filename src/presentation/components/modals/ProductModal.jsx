import React, { useEffect, useState } from "react";
import { findSuppliers } from "../../../services/providerService";
import { createProduct } from "../../../services/productService";
import { tokenService } from "../../../utils/tokenService";
import { findCategory } from "../../../services/categoryservice";
import "../../../styles/CategoriaModal.css"; // 👈 Reutiliza el mismo estilo minimalista

const ProductModal = ({ show, onClose }) => {
  const token = tokenService.getToken();
  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [producto, setProducto] = useState({
    name: "",
    description: "",
    cost: "",
    categoryId: "",
    providerId: "",
    images: "",
  });
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (show) {
      Promise.all([findSuppliers(token), findCategory(token)])
        .then(([prov, cat]) => {
          setProveedores(prov.providers || []);
          setCategorias(cat.categories || []);
        })
        .catch((error) => {
          console.error("Error cargando datos:", error);
          setMensaje("Error cargando categorías o proveedores");
        });
    }
  }, [show, token]);

  const handleChange = (e) => {
    setProducto({ ...producto, [e.target.name]: e.target.value });
  };

  const handleGuardar = async () => {
    if (
      !producto.name ||
      !producto.cost ||
      !producto.categoryId ||
      !producto.providerId
    ) {
      setMensaje("Por favor completa todos los campos obligatorios");
      return;
    }

    const data = {
      name: producto.name,
      description: producto.description,
      cost: parseFloat(producto.cost),
      categoryId: producto.categoryId,
      providers: [producto.providerId],
      images: [producto.images],
    };

    try {
      await createProduct(data, token);
      setMensaje("Producto creado con éxito");
      setTimeout(() => {
        setMensaje("");
        setProducto({
          name: "",
          description: "",
          cost: "",
          categoryId: "",
          providerId: "",
          images: "",
        });
        onClose();
      }, 1500);
    } catch (error) {
      setMensaje(error.message || "Error al crear producto");
    }
  };

  if (!show) return null;

  return (
    <div className="categoria-modal-overlay">
      <div className="categoria-modal">
        {/* Header */}
        <div className="categoria-modal-header">
          <h5>Crear nuevo producto</h5>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="categoria-modal-body">
          <input
            type="text"
            className="input-minimal"
            name="name"
            placeholder="Nombre del producto"
            value={producto.name}
            onChange={handleChange}
          />

          <input
            type="number"
            className="input-minimal"
            name="cost"
            placeholder="Costo"
            value={producto.cost}
            onChange={handleChange}
          />

          <input
            type="text"
            className="input-minimal"
            name="description"
            placeholder="Descripción"
            value={producto.description}
            onChange={handleChange}
          />

          <select
            className="input-minimal"
            name="categoryId"
            value={producto.categoryId}
            onChange={handleChange}
          >
            <option value="">Seleccionar categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            className="input-minimal"
            name="providerId"
            value={producto.providerId}
            onChange={handleChange}
          >
            <option value="">Seleccionar proveedor</option>
            {proveedores.map((prov) => (
              <option key={prov.id} value={prov.id}>
                {prov.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            className="input-minimal"
            name="images"
            placeholder="URL de la imagen"
            value={producto.images}
            onChange={handleChange}
          />

          {mensaje && (
            <p
              className={`modal-message ${
                mensaje.includes("éxito") ? "text-success" : "text-danger"
              }`}
            >
              {mensaje}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="categoria-modal-footer">
          <button className="btn-minimal" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-minimal" onClick={handleGuardar}>
            Guardar producto
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
