export interface Opportunity {
  id: number;
  title: string;
  season: string;
  purchasePrice: number;
  salePrice: number;
  marketplaceFee: number;
  shippingCost: number;
  packagingCost: number;
  demandScore: number;
  competitionScore: number;
  estimatedProfit: number;
  margin: number;
  roi: number;
  score: number;
  recommendation: "BUY" | "TEST" | "WATCH" | "SKIP";
}

export interface StockRow {
  productId: number;
  description: string;
  code: string | null;
  amount: number;
  reserved: number;
  available: number;
  averagePurchasePrice: number;
  salePrice: number;
  inventoryValue: number;
}

export interface Product {
  ID_Product: number;
  Description: string;
  Code: string;
  Brand?: string;
  Category?: string;
  TargetPurchasePrice?: number;
  State: boolean;
  Stock?: Array<{
    Amount: number;
    SalePrice: number;
    AveragePurchasePrice: number;
    Reserved: number;
  }>;
}

export interface Supplier {
  ID_Supplier: number;
  Name: string;
  Contact?: string;
  Phone?: string;
  Website?: string;
}

export interface PurchaseItem {
  ID_PurchaseItem: number;
  ID_Product: number;
  Quantity: number;
  ReceivedQuantity: number;
  UnitCost: number;
}

export interface Purchase {
  ID_Purchase: number;
  ID_Supplier: number;
  Status: "DRAFT" | "ORDERED" | "IN_TRANSIT" | "RECEIVED" | "CANCELLED";
  MerchandiseTotal: number;
  ShippingCost: number;
  Total: number;
  ExpectedDate?: string;
  Supplier?: Supplier;
  Items?: PurchaseItem[];
  createdAt?: string;
}

export interface CapitalSummary {
  id: number;
  name: string;
  initialCapital: number;
  currentCash: number;
  movements: Array<{
    ID_CapitalMovement: number;
    Type: string;
    Amount: number;
    Reference?: string;
    Notes?: string;
    createdAt: string;
  }>;
}

export interface MarketplaceListing {
  ID_Listing: number;
  ID_Product: number;
  Marketplace: "MERCADOLIBRE";
  ExternalId?: string;
  Status: "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";
  Price: number;
  AvailableQuantity: number;
  Permalink?: string;
}

export interface SupplierLead {
  ID_SupplierLead: number;
  ProductQuery: string;
  Name: string;
  Domain: string;
  Url: string;
  Snippet?: string;
  Source: string;
  LeadScore: number;
  PriceHint?: number;
  VerificationStatus: "UNVERIFIED" | "REVIEWED" | "QUOTED" | "REJECTED";
  Notes?: string;
}
