import { api } from "./client";
import type { CapitalSummary, MarketplaceListing, Opportunity, Product, Purchase, StockRow, Supplier } from "../types";

export async function getDashboard(){const{data}=await api.get("/dashboard");return data;}
export async function getOpportunities():Promise<Opportunity[]>{const{data}=await api.get("/opportunities");return data;}
export async function analyzeOpportunity(payload:Record<string,number|string>){const{data}=await api.post("/opportunities/analyze",payload);return data as Opportunity;}
export async function getProducts(options?:{includeInactive?:boolean;search?:string}):Promise<Product[]>{const{data}=await api.get("/products",{params:options});return data;}
export async function createProduct(payload:{description:string;code:string;brand?:string;category?:string;targetPurchasePrice?:number;salePrice?:number}){const{data}=await api.post("/products",payload);return data as Product;}
export async function updateProduct(productId:number,payload:{description?:string;code?:string;brand?:string;category?:string;targetPurchasePrice?:number;salePrice?:number;state?:boolean}){const{data}=await api.patch(`/products/${productId}`,payload);return data as Product;}
export async function deactivateProduct(productId:number){const{data}=await api.delete(`/products/${productId}`);return data as{success:boolean;message:string;productId:number};}
export async function getSuppliers():Promise<Supplier[]>{const{data}=await api.get("/suppliers");return data;}
export async function createSupplier(payload:{name:string;contact?:string;phone?:string;website?:string}){const{data}=await api.post("/suppliers",payload);return data as Supplier;}
export async function getSyscomStatus(){const{data}=await api.get("/suppliers/syscom/status");return data as{provider:string;configured:boolean;mode:string;capabilities:Record<string,boolean>};}
export async function searchSyscomProducts(search:string,page=1,limit=30){const{data}=await api.get("/suppliers/syscom/products",{params:{q:search,page,limit,stock:true}});return data as{provider:string;query:string;page:number;limit:number;total:number;products:Array<{provider:string;providerProductId:string;sku:string;title:string;brand?:string|null;category?:string|null;price?:number|null;currency?:string|null;stock?:number|null;imageUrl?:string|null}>};}
export async function getPurchases():Promise<Purchase[]>{const{data}=await api.get("/purchases");return data;}
export async function createPurchase(payload:{supplierId:number;shippingCost:number;expectedDate?:string;items:Array<{productId:number;quantity:number;unitCost:number}>}){const{data}=await api.post("/purchases",payload);return data as Purchase;}
export async function receivePurchase(purchaseId:number,payload:{items:Array<{purchaseItemId:number;receivedQuantity:number}>}){const{data}=await api.post(`/purchases/${purchaseId}/receive`,payload);return data as Purchase;}
export async function getInventory():Promise<StockRow[]>{const{data}=await api.get("/inventory");return data;}
export async function getCapital():Promise<CapitalSummary>{const{data}=await api.get("/capital");return data;}
export async function updateCapitalBudget(capital:number):Promise<CapitalSummary>{const{data}=await api.patch("/capital",{capital});return data;}
export async function getMercadoLibreStatus(){const{data}=await api.get("/marketplaces/mercadolibre/status");return data;}
export async function getMercadoLibreAuthUrl(){const{data}=await api.get("/marketplaces/mercadolibre/auth-url");return data as{url:string};}
export async function getMarketplaceListings():Promise<MarketplaceListing[]>{const{data}=await api.get("/marketplaces/mercadolibre/listings");return data;}
export async function publishMarketplaceListing(payload:{productId:number;listing:Record<string,unknown>}){const{data}=await api.post("/marketplaces/mercadolibre/listings",payload);return data as MarketplaceListing;}
export async function updateMarketplaceListingStock(listingId:number,quantity:number){const{data}=await api.put(`/marketplaces/mercadolibre/listings/${listingId}/stock`,{quantity});return data as MarketplaceListing;}
export async function getRadarCandidates(){const{data}=await api.get("/radar/candidates");return data;}
export async function createRadarCandidate(payload:unknown){const{data}=await api.post("/radar/candidates",payload);return data;}
export async function researchRadarCandidate(candidateId:number){const{data}=await api.post(`/radar/candidates/${candidateId}/research`,{},{timeout:120000});return data;}
export async function setRadarSellingCosts(candidateId:number,payload:{marketplaceShipping:number;packagingCost:number;otherSellingCosts:number;source?:string}){const{data}=await api.patch(`/radar/candidates/${candidateId}/selling-costs`,payload);return data;}
export async function getSupplierOffers(product?:string){const{data}=await api.get("/radar/supplier-offers",{params:product?{product}:undefined});return data;}
export async function createSupplierOffer(payload:unknown){const{data}=await api.post("/radar/supplier-offers",payload);return data;}
export async function getInvestmentRecommendation(payload:unknown){const{data}=await api.post("/radar/recommend",payload);return data;}
export async function getDataSourceStatus(){const{data}=await api.get("/radar/data-sources");return data;}
export async function getCommercialCalendar(){const{data}=await api.get("/radar/commercial-calendar");return data;}
export async function runAutoDiscovery(payload:{categoryId?:string;maxTrends?:number}){const{data}=await api.post("/radar/auto-discovery/run",payload,{timeout:240000});return data;}
export async function getDiscoveryRuns(){const{data}=await api.get("/radar/auto-discovery/runs");return data;}
export async function getMarketSnapshots(keyword?:string){const{data}=await api.get("/radar/snapshots",{params:keyword?{keyword}:undefined});return data;}
export async function getSupplierDiscoveryStatus(){const{data}=await api.get("/radar/supplier-discovery/status");return data;}
export async function runSupplierDiscovery(productQuery:string){const{data}=await api.post("/radar/supplier-discovery/run",{productQuery});return data;}
export async function getSupplierLeads(product?:string){const{data}=await api.get("/radar/supplier-leads",{params:product?{product}:undefined});return data;}
export async function convertSupplierLeadToOffer(leadId:number,payload:{unitPrice:number;moq:number;shippingCost:number;importCost:number;deliveryDays?:number;reliabilityScore?:number}){const{data}=await api.post(`/radar/supplier-leads/${leadId}/convert-to-offer`,payload);return data;}
export async function generatePortfolio(payload?:{availableCapital?:number;reservePct?:number;maxProductPct?:number;maxProducts?:number}){const{data}=await api.post("/portfolio/generate",payload||{});return data;}
export async function getPortfolios(){const{data}=await api.get("/portfolio");return data;}
export async function evaluateAllReplenishment(payload?:{windowDays?:number;leadTimeDays?:number;seasonDaysRemaining?:number;targetCoverDays?:number;minHealthyMarginPct?:number}){const{data}=await api.post("/replenishment/evaluate-all",payload||{});return data;}
export async function evaluateProductReplenishment(productId:number,payload?:{windowDays?:number;leadTimeDays?:number;seasonDaysRemaining?:number;targetCoverDays?:number;minHealthyMarginPct?:number}){const{data}=await api.post(`/replenishment/products/${productId}/evaluate`,payload||{});return data;}
export async function getReplenishmentHistory(){const{data}=await api.get("/replenishment/history");return data;}
export async function evaluateAllLearning(payload?:{windowDays?:number}){const{data}=await api.post("/learning/evaluate-all",payload||{});return data;}
export async function getLearningOutcomes(){const{data}=await api.get("/learning/outcomes");return data;}