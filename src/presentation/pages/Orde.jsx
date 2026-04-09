import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserFromToken } from "../../utils/authUtils";
import { orderService } from "../../services/orderService";
import "../../styles/OrdersPage.css";
import TrackingModal from "../../presentation/components/modals/TrackingModal";
import { trackingService } from "../../services/trackingService";


const OrdersPage = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTracking, setSelectedTracking] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const userData = getUserFromToken();
    if (!userData?.id) {
      navigate("/login");
      return;
    }
    setUser(userData);
    cargarOrdenes(userData.id);
  }, [navigate]);

  const cargarOrdenes = async (userId) => {
    try {
      setLoading(true);
      const data = await orderService.getUserOrders(userId);
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error cargando órdenes:", error);
    } finally {
      setLoading(false);
    }
  };
 const handleVerTracking = async (orderNumber) => {
  try {
    const tracking = await trackingService.getTracking(orderNumber);
    setSelectedTracking(tracking);
    setShowTrackingModal(true);
  } catch (error) {
    console.error("Error al obtener tracking:", error);
  }
};


  if (loading)
    return <p className="text-center mt-5 text-light">Cargando órdenes...</p>;

  if (!orders.length)
    return (
      <p className="text-center mt-5 text-light">
        No tienes órdenes registradas.
      </p>
    );

  return (
    <>
    <div className="orders-container">
      <h2 className="orders-title">Mis Órdenes</h2>

      <div className="orders-list">
        {orders.map((order) => (
          <div key={order._id} className="order-card">
            <div className="order-header">
              <span className="order-id"># {order.orderNumber}</span>
              <span className="order-date">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="order-body">
              <div className="order-info">
                <p>
                  <strong>Total:</strong> ${order.total?.toLocaleString()}
                </p>
                <p>
                  <strong>Estado:</strong>{" "}
                  <span
                    className={`status-badge ${
                      order.status === "PENDING"
                        ? "pending"
                        : order.status === "CONFIRMED"
                        ? "confirmed"
                        : "other"
                    }`}
                  >
                    {order.status}
                  </span>
                </p>
                 <button
        className="btn btn-sm btn-info mt-2"
        onClick={() => handleVerTracking(order.orderNumber, user.id)}
      >
        Ver Tracking
      </button>
                <p>
                  <strong>Envío:</strong> {order.shippingAddress?.city},{" "}
                  {order.shippingAddress?.state}
                </p>
              </div>

              <div className="order-products">
                <strong>Productos:</strong>
                <ul>
                  {order.products?.map((p) => (
                    <li key={p.productId}>
                      {p.name} <span>x{p.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <TrackingModal
  show={showTrackingModal}
  tracking={selectedTracking}
  onClose={() => setShowTrackingModal(false)}
/>
</>
  );
};

export default OrdersPage;
