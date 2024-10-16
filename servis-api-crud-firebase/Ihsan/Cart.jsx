import React, { useState, useEffect } from "react";
import { FaTrashAlt } from "react-icons/fa";
import Header from "../../headerNavBreadcrumbs/HeaderWebUser";
import { NavbarSection } from "./NavbarSection";

const cartItems = [
  {
    id: 1,
    img: "/src/assets/icon/iconCart/image.png",
    title: "Dataset Visual",
    description: "Tambahan data visual yang mendalam",
    price: 25000,
  },
  {
    id: 2,
    img: "/src/assets/icon/iconCart/image.png",
    title: "Dataset Visual",
    description: "Tambahan data visual yang mendalam",
    price: 25000,
  },
  {
    id: 3,
    img: "/src/assets/icon/iconCart/image.png",
    title: "Dataset Visual",
    description: "Tambahan data visual yang mendalam",
    price: 25000,
  },
];

const Cart = () => {
  const [selectedItems, setSelectedItems] = useState(
    cartItems.map((item) => ({ ...item, selected: false }))
  );

  const selected = selectedItems.filter((item) => item.selected);
  const subtotal = selected.reduce((total, item) => total + item.price, 0);
  const total = subtotal + subtotal * 0.1;

  // useEffect to load Midtrans Snap script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", "SB-Mid-client-QM4rGhnfcyjCT3LL"); // Client Key kamu
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // handlePayment function
  const handlePayment = async () => {
    try {
      const response = await fetch("http://localhost:5000/create-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: `order-${Math.random().toString(36).substr(2, 9)}`,
          grossAmount: total,
          customerDetails: {
            first_name: "Dafa",
            last_name: "gaming",
            email: "dafagaming@gmail.com",
            phone: "08123456789",
          },
        }),
      });

      const transactionData = await response.json();

      // Jalankan Snap pembayaran
      if (transactionData.token) {
        window.snap.pay(transactionData.token, {
          onSuccess: async function (result) {
            console.log("Payment success:", result);
            await fetch("http://localhost:5000/update-transaction", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderId: result.order_id,
                status: "success",
              }),
            });
          },
          onPending: async function (result) {
            console.log("Payment pending:", result);
            await fetch("http://localhost:5000/update-transaction", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderId: result.order_id,
                status: "pending",
              }),
            });
          },
          onError: function (result) {
            console.log("Payment error:", result);
          },
          onClose: function () {
            console.log("Payment popup closed");
          },
        });
      } else {
        console.error("Token Snap tidak ditemukan");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  return (
    <div className="font-poppins">
      <div className="w-full shadow-md bg-white dark:text-white relative z-40">
        <div className="pt-[80px] w-full">
          <Header />
        </div>
        <NavbarSection />
      </div>

      <div className="container mx-auto py-40">
        <h2 className="text-2xl font-semibold mb-4">Keranjang Belanja</h2>
        <p className="mb-4">
          Anda mempunyai {selectedItems.length} item dalam keranjang
        </p>

        {/* Daftar produk di keranjang */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daftar item */}
          <div className="col-span-2 space-y-4">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-gray-100 p-4 rounded-lg shadow-md"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-4"
                    checked={item.selected}
                    onChange={() => handleCheckboxChange(item.id)}
                  />
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="ml-4">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-gray-500">{item.description}</p>
                    <p className="text-gray-700">
                      Rp. {item.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
                <button className="text-red-500">
                  <FaTrashAlt />
                </button>
              </div>
            ))}
          </div>

          {/* Sidebar: Detail Pembayaran */}
          <div className="bg-gray-200 p-6 rounded-lg shadow-md">
            <h4 className="text-gray-950 font-semibold mb-2">
              Detail Pembayaran
            </h4>
            <p className="text-gray-700">
              Subtotal ({selected.length} items): Rp.
              {subtotal.toLocaleString("id-ID")}
            </p>
            <p className="text-gray-700">
              Total (Termasuk PPN 10%): Rp.{total.toLocaleString("id-ID")}
            </p>
            <button
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md"
              onClick={handlePayment}
            >
              Proses Ke Pembayaran
            </button>
          </div>
        </div>
      </div>

      <footer className="bg-darknavy text-white min-h-[181px] flex flex-col items-center justify-center">
        <div className="flex justify-center gap-4 text-[10px] sm:text-[12px] lg:text-[16px] font-semibold mb-8">
          <a href="#">Teams And Conditions</a>
          <a href="#">File Licenses</a>
          <a href="#">Refund Policy</a>
          <a href="#">Privacy Policy</a>
        </div>
        <p className="text-[10px] md:text-[12px]">
          Copyright © 2024 - All right reserved by ACME Industries Ltd
        </p>
      </footer>
    </div>
  );
};

export default Cart;
