import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { AdminOrders } from "@/components/admin/admin-orders";
import { AdminMenu } from "@/components/admin/admin-menu";
import { AdminCustomers } from "@/components/admin/admin-customers";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Staff Dashboard — Miami Grill" },
      { name: "description", content: "Manage orders, menu and customers." },
      { property: "og:title", content: "Staff Dashboard — Miami Grill" },
      { property: "og:description", content: "Manage orders, menu and customers." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { isStaff, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isStaff) return <div className="py-24 text-center text-muted-foreground">This area is for Miami Grill staff only.</div>;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-black uppercase">Staff dashboard</h1>
      <Tabs defaultValue="orders" className="mt-6">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-6"><AdminOrders /></TabsContent>
        <TabsContent value="menu" className="mt-6"><AdminMenu /></TabsContent>
        <TabsContent value="customers" className="mt-6"><AdminCustomers isAdmin={isAdmin} /></TabsContent>
      </Tabs>
    </div>
  );
}
