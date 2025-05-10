// types.ts
export type User = {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_admin: boolean;
    is_vendor: boolean;
    image: string;
};

export interface Contact {
    id: number;
    contact_user: User;
    note: string;
}

export type Discount = {
    type: 'percentage' | 'fixed';
    value: string;
    valid_until: string;
};

export type SupplierInfo = {
    supplier_name: string;
    price: string;
    stock_status: string;
    discount: Discount | null;
    final_price: string;
};

export type Product = {
    id: number;
    name: string;
    description: string;
    category: string;
    suppliers_info: SupplierInfo[];
    image: string;
};

export type ShoppingItem = {
    id: number;
    product: Product;
    quantity: number;
    expiration_date: string;
    is_checked: boolean;
};

export type ShoppingList = {
    id: number;
    name: string;
    owner: number;
    shared_with: User[];
    created_at: string;
    uuid: string;
    is_shared: boolean;
    items: ShoppingItem[];
};
