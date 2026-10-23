import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import OverviewPage from "@/pages/OverviewPage";
import ProductsPage from "@/pages/ProductsPage";
import PurchasesPage from "@/pages/PurchasesPage";
import SubscriptionsPage from "@/pages/SubscriptionsPage";
import MarginPage from "@/pages/MarginPage";
import SettlementsPage from "@/pages/SettlementsPage";
import ReconciliationPage from "@/pages/ReconciliationPage";
import ProductCategoriesList from "@/pages/productCategories/List";
import ProductCategoriesDetail from "@/pages/productCategories/Detail";
import ProductCategoriesManage from "@/pages/productCategories/Manage";
import ProvidersList from "@/pages/providers/List";
import ProvidersDetail from "@/pages/providers/Detail";
import ProvidersManage from "@/pages/providers/Manage";
import BundlesList from "@/pages/bundles/List";
import BundlesDetail from "@/pages/bundles/Detail";
import BundlesManage from "@/pages/bundles/Manage";
import CatalogProductsList from "@/pages/catalogProducts/List";
import CatalogProductsDetail from "@/pages/catalogProducts/Detail";
import CatalogProductsManage from "@/pages/catalogProducts/Manage";
import MarginsList from "@/pages/margins/List";
import MarginsDetail from "@/pages/margins/Detail";
import MarginsManage from "@/pages/margins/Manage";
import EngineConfigList from "@/pages/engineConfig/List";
import EngineConfigDetail from "@/pages/engineConfig/Detail";
import EngineConfigManage from "@/pages/engineConfig/Manage";
import EngineSignalsList from "@/pages/signals/List";
import EngineSignalsDetail from "@/pages/signals/Detail";
import EngineSignalsManage from "@/pages/signals/Manage";
import ProductTemplatesList from "@/pages/productTemplates/List";
import ProductTemplatesDetail from "@/pages/productTemplates/Detail";
import ProductTemplatesManage from "@/pages/productTemplates/Manage";
import InstancesList from "@/pages/instance/InstancesList";
import InstanceDetail from "@/pages/instance/InstanceDetail";
import LoginPage from "@/pages/auth/LoginPage";
// import RegisterPage from "@/pages/auth/RegisterPage";
import { PublicOnly, RequireAuth } from "@/components/auth/RouteGuards";
import SettingsPage from "@/pages/settings/SettingsPage";
import HistoryClients from "@/pages/history/Clients";
import HistoryEnvironments from "@/pages/history/Environments";
import HistoryCalls from "@/pages/history/Calls";
import ToolsDocuments from "@/pages/tools/Documents";

export default function App() {
    return (
        <Routes>
            <Route element={<PublicOnly />}>
                <Route path="/login" element={<LoginPage />} />
                {/* <Route path="/register" element={<RegisterPage />} /> */}
            </Route>
            <Route element={<RequireAuth />}>
                <Route element={<Layout />}>
                    <Route index element={<Navigate to="/catalog/product-categories" replace />} />
                    <Route path="/overview" element={<OverviewPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/purchases" element={<PurchasesPage />} />
                    <Route path="/subscriptions" element={<SubscriptionsPage />} />
                    <Route path="/margin" element={<MarginPage />} />
                    <Route path="/settlements" element={<SettlementsPage />} />
                    <Route path="/reconciliation" element={<ReconciliationPage />} />

                    <Route path="/catalog/providers" element={<ProvidersList />} />
                    <Route path="/catalog/providers/new" element={<ProvidersManage />} />
                    <Route path="/catalog/providers/:id" element={<ProvidersDetail />} />
                    <Route path="/catalog/providers/:id/edit" element={<ProvidersManage />} />

                    <Route path="/catalog/product-categories" element={<ProductCategoriesList />} />
                    <Route path="/catalog/product-categories/new" element={<ProductCategoriesManage />} />
                    <Route path="/catalog/product-categories/:id" element={<ProductCategoriesDetail />} />
                    <Route path="/catalog/product-categories/:id/edit" element={<ProductCategoriesManage />} />

                    <Route path="/catalog/bundles" element={<BundlesList />} />
                    <Route path="/catalog/bundles/new" element={<BundlesManage />} />
                    <Route path="/catalog/bundles/:id" element={<BundlesDetail />} />
                    <Route path="/catalog/bundles/:id/edit" element={<BundlesManage />} />

                    <Route path="/catalog/products" element={<CatalogProductsList />} />
                    <Route path="/catalog/products/new" element={<CatalogProductsManage />} />
                    <Route path="/catalog/products/:id" element={<CatalogProductsDetail />} />
                    <Route path="/catalog/products/:id/edit" element={<CatalogProductsManage />} />

                    <Route path="/catalog/margins" element={<MarginsList />} />
                    <Route path="/catalog/margins/new" element={<MarginsManage />} />
                    <Route path="/catalog/margins/:id" element={<MarginsDetail />} />
                    <Route path="/catalog/margins/:id/edit" element={<MarginsManage />} />

                    <Route path="/catalog/engine-configuration" element={<EngineConfigList />} />
                    <Route path="/catalog/engine-configuration/new" element={<EngineConfigManage />} />
                    <Route path="/catalog/engine-configuration/:id" element={<EngineConfigDetail />} />
                    <Route path="/catalog/engine-configuration/:id/edit" element={<EngineConfigManage />} />

                    <Route path="/catalog/engine-signals" element={<EngineSignalsList />} />
                    <Route path="/catalog/engine-signals/new" element={<EngineSignalsManage />} />
                    <Route path="/catalog/engine-signals/:id" element={<EngineSignalsDetail />} />
                    <Route path="/catalog/engine-signals/:id/edit" element={<EngineSignalsManage />} />

                    <Route path="/catalog/product-templates" element={<ProductTemplatesList />} />
                    <Route path="/catalog/product-templates/new" element={<ProductTemplatesManage />} />
                    <Route path="/catalog/product-templates/:id" element={<ProductTemplatesDetail />} />
                    <Route path="/catalog/product-templates/:id/edit" element={<ProductTemplatesManage />} />

                    <Route path="/instances" element={<InstancesList />} />
                    <Route path="/instances/:id" element={<InstanceDetail />} />
                    <Route path="/instances/:id/edit" element={<InstanceDetail />} />
                    <Route path="/history" element={<HistoryClients />} />
                    <Route path="/history/:entityId" element={<HistoryEnvironments />} />
                    <Route path="/history/:entityId/:subEntityId" element={<HistoryCalls />} />
                    <Route path="/tools/documents" element={<ToolsDocuments />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}