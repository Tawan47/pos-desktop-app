export interface Product {
    id: number | string;
    barcode?: string;
    sku?: string;
    name: string;
    brand?: string;
    color?: string;
    size?: string;
    price: number;
    quantity: number;
    isCustom?: boolean;
    category?: string;
}

export interface SaleItem {
    id: number | string;
    name: string;
    price: number;
    qty: number;
    isCustom?: boolean;
}

export interface CustomerInfo {
    name: string;
    phone: string;
    address?: string;
    other?: string;
}

export interface Sale {
    id: string | number;
    invoiceNumber: string;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    extraCost: number;
    total: number;
    paymentMethod: string;
    date: string;
    customer?: CustomerInfo;
}

export interface QuickService {
    id: string | number;
    name: string;
    price: number;
}

export interface ChartDataItem {
    date: string;
    total: number;
    name?: string;
}
