"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { Product, Sale } from '@/types';

interface StoreContextType {
  products: Product[];
  sales: Sale[];
  loading: boolean;
}

const StoreContext = createContext<StoreContextType>({
  products: [],
  sales: [],
  loading: true,
});

export const useStore = () => useContext(StoreContext);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Port 5000 is our NestJS backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socket: Socket = io(API_URL);

    const fetchData = async () => {
      try {
        const [productsRes, salesRes] = await Promise.all([
          axios.get(`${API_URL}/api/products`),
          axios.get(`${API_URL}/api/sales`)
        ]);
        setProducts(productsRes.data);
        setSales(salesRes.data.sort((a: Sale, b: Sale) => Number(b.id) - Number(a.id)));
      } catch (error) {
        console.error('Failed to fetch initial data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    socket.on('product-updated', (updatedProducts: Product[]) => {
      setProducts(updatedProducts);
    });

    socket.on('sale-updated', (updatedSales: Sale[]) => {
      setSales(updatedSales.sort((a: Sale, b: Sale) => Number(b.id) - Number(a.id)));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <StoreContext.Provider value={{ products, sales, loading }}>
      {children}
    </StoreContext.Provider>
  );
}
